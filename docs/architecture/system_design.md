# System Architecture — Engine Review System

## High-level overview

Two surfaces share one headless API (Google Apps Script Web App):

1. **Public surface** — widget / formulario de reseña (token en URL) + listado público de reseñas aprobadas.
2. **Admin Dashboard** — Vue 3 SPA: OTP login, moderación, enlaces, usuarios, configuración, perfil.

Persistencia: **Google Sheets** (hojas Whitelist, Tokens, Resenas, Configuracion).

```
[ Cliente final ] --token URL--> [ Widget / form público ]
                                        |
[ Operador ] --OTP+JWT--> [ Vue 3 Dashboard ]
                                        |
                    POST { action, payload, token }
                                        v
                    [ GAS WebApp doPost / doGet ]
                         |            |
                    [ Sheets ]   [ MailApp / UrlFetch ]
                                      |
                         reCAPTCHA Enterprise, Gemini
```

## Component map

| Capa | Tecnología | Responsabilidad |
| :---- | :---- | :---- |
| Dashboard UI | Vue 3, Vite, Tailwind, SweetAlert2 | Auth UX, tablas, modales, RBAC de UI vía `hasPermission` |
| API | Apps Script (`WebApp.gs` router) | Enrutado por `action`, respuestas JSON unificadas |
| Auth | `Auth.gs` | OTP, JWT, reCAPTCHA, `requerirPermiso` |
| Domain API | `API_Dashboard.gs` | Reseñas, tokens, usuarios, config, Gemini |
| Data access | `DB_Core.gs` | CRUD por hoja/fila |
| Cross-cutting | `Config.gs`, `Utils.gs` | Roles, secretos, sanitización, correos, cron |

## Auth flow (implementado)

1. Usuario ingresa email → `request_otp` (whitelist + no Suspendido).
2. OTP en cache 10 min; correo HTML de marca.
3. `verify_otp` → activa Pendiente→Activo si aplica → JWT 24h.
4. Dashboard guarda JWT en `localStorage` y llama `get_user_info` en cada carga.

## Review invitation flow

1. Operador con `generar_enlace` → `generate_link(nombre, servicio)`.
2. Backend firma payload (id, userId, nombre, zona) con `SECRET_FIRMA`.
3. URL = `URL_Frontend_App?t=<jwt-enlace>`; fila en Tokens (`Activo`).
4. Cliente envía reseña con `token_id` → token `Usado`, reseña `Pendiente`, correo al gestor.
5. Moderación → `Aprobado` / `Archivado` (+ respuesta opcional).
6. Día 7 sin uso: correo de recordatorio al gestor (cron).

## Seguridad

* Secretos solo en Script Properties (`SEGURIDAD` getters).
* RBAC en servidor (no confiar en ocultar botones del frontend).
* Sanitización de texto y protección de fórmulas de Sheets (`limpiarTexto`).

## Límites conocidos del snapshot

* No hay RDBMS ni migraciones formales; el esquema es el encabezado de cada hoja.
* No hay refresh token / cookie HttpOnly; sesión = JWT en localStorage.
* Expiración automática a 30 días de tokens y QR/Web Share: documentados como evolución, no implementados en este snapshot.
