# Engine Review System

Sistema completo de gestion de resenas y prueba social para **Inmobiliarte 22 / Easy Broker**.

Incluye:
- **Dashboard interno** (Vue 3 + Vite + Tailwind) para moderar resenas, generar enlaces, gestionar usuarios y configuracion.
- **Backend headless** en Google Apps Script + Google Sheets.
- Endpoints publicos listos para un **widget embebible** (carousel de resenas aprobadas).

---

## Arquitectura

```
[ Vue 3 Dashboard ]  ----POST JSON---->  [ Google Apps Script WebApp ]
        |
        +-- Auth: OTP por correo + JWT (24h)
        +-- RBAC por roles
        +-- Sheets: Whitelist, Tokens, Resenas, Configuracion
```

### Roles y permisos

| Rol            | Permisos |
|----------------|----------|
| ADMINISTRADOR  | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena, gestionar_usuarios, configurar_sistema |
| SUPERVISOR     | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena |
| APROBADOR      | ver_dashboard, editar_resena |
| USUARIO        | ver_dashboard, generar_enlace, ver_seguimientos |

### Hojas de calculo (GAS)

| Hoja           | Uso |
|----------------|-----|
| Whitelist      | Usuarios (UserId, Nombre, Email, Estado, Rol) |
| Tokens         | Enlaces de solicitud de resena (seguimiento) |
| Resenas        | Resenas recibidas |
| Configuracion  | Key-Value (Empresa_Nombre, Color_Primario, Logo_*, URL_Frontend_App) |

---

## Frontend

### Stack
- Vue 3 (`<script setup>`)
- Vite 8
- Tailwind CSS 3
- SweetAlert2

### Desarrollo local

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

La URL del backend se define en `src/services/api.js`.

---

## Backend (Google Apps Script)

El codigo fuente vive en la carpeta `backend/`.

### Secretos (obligatorio)

**No** se suben secretos al repositorio. Configuralos en:

> Apps Script -> Project Settings -> Script properties

| Property            | Descripcion |
|---------------------|-------------|
| SECRET_JWT          | Firma JWT de sesion |
| SECRET_FIRMA        | Firma de los enlaces de resena |
| RECAPTCHA_PROJECT   | Project ID reCAPTCHA Enterprise |
| RECAPTCHA_API_KEY   | API Key reCAPTCHA |
| RECAPTCHA_SITE_KEY  | Site Key reCAPTCHA |
| GEMINI_API_KEY      | API Key Gemini |

Ver `backend/README.md` para el detalle de despliegue.

---

## Reglas de diseno (proyecto)

1. Cero logica de negocio pesada en frontend
2. Cero mocks / datos falsos
3. RBAC por permisos reales
4. Mobile-first (44x44 px touch targets)
5. Modularidad de vistas
6. Login OTP-only (no hay cambio de contrasena en Perfil)

---

## Estructura del repo

```
backend/                 # Codigo fuente Google Apps Script
src/
  components/
    layout/              # DashboardLayout
    ui/                  # DataTable, BaseButton, BaseModal, ...
  composables/           # useAuth
  services/              # api.js
  views/
    admin/               # UsuariosView, SistemaView, ConfigView
    auth/                # LoginView
    core/                # ResenasView, GenerarResenaModal
    user/                # PerfilView
```
