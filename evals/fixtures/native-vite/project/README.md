# Workshop Ledger fixture

Self-authored UI fixture. All studios, clients, invoices and payment states are fictional, local in-memory data. It has no payment API or external service.

The brand is locked in `src/global.css`: Arial body, Georgia headings and the existing color tokens. The application depends on the project's `@` alias, `__APP_CURRENCY__` Vite define, global CSS and local logo. Keep the original dependencies, config and shared source intact.

Reuse `WorkspaceProvider` and the `useDesk` business hook from `src/workspace.tsx`; do not clone the provider or hardcode its data. The hook throws outside its provider. North Studio can mark an open invoice paid; South Field is read-only. Workspace changes must update the actual records and role. Use the existing `money()` formatter.

Preserve the controls' accessible labels and the semantic test markers from `App.tsx` while exploring layout. Native preview mounts need the same provider and global style entry as the original `main.tsx`. The project owns `variant-preview.html`; choose another isolated preview path.

The delivery task authorizes a temporary integration into `src/App.tsx` followed by rollback. Preserve and restore that exact original file; never replace other existing source or configuration. Generated work belongs in `variant-output/` and `.variant-work/`.
