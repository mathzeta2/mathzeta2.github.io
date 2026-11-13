-- Lean 4 introductory examples for zeta2's blog.
-- Open in a project that includes Mathlib.
import Mathlib

namespace ZetaLeanIntro

theorem chain (P Q R : Prop) (hPQ : P → Q) (hQR : Q → R) : P → R := by
  intro hP
  exact hQR (hPQ hP)

theorem swapAnd (P Q : Prop) (h : P ∧ Q) : Q ∧ P := by
  constructor
  · exact h.2
  · exact h.1

theorem doubleWitness (n : Nat) : ∃ m : Nat, m = n + n := by
  exact ⟨n + n, rfl⟩

theorem swapThenAddOne (a b : Nat) : (a + b) + 1 = (b + a) + 1 := by
  rw [Nat.add_comm a b]

theorem squareShift (x : ℝ) : (x + 2) ^ 2 = x ^ 2 + 4 * x + 4 := by
  ring

#print axioms chain
#print axioms swapAnd
#print axioms doubleWitness
#print axioms swapThenAddOne
#print axioms squareShift

end ZetaLeanIntro
