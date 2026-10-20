# Requisitos Funcionales (RF) - Engine Review System

Plataforma de gestión y captura de reseñas (prueba social) orientada a servicios y productos. Backend headless en Google Apps Script + Google Sheets; Dashboard en Vue 3.

**Fuente de verdad del estado implementado:** código en `backend/` y `src/` (snapshot actual de `main`).

## 3.1 Captura y widget de reseñas

| ID | Requisito | Estado | Detalle implementado / aceptación |
| :---- | :---- | :---- | :---- |
| **RF-01** | Widget / envío de reseña | Implementado (API pública) | `submit_review`: calificación, comentario, nombre, zona, `recaptcha_token`, aceptación legal (`aviso_privacidad_aceptado`). Persistencia en hoja Resenas como `Pendiente`. |
| **RF-02** | Validación por token de invitación | Implementado | Si `token_id` corresponde a enlace `Activo`, se marca `Usado` y se asocia `UserId` del gestor. Sin token válido la reseña puede registrarse como `WEB`. |
| **RF-03** | Generación de enlaces de invitación | Implementado | `generate_link` (permiso `generar_enlace`): Nombre + Servicio → URL firmada (`SECRET_FIRMA`) con base `URL_Frontend_App`. |
| **RF-04** | Ciclo de vida del token | Implementado (parcial vs aspiracional) | Estados en sistema: **Activo**, **Usado**, **Cancelado**. Revocación vía `revoke_link`. *Planificado (no en snapshot):* Expirado a 30 días, QR nativo, Web Share API en UI. |
| **RF-05** | Notificaciones y moderación | Implementado | Correo al gestor al recibir reseña con legal OK; moderación `update_review` (Pendiente / Aprobado / Archivado + `Respuesta_Admin`). Publicación pública solo si estado `Aprobado` (`get_public_reviews`). |
| **RF-06** | Roles y permisos (RBAC) | Implementado | Roles: **ADMINISTRADOR**, **SUPERVISOR**, **APROBADOR**, **USUARIO**. Permisos granulares (ver matriz). *Aspiracional en docs previos (Developer / Admin / Usuario Normal) se unifica a estos roles de código.* |
| **RF-07** | Configuración de identidad visual | Implementado | Hoja Configuracion (KV): Empresa_Nombre, Color_Primario, Logo_Horizontal, Logo_Vertical, URL_Frontend_App. Lectura pública `get_public_config`; escritura `update_config` (permiso `configurar_sistema`). |
| **RF-08** | Autenticación OTP + JWT | Implementado | `request_otp` / `verify_otp`. OTP 6 dígitos en CacheService (10 min). JWT HS256 24h. Bloqueo tras 5 intentos fallidos (15 min). |
| **RF-09** | Gestión de usuarios | Implementado | `get_users`, `add_user` (estado inicial Pendiente, logo opcional), `update_user` (Estado). Permiso `gestionar_usuarios`. |
| **RF-10** | Seguimientos de enlaces | Implementado | `get_tracking`: tokens Activo con días transcurridos. Recordatorio por correo al día 7 (`cron_dispararRecordatorios`). |
| **RF-11** | Asistencia IA (Gemini) | Implementado | `call_ai` (permiso `editar_resena`) para redactar/sugerir respuestas. |
| **RF-12** | Info de sesión y notificaciones | Implementado | `get_user_info`: perfil, permisos, conteos `resenasNuevas` (Pendiente) y `seguimientosAtrasados` (>7 días). |

## 3.2 Matriz de permisos (código)

| Rol | ver_dashboard | generar_enlace | ver_seguimientos | editar_resena | gestionar_usuarios | configurar_sistema |
| :---- | :---: | :---: | :---: | :---: | :---: | :---: |
| ADMINISTRADOR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SUPERVISOR | ✓ | ✓ | ✓ | ✓ | | |
| APROBADOR | ✓ | | | ✓ | | |
| USUARIO | ✓ | ✓ | ✓ | | | |

## 3.3 Acciones API (contrato real)

Todas las operaciones van por **POST** al Web App `/exec` con cuerpo JSON:

```json
{ "action": "<nombre>", "payload": { }, "token": "<jwt opcional>" }
```

Respuesta unificada: `{ "status": "success"|"error", "data"|"message": ... }`.

| action | Auth | Permiso | Descripción |
| :---- | :---- | :---- | :---- |
| get_public_config | No | — | Marca pública |
| get_public_reviews | No | — | Reseñas Aprobado |
| submit_review | No (+ reCAPTCHA) | — | Alta de reseña |
| request_otp | No | — | Envía OTP |
| verify_otp | No | — | Devuelve JWT |
| get_user_info | JWT | ver_dashboard | Sesión + notificaciones |
| get_dashboard_reviews | JWT | ver_dashboard | Listado moderación |
| update_review | JWT | editar_resena | Estado / respuesta |
| generate_link | JWT | generar_enlace | URL de invitación |
| get_tracking | JWT | ver_seguimientos | Tokens activos |
| revoke_link | JWT | editar_resena | Cancelar token |
| get_users | JWT | gestionar_usuarios | Whitelist |
| add_user | JWT | gestionar_usuarios | Alta usuario |
| update_user | JWT | gestionar_usuarios | Estado usuario |
| update_config | JWT | configurar_sistema | KV marca |
| call_ai | JWT | editar_resena | Gemini |

## Reglas de negocio (RN)

* **RN-01:** Solo correos presentes en Whitelist pueden solicitar OTP.
* **RN-02:** Usuario `Suspendido` no puede autenticarse; `Pendiente` se activa al primer OTP correcto.
* **RN-03:** Publicación en widget/carousel solo con estado `Aprobado`.
* **RN-04:** Secretos (JWT, firma, reCAPTCHA, Gemini) solo en Script Properties; nunca en repositorio.
* **RN-05:** Texto de entrada se sanitiza (`limpiarTexto`) antes de persistir.

## Restricciones y supuestos

* **RES-01:** Persistencia = Google Sheets (no RDBMS relacional).
* **RES-02:** Frontend Dashboard: Vue 3 + Vite + Tailwind; sin lógica de negocio pesada en cliente.
* **SUP-01:** reCAPTCHA Enterprise y Gemini configurados en el proyecto GCP del operador.
* **SUP-02:** Trigger diario de Apps Script para `cron_dispararRecordatorios`.
