# UI/UX Specification

## Design Concept
Based on the visual reference and RNF-02, the Dashboard utilizes a **Premium Bank** dark theme layout. It is minimalistic, highly legible, and uses strict color contrast.

## Color Palette & Typography
* **Background:** Dark Navy/Slate (e.g., `#151B2B` or similar dark tone).
* **Surface/Panels:** Slightly lighter dark slate for content separation.
* **Accent Color:** Cyan/Teal (e.g., `#38BDF8`). Used for the primary active menu indicator, the '+ Pedir Reseña' button, and star ratings.
* **Text:** White/Light Gray for primary text, muted gray for secondary text and table headers.

## Layout Components (Dashboard - Centro de Reseñas)

### 1. Sidebar (Side Menu)
* **Status:** Collapsible.
* **Navigation Items:**
  * `Reseñas` (Active state highlighted with Accent Color)
  * `Usuarios`
  * `Configuración`
* **Footer Items:** `Mi Perfil`, `Cerrar Sesión`.

### 2. Top Header
* **Breadcrumbs:** `Dashboard / Centro de Reseñas`
* **User Profile Widget:** Displays Notification Bell icon, User Name, Role (`ADMINISTRADOR`), and User Avatar (Initials).

### 3. Main Content Area (Review Management)
* **Navigation Tabs:** `Bandeja de Entrada` (Active) | `Por Evaluar`
* **Action Bar:**
  * Search Input: `Buscar en reseñas...`
  * Dropdowns: `Columnas`, Filters (`Todos`)
  * Primary Action Button: `+ Pedir Reseña` (Accent Color).
* **Data Table:**
  * Columns: `FECHA`, `CLIENTE`, `CALIF.` (Star icons), `RESEÑA` (Snippet of text), `ESTADO`.
  * Status Badges: 
    * `Aprobado`: Hollow badge with green text/border.
    * `Pendiente`: Hollow badge with orange/warning text/border.
* **Pagination Footer:** Rows per page selector (`Mostrar 10`), item counter (`Mostrando 1 al 10 de 11`), and `< Anterior` / `Siguiente >` buttons.
