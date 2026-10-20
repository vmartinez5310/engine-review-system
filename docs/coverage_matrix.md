# Coverage matrix — Docs ↔ System snapshot

Fecha de alineación: 2026-10-17. Rama de trabajo: `docs/sync-coverage-system-snapshot`.

Leyenda: **OK** implementado y documentado · **DOC+** documentado como planificado/evolución · **CODE** en código (doc actualizado) · **GAP** riesgo residual

## Requisitos funcionales

| ID | Tema | Código | Docs | Notas |
| --- | --- | --- | --- | --- |
| RF-01 | Envío reseña + legal + captcha | OK | OK | `submit_review` |
| RF-02 | Token de invitación | OK | OK | Marca Usado |
| RF-03 | Generar enlace | OK | OK | `generate_link` |
| RF-04 | Ciclo token | OK parcial | OK+DOC+ | Cancelado sí; Expirado 30d / QR / Share = evolución |
| RF-05 | Moderación + mail | OK | OK | |
| RF-06 | RBAC 4 roles | OK | OK | Unificado desde Developer/Admin docs antiguos |
| RF-07 | Config marca | OK | OK | |
| RF-08 | OTP + JWT | OK | OK | ADR actualizado (sin Redis/refresh) |
| RF-09 | Usuarios | OK | OK | Logo incluido |
| RF-10 | Seguimientos + cron D+7 | OK | OK | |
| RF-11 | Gemini | OK | OK | |
| RF-12 | Notificaciones sesión | OK | OK | |

## Datos

| Entidad | Hojas reales | Diccionario | DBML |
| --- | --- | --- | --- |
| Whitelist | OK | OK | OK |
| Tokens | OK | OK | OK |
| Resenas | OK | OK | OK |
| Configuracion KV | OK | OK | OK |

## API

| Superficie | Router WebApp | OpenAPI actions | Functional matrix |
| --- | --- | --- | --- |
| 16 actions | OK | OK | OK |

## UI

| Vista / área | Código | ui_ux_spec |
| --- | --- | --- |
| Login OTP | OK | OK |
| Layout + permisos | OK | OK |
| Reseñas / modal enlace | OK | OK |
| Usuarios / Config / Perfil | OK | OK |
| Widget público embebible | API only | DOC+ |

## Funcionalidad preservada

Ningún endpoint, permiso, hoja o flujo del snapshot de código fue eliminado al actualizar documentación. Los elementos solo-documentales previos (Redis, refresh token, rol Developer, estados Expirado/Revocado, QR) se reclasificaron como evolución o se mapearon al equivalente real (`Cancelado`, roles actuales, CacheService).
