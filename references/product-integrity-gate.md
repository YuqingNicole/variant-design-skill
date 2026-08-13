# Product Integrity Gate

Run after the visual quality gate for product-critical UI. Product constraints outrank aesthetic defaults.

## P0 — block

- User, primary job, or success moment is undefined (except explicit visual exploration).
- Real, mock, and AI-inferred data are presented without distinction.
- Deletion, payment, permissions, financial/medical advice, or another high-stakes action lacks consequence disclosure, confirmation, or recovery.

## P1 — fix before write

- The first view does not make the next action clear.
- Loading, empty, or error behavior is absent.
- Visual emphasis conflicts with the declared hierarchy.
- Page-specific styling bypasses confirmed tokens/components.

## P2 — refine

- Motion, gradient, glass, shadow, or decoration has no information/feedback role.
- Styling harms density, readability, accessibility, or task speed.

## Report

```text
Product Integrity: pass | conditional | block
P0: 0 · P1: 1 · P2: 2
Fix next: [the shortest concrete next step]
```
