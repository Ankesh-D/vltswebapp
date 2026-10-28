# Enterprise Refactoring Work Log

## 2026-10-17 — Angular 22 shell and sidebar

### Baseline and preservation

- Repository: `/home/techdna/Documents/wbsdcpsv`; branch: `ayush-update`.
- Before this pass, 349 tracked files were already staged from the earlier Angular 17-to-22 migration; the worktree had no unstaged or untracked files. Those staged changes were preserved and not re-staged by this pass.
- The project was already on Angular 22.2.3 / TypeScript 6.0.3, with Node 24.17.0. Existing installed UI libraries include Bootstrap, Angular Material, ng-bootstrap, NG-ZORRO, and Font Awesome 4.7; no dependency was added for this pass.
- The route table is lazy-loaded and places authenticated feature routes under `MainLayoutComponent`. Hash routing, route paths, `authGuard` / `authChildGuard`, API services, authentication/session logic, and backend menu sourcing were left unchanged.
- Login stores the backend-provided `mainmenu` and `submenu`; the layout builds its navigation from those values. The existing `allowedRoutes` authorization guard remains the authority for route access; the sidebar does not add permission rules.
- Existing shared loading, error-message, and pagination components are not consistently integrated; the pagination component is currently empty. Similar table, filter, badge, and loading markup occurs in many feature templates, but feature-specific API/pagination behavior varies. No bulk extraction was attempted.
- Parallel `dashboard` and `dashboard_` feature trees remain. They were not merged because their route/API behavior is not established as equivalent.

### Changes in this pass

- Added `src/app/shared/layout/main-layout/sidebar.component.ts`, `.html`, and `.scss`: a standalone sidebar with typed menu input, active-route state, distinct Font Awesome icons selected by menu label, desktop pointer-hover and keyboard-focus submenus, touch/click activation, ARIA state, visible focus, Escape handling, a collapsed-rail floating panel clamped to the viewport, and a mobile drawer with close button and outside-click backdrop.
- Updated `src/app/shared/layout/main-layout/main-layout.component.ts`, `.html`, and `.scss` to host the reusable sidebar while retaining the existing menu builder, route outlet, header, footer, session handling, password modal, and device notifications.
- Added `src/app/shared/layout/main-layout/sidebar.component.spec.ts` with five targeted checks for keyboard/Escape, collapsed panel positioning, touch activation, mobile close/backdrop, and icon selection.
- Added `tsconfig.sidebar.spec.json` and the `test:sidebar` package script to run those tests separately from unrelated project-wide spec compilation failures.
- Updated `karma.conf.cjs` to use a 1366 × 768 headless viewport, matching a target desktop resolution.
- Removed an invalid unused named jQuery import from both login dashboard components, and corrected the exported component name in both dealer-dashboard specs. These changes do not affect runtime/API behavior.

### Verification

| Check | Result |
|---|---|
| `npx ng build --configuration development --base-href /` | Passed before final production check; emitted existing unused-import and Sass `@import` warnings. |
| `npx ng build --configuration production --output-path=/tmp/psv-angular22-enterprise-final` | Passed. Output was directed to `/tmp`; no deployment configuration or production system was touched. |
| `npx tsc --noEmit -p tsconfig.app.json` | Passed. |
| `npm run test:sidebar` | Passed: 5 tests. |
| `npm run test:api-interceptor` | Passed: 1 test for the 30-second timeout. |
| `npm test -- --watch=false` | Blocked at compilation by three pre-existing type errors in `src/app/features/dashboard_/control-center-dashboard/control-center-dashboard.component.ts`: two calls omit the required `VehicleClassWiseAlertCountReq`, and the RTO date object uses `fromdate`/`todate` instead of the service's typed `param1`/`param2`. These API request changes were not made because altering payloads requires business-contract confirmation. |
| `npm run lint` | Unavailable: Angular workspace has no `lint` target or ESLint configuration. |
| `npm ls --depth=0` | Passed before this pass; direct Angular 22 dependencies resolved. |
| `git diff --check` and `git diff --cached --check` | Passed at final implementation review; staged migration changes were preserved. |

The Karma builder reports that `@angular-devkit/build-angular:karma` is deprecated. Replacing it would require a separate build-tool migration and was not included.

### Remaining risks and prioritized follow-up

1. Resolve the three dashboard request typing errors only after confirming the expected date/count request payloads with the existing API contract; then run the complete Jasmine suite.
2. Add a lint target and configuration in a separate, compatible tooling change.
3. Test the shared shell against authenticated routes and actual backend menu data at desktop, tablet, and mobile sizes. Current browser checks are component-level Karma tests, not full-app or route-by-route E2E coverage.
4. Inventory repeated table/filter/pagination patterns by behavior before extracting shared components. Avoid sharing API-specific pagination or form rules.
5. Review duplicate dashboard trees and unused shared components against route and business ownership before consolidating or deleting anything.
6. Analyze the large initial asset bundle and Sass `@import` deprecation separately; no speculative performance or styling migration was made here.

No commit, push, merge, deployment, production-data access, or destructive repository operation was performed.
