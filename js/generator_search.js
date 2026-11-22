(() => {
  const searchInput = _$("#reimu-search-input");
  const searchResult = _$("#reimu-hits");
  const pagination = _$("#reimu-pagination");
  const itemsPerPage = 10;
  let currentPage = 1;

  searchInput.insertAdjacentHTML(
    "beforeend",
    '<form id="search-form"><input type="text" id="search-text" aria-label="搜索文章" placeholder="搜索文章，按回车确认"></form>'
  );
  const form = _$("#search-form");
  const input = _$("#search-text");
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.hidden = true;
  const statusText = document.createElement("span");
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "重试";
  retry.hidden = true;
  status.append(statusText, retry);
  searchInput.appendChild(status);
  let indexPromise = null;
  let searchSequence = 0;

  function showStatus(message, canRetry = false) {
    statusText.textContent = message;
    retry.hidden = !canRetry;
    status.hidden = !message;
  }

  // Opening search is the first point where the full-text index is needed.
  // Reuse one pending/resolved request, but allow another attempt after failure.
  function loadIndex() {
    if (indexPromise) return indexPromise;
    showStatus("正在加载搜索索引…");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    indexPromise = fetch("/search.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Search index unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid search index");
        showStatus("");
        return data;
      })
      .catch((error) => {
        indexPromise = null;
        showStatus("搜索索引加载失败，请重试。", true);
        throw error;
      })
      .finally(() => clearTimeout(timer));
    return indexPromise;
  }

  async function search() {
    const sequence = ++searchSequence;
    const inputText = input.value.trim();
    currentPage = 1;
    searchResult.innerHTML = "";
    pagination.innerHTML = "";
    if (!inputText) {
      showStatus("");
      return;
    }
    try {
      // A submit during the initial request waits for that same request.
      const data = await loadIndex();
      if (sequence !== searchSequence) return;
      const query = inputText.toLowerCase();
      const hits = data.filter((post) => (
        (post.title && post.title.toLowerCase().includes(query)) ||
        (post.content && post.content.toLowerCase().includes(query))
      ));
      showStatus(hits.length ? `找到 ${hits.length} 篇文章。` : "没有找到匹配的文章。");
      const totalPages = Math.ceil(hits.length / itemsPerPage);
      const pages = document.createElement("ul");
      pages.className = "ais-Pagination-list pagination";
      pagination.appendChild(pages);
      for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement("li");
        pageItem.className = "ais-Pagination-item pagination-item ais-Pagination-item--page";
        const link = document.createElement("a");
        link.className = "ais-Pagination-link page-number";
        link.href = "#";
        link.setAttribute("aria-label", `Page ${i}`);
        link.textContent = String(i);
        if (i === currentPage) pageItem.classList.add("ais-Pagination-item--selected", "current");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          currentPage = i;
          for (const item of pages.children) item.classList.remove("ais-Pagination-item--selected", "current");
          pageItem.classList.add("ais-Pagination-item--selected", "current");
          displayHits(hits, currentPage, itemsPerPage);
        });
        pageItem.appendChild(link);
        pages.appendChild(pageItem);
      }
      displayHits(hits, currentPage, itemsPerPage);
    } catch (_) {
      // loadIndex provides the accessible retry message.
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
  });
  retry.addEventListener("click", () => {
    if (input.value.trim()) search();
    else loadIndex().catch(() => {});
  });

  function displayHits(hits, page, itemsPerPage) {
    searchResult.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    hits.slice(start, end).forEach((hit) => {
      searchResult.insertAdjacentHTML(
        "beforeend",
        `<a href="${hit.url}" class="reimu-hit-item-link" title="${hit.title || ""}">${hit.title}</a>`
      );
    });
  }

  _$(".popup-trigger")
    .off("click")
    .on("click", (event) => {
      event.stopPropagation();
      const scrollWidth =
        window.innerWidth - document.documentElement.offsetWidth;
      _$("#container").style.marginRight = scrollWidth + "px";
      _$("#header-nav").style.marginRight = scrollWidth + "px";
      const popup = _$(".popup");
      popup.classList.add("show");
      loadIndex().catch(() => {});
      _$("#mask").classList.remove("hide");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        (_$("#reimu-search-input input"))?.focus();
      }, 100);
      const keydownHandler = (e) => {
        const focusables = popup.querySelectorAll(
          "input, [href], button:not([hidden])"
        );
        const firstFocusable = focusables[0];
        const lastFocusable = focusables[focusables.length - 1];
        if (e.key === "Escape") {
          closePopup();
        } else if (e.key === "Tab" && focusables.length) {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      };
      document.addEventListener("keydown", keydownHandler);
      function closePopup() {
        popup.classList.remove("show");
        _$("#mask").classList.add("hide");
        _$("#container").style.marginRight = "";
        _$("#header-nav").style.marginRight = "";
        document.body.style.overflow = "";
        document.removeEventListener("keydown", keydownHandler);
        _$("#nav-search-btn")?.focus();
      }
      popup.__closePopup = closePopup;
    });

  _$(".popup-btn-close")
    .off("click")
    .on("click", () => {
      _$(".popup").__closePopup?.();
    });
})();
