# zeta2 的博客

数学笔记、证明与代码，也留一点空间给交界地。

**[进入博客](https://mathzeta2.github.io/)** · [文章归档](https://mathzeta2.github.io/archives/) · [入门教程](https://mathzeta2.github.io/categories/入门教程/) · [关于我](https://mathzeta2.github.io/about/)

## 关于这个博客

你好，我是 **zeta2**，一名数学专业的硕士研究生。

这里用来整理数学学习中的习题、证明和课程笔记，也记录数学工具的入门实践：用 **LaTeX** 排版，用 **Manim** 展示数学，用 **Lean** 检查证明。

博客以《艾尔登法环》为视觉主题，希望这里既是方便查阅的笔记本，也是一个愿意慢慢逛的地方。

## 从这里开始

### 数学笔记

- [应用泛函分析习题集：从度量空间到基本定理](https://mathzeta2.github.io/2026/11/10/applied-functional-analysis-exercises/)
- [从极限到中值定理：2025—2026 高数 A（上）期中试题与详解](https://mathzeta2.github.io/2026/11/10/calculus-midterm-2025-2026-solutions/)
- [微分与中值定理：第九周作业参考解答](https://mathzeta2.github.io/2026/11/10/week-09-differentials-and-mean-value-theorems/)

### 入门教程

| 工具 | 文章 | 内容 |
| --- | --- | --- |
| LaTeX | [写出第一份中文数学笔记](https://mathzeta2.github.io/2026/11/13/latex-beginner-guide/) | 安装环境、中文排版、公式与完整示例 |
| Manim | [从第一个动画到导数可视化](https://mathzeta2.github.io/2026/11/13/manim-beginner-guide/) | 环境配置、基础动画与数学可视化 |
| Lean 4 | [从数学证明到可检查的代码](https://mathzeta2.github.io/2026/11/13/lean4-formalization-guide/) | 形式化证明入门与可运行示例 |

## 阅读体验

- **数学排版**：支持公式显示，部分文章附有 PDF，方便下载阅读。
- **内容检索**：通过搜索、分类、归档和文章目录定位内容。
- **阅读辅助**：提供阅读进度、书签收藏和阅读助手。
- **文章互动**：接入 Giscus 评论，并显示各篇文章的阅读量。
- **交界地主题**：定制背景、图标、鼠标指针和可互动的菈妮角色，搭配“交界地之声”音乐卡片。

评论、音乐和阅读统计依赖外部服务，加载情况会受网络影响；部分音乐仅提供试听。

## 技术与仓库说明

博客使用 [Hexo](https://hexo.io/) 生成，以 [Reimu](https://github.com/D-Sketon/hexo-theme-reimu) 为基础主题，并部署于 GitHub Pages。数学公式由 [KaTeX](https://katex.org/) 渲染，评论使用 [Giscus](https://giscus.app/)，全站访问统计使用[不蒜子](https://busuanzi.ibruce.info/)，文章阅读量使用支持显式页面地址的 [Busuanzi（xcsoft）](https://github.com/soxft/busuanzi)。

**本仓库存放生成后的静态站点文件。** 文章源稿、Hexo 配置与主题定制在本地源工程中维护，因此克隆本仓库后不能直接通过 `npm install` / `hexo generate` 重建博客。

| 路径 | 内容 |
| --- | --- |
| `2026/` | 按日期组织的文章页面 |
| `archives/`、`categories/`、`tags/` | 归档、分类与标签页面 |
| `downloads/` | 文章附件与示例资源 |
| `css/`、`js/`、`images/` | 页面样式、交互脚本与图片资源 |
| `search.json` | 站内搜索索引 |

## 交流与致谢

欢迎在文章评论区交流，也可以通过 [Issues](https://github.com/mathzeta2/mathzeta2.github.io/issues) 反馈公式错误、失效链接或页面问题。反馈时请附上文章地址和具体位置，方便核对。

感谢 Hexo、Reimu、KaTeX、Giscus 等项目及其维护者。博客中的游戏相关素材来自《艾尔登法环》等原始来源，相关权利归各自权利人所有；引用的课程材料与第三方资料以文章中的来源说明为准。
