# UI/UX Specification — Dashboard

Alineado al frontend Vue 3 + Tailwind del snapshot y a RNF-07/RNF-08.

## Design principles

* Mobile-first; controles principales con área táctil generosa (~44px).
* Color de marca dinámico (`--brand-color` desde `Color_Primario`).
* Soporte **light / dark** (`class="dark"` en `html`, preferencia sistema o `localStorage.theme`).
* Componentes base reutilizables: `BaseButton`, `BaseInput`, `BaseSelect`, `BaseModal`, `BaseStarRating`, `DataTable`, `StatusBadge`, `EmptyState`.

## Structure

### Auth — LoginView

* Paso 1: email → `request_otp`.
* Paso 2: OTP 6 dígitos → `verify_otp` → emite `login-success`.
* Logo: vertical → horizontal → inicial del nombre de empresa.

### Shell — DashboardLayout

* Sidebar colapsable con entradas condicionadas por `hasPermission`.
* Áreas típicas: Reseñas, Seguimientos / tokens, Usuarios (gestión), Configuración / Sistema, Perfil.
* Header: notificaciones (conteos de `get_user_info`), identidad, logout.

### Core

* **ResenasView:** tabla de reseñas, filtros, badges de estado (Pendiente / Aprobado / Archivado), edición de respuesta, estrellas.
* **GenerarResenaModal:** nombre + servicio → `generate_link` → muestra URL (QR / share: mejora planificada).

### Admin / User

* **UsuariosView:** listado Whitelist, alta (id, nombre, email, rol, logo), cambio de estado.
* **ConfigView / SistemaView:** edición de KV de marca y parámetros de sistema.
* **PerfilView:** datos de sesión; **sin** cambio de contraseña (OTP-only).

## Status badges

| Estado reseña | Tratamiento visual sugerido |
| :---- | :---- |
| Pendiente | Badge warning / ámbar |
| Aprobado | Badge success / verde |
| Archivado | Badge neutro |

## Accessibility (objetivo)

* Contraste legible en light/dark.
* Labels en formularios de login y alta.
* Meta WCAG 2.1 AA como objetivo de evolución (RNF previo); no bloqueante del snapshot.

## Out of scope en este snapshot de UI

* Widget público embebible completo (la API pública sí existe).
* Generación de QR y Web Share API en el modal de enlace (documentados como mejora).
