# ARCHITECTURE DEBT & STATE MACHINE: ENGINE-REVIEW-SYSTEM

## 1. PRE-PRODUCTION EVALUATION (KEEP)
- [src/components/ui/] -> Shared presentational primitives (Base*, DataTable, StatusBadge, SkeletonBlock). Correct Vue 3 boundary: dumb UI, no domain API calls.
- [src/components/layout/DashboardLayout.vue] -> Single shell for authenticated dashboard; keeps route-less SPA lean under Vite.
- [src/services/api.js + thin-client rule] -> All aggregation/validation stays in GAS; frontend only dispatches actions.
- [src/composables/useAuth.js] -> Cross-cutting auth state outside views; avoids prop-drilling.
- [src/views/{core,admin,user,public,auth}/] -> Domain folders by actor/concern; good for feature isolation.
- [src/utils/tokenEstado.js + tests/] -> Pure helpers + unit tests; keep pure logic out of SFCs.
- [docs/architecture/, backend/] -> Spec/backend co-located; do not collapse into frontend tree.

## 2. COMPONENT DEBT MATRIX (REFACTOR)

### Symptom 1: Modal Duplication & Coupling
Root cause: Domain views still own residual modal markup. `GenerarResenaModal.vue` and user add/edit modals are extracted with v-model. Remaining: inline manage-review `BaseModal` inside `ResenasView.vue`.

- [x] `src/views/core/GenerarResenaModal.vue` | Status: [COMPLETED] | Change Needed: Single public API confirmed (defineModel + emit success with URL).
- [x] `src/views/core/ResenasView.vue` | Status: [COMPLETED] | Change Needed: Extracted manage-review BaseModal into GestionResenaModal.vue; view only wires table + permissions.
- [x] `src/views/admin/UsuariosView.vue` | Status: [COMPLETED] | Change Needed: Add/edit fully composed via UsuarioAddModal / UsuarioEditModal; no residual form logic.
- [x] `src/components/ui/BaseModal.vue` | Status: [COMPLETED] | Change Needed: Slot-only chrome confirmed (header-icon, header-extra, default, footer); defineModel; no domain fields.

### Symptom 2: DataTable Visual Drift
Root cause: Shared DataTable contract is frozen. Views now use consistent mobile-preview-count, filter chips, and StatusBadge-only status cells. SistemaView no longer hosts a token table.

- [x] `src/components/ui/DataTable.vue` | Status: [COMPLETED] | Change Needed: Visual contract frozen (h-14 rows, chip filters, header-actions/cell-*/actions slots).
- [x] `src/views/core/ResenasView.vue` | Status: [COMPLETED] | Change Needed: Review + tracking tables aligned; StatusBadge-only; mobile-preview-count=3.
- [x] `src/views/admin/UsuariosView.vue` | Status: [COMPLETED] | Change Needed: Filter/header-action patterns matched; StatusBadge-only; actions in #actions slot.
- [x] `src/views/admin/SistemaView.vue` | Status: [COMPLETED] | Change Needed: Token table removed (identity/config only); density no longer applicable.

### Symptom 3: Skeleton Visual Decoupling
Root cause: SkeletonBlock now provides geometry-matched variants (table, tokens, bento, sistema, perfil, form). Views consume the matching variant; CLS risk reduced.

- [x] `src/components/ui/SkeletonBlock.vue` | Status: [COMPLETED] | Change Needed: Variants mirror targets (table toolbar+rows, bento 2+6, sistema, perfil, form); rows semantics documented.
- [x] `src/views/core/ResenasView.vue` | Status: [COMPLETED] | Change Needed: Skeleton only when loading; variant=table / tokens matches DataTable chrome.
- [x] `src/views/core/DashboardHomeView.vue` | Status: [COMPLETED] | Change Needed: Single bento skeleton path; no conflicting branches.
- [x] `src/views/admin/UsuariosView.vue` | Status: [COMPLETED] | Change Needed: table skeleton row count matches DataTable body.
- [x] `src/views/admin/SistemaView.vue` | Status: [COMPLETED] | Change Needed: variant=sistema matches identity/form silhouette.
- [x] `src/views/user/PerfilView.vue` | Status: [COMPLETED] | Change Needed: variant=perfil matches profile card fields.

## 3. STRICT REFACTORING PROTOCOL & TOKEN MITIGATION
- Rule 1: The AI must tackle only ONE target file at a time.
- Rule 2: The AI CANNOT write code until the user explicitly responds with: "AUTHORIZATION APPROVED FOR [FILE_PATH]".
- Rule 3: The AI must never rewrite unchanged code. Use `// ... existing code ...` placeholders.
- Rule 4: Upon generating a fix, the AI must output the updated line of this document changing the status from [PENDING] to [COMPLETED].
