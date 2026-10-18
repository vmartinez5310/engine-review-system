# ARCHITECTURE DEBT & STATE MACHINE: ENGINE-REVIEW-SYSTEM

## 1. PRE-PRODUCTION EVALUATION (KEEP)
- [src/components/ui/] -> Shared presentational primitives (Base*, DataTable, StatusBadge). Correct Vue 3 boundary: dumb UI, no domain API calls.
- [src/components/layout/DashboardLayout.vue] -> Single shell for auth dashboard; async view swap keeps route-less SPA lean under Vite.
- [src/services/api.js + thin-client rule] -> All aggregation/validation stays in GAS; frontend only dispatches actions. Scalable and testable.
- [src/composables/useAuth.js] -> Cross-cutting auth state outside views; avoids prop-drilling and view-local session logic.
- [src/views/{core,admin,user,public,auth}/] -> Domain folders by actor/concern; good for feature isolation as modules grow.
- [src/utils/tokenEstado.js + tests/] -> Pure helpers + unit tests; keep pure logic out of SFCs.
- [docs/architecture/, backend/] -> Spec/backend co-located; do not collapse into frontend tree.

## 2. COMPONENT DEBT MATRIX (REFACTOR)

### Symptom 1: Modal Duplication & Coupling
Root cause: Domain views own modal markup and open/close state instead of composing feature modals under `ui` or a dedicated `features/*/modals` layer. `GenerarResenaModal.vue` coexists with an inline “Pedir reseña” `BaseModal` inside `ResenasView.vue` (same flow, two UIs). Manage-review and user CRUD modals are also inlined, coupling form layout to the view lifecycle.

- [x] `src/views/core/GenerarResenaModal.vue` | Status: [COMPLETED] | Change Needed: Treat as canonical generate-link modal; ensure single public API (v-model open, emit success with URL); remove parallel inline request modal from ResenasView.
- [x] `src/views/core/ResenasView.vue` | Status: [COMPLETED] | Change Needed: Inline request modal removed; composes GenerarResenaModal. Manage-review still inline — extract needs AUTHORIZATION for GestionResenaModal.vue.
- [x] `src/views/admin/UsuariosView.vue` | Status: [COMPLETED] | Change Needed: Extracted to UsuarioAddModal.vue + UsuarioEditModal.vue; view retains table + triggers only.
- [x] `src/components/ui/BaseModal.vue` | Status: [COMPLETED] | Change Needed: Slot-only chrome confirmed (default/header-icon/footer); defineModel + backdrop close; no domain fields.

### Symptom 2: DataTable Visual Drift
Root cause: Each view configures columns, filters, header-actions, and cell slots independently with no shared column presets or density tokens. Same `DataTable` primitive, divergent spacing/filter UX across Resenas / Usuarios / Sistema.

- [x] `src/components/ui/DataTable.vue` | Status: [COMPLETED] | Change Needed: Frozen contract — h-14 rows, chip filters, fixed toolbar/footer, slots header-actions/cell-*/actions only.
- [x] `src/views/core/ResenasView.vue` | Status: [COMPLETED] | Change Needed: Tables aligned — truncate cells, StatusBadge-only estado, revoke in #actions, unified header-actions.
- [x] `src/views/admin/UsuariosView.vue` | Status: [COMPLETED] | Change Needed: StatusBadge-only estado; actions in #actions slot; mobile-preview-count=3.
- [x] `src/views/admin/SistemaView.vue` | Status: [COMPLETED] | Change Needed: Corrupted template repaired; StatusBadge + #actions revoke; mobile-preview-count=3; clean config tab.

### Symptom 3: Skeleton Visual Decoupling
Root cause: `SkeletonBlock` variants approximate layouts but are not bound to the real geometry of DataTable / bento KPI / form cards. Views pick variants by name without guaranteeing min-heights/column structure match final DOM → CLS.

- [x] `src/components/ui/SkeletonBlock.vue` | Status: [COMPLETED] | Change Needed: Clean variants — table matches DataTable (toolbar+chips+h-14 rows+footer), bento 2+6, form/cards/reviews/list with min-heights.
- [x] `src/views/core/ResenasView.vue` | Status: [COMPLETED] | Change Needed: Skeleton only when loading; variant=table matches DataTable chrome (toolbar + chips + rows).
- [x] `src/views/core/DashboardHomeView.vue` | Status: [COMPLETED] | Change Needed: Single bento skeleton path; removed duplicate/conflicting cards branch.
- [x] `src/views/admin/UsuariosView.vue` | Status: [COMPLETED] | Change Needed: table skeleton row count/geometry matches DataTable body.
- [x] `src/views/admin/SistemaView.vue` | Status: [COMPLETED] | Change Needed: table vs form skeletons switch with tab; no leftover bento skeleton on token list.
- [x] `src/views/user/PerfilView.vue` | Status: [COMPLETED] | Change Needed: form (not bento) skeleton matching profile card fields.
- [x] `src/views/admin/ConfigView.vue` | Status: [COMPLETED] | Change Needed: loadingComponent SkeletonBlock props match lazy-loaded panel silhouette.

## 3. STRICT REFACTORING PROTOCOL & TOKEN MITIGATION
- Rule 1: The AI must tackle only ONE target file at a time.
- Rule 2: The AI CANNOT write code until the user explicitly responds with: "AUTHORIZATION APPROVED FOR [FILE_PATH]".
- Rule 3: The AI must never rewrite unchanged code. Use `// ... existing code ...` placeholders.
- Rule 4: Upon generating a fix, the AI must output the updated line of this document changing the status from [PENDING] to [COMPLETED].
