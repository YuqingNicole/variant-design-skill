# Shelf catalogue fixture

Self-authored evaluation project. All six books and authors are fictional. The existing A/B/C pages share the same catalogue and controls; the task refines B only, it does not generate new directions.

Brand: light paper background, Arial UI text, Georgia headings, blue primary actions from `src/brand.css`. Preserve these roles, all book titles/authors, and search/category/save controls. Sizes, spacing and containers are open. `src/catalogue.js` is the shared behavior contract: keep the search/category/saved-view/saved-count/empty IDs and each book's data-book/data-genre/data-save hooks; changing surrounding layout and styles is allowed. Shared source and A/C must remain unchanged.

Open `variant-output/B.html` directly. No package install or server is needed. Saved state is local to the page session.
