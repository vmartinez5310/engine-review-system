# Requisitos No Funcionales (RNF)

Atributos de calidad alineados al snapshot implementado (GAS + Vue Dashboard).

## 4.1 Seguridad (RNF-SEC)

| ID | Requisito | Estado | Implementación |
| :---- | :---- | :---- | :---- |
| **RNF-01** | Auth sin contraseña (OTP + JWT) | Implementado | OTP 6 dígitos (CacheService, TTL 600s). JWT HS256, exp 24h, firmado con `SECRET_JWT`. Almacenamiento de sesión en `localStorage` (`inm_dash_token`). |
| **RNF-02** | Protección anti-spam en envío público | Implementado | reCAPTCHA Enterprise en `submit_review` (`validarRecaptcha`, score ≥ 0.5). |
| **RNF-03** | Firmas de enlaces de reseña | Implementado | Token de invitación = JWT web-safe firmado con `SECRET_FIRMA`. |
| **RNF-04** | Rate-limit de OTP | Implementado | Tras 5 OTP incorrectos: lock 15 min (`LOCK_*` en cache). |
| **RNF-05** | RBAC por permiso | Implementado | `requerirPermiso(permiso, token)` en cada endpoint privado. |
| **RNF-06** | Secretos fuera del código | Implementado | Script Properties vía `getSecret` / getters `SEGURIDAD`. |

*Nota:* El ADR histórico mencionaba Redis + refresh token HttpOnly. El snapshot **no** usa Redis ni refresh token; usa CacheService + JWT único 24h. Cualquier evolución a access/refresh queda como mejora futura sin invalidar RNF-01.

## 4.2 UX / UI (RNF-UX)

| ID | Requisito | Estado | Detalle |
| :---- | :---- | :---- | :---- |
| **RNF-07** | Tema claro/oscuro + color de marca | Implementado | Clase `dark` en `documentElement`; `--brand-color` desde config pública. |
| **RNF-08** | Mobile-first / touch targets | Diseño de proyecto | Regla de diseño: targets ~44×44 px; layout responsive Tailwind. |
| **RNF-09** | Navegación modular | Implementado | Vistas: Login, Reseñas, Seguimientos (en core), Usuarios, Config, Sistema, Perfil. Layout con sidebar. |

## 4.3 Disponibilidad y operacion (RNF-OPS)

| ID | Requisito | Estado | Detalle |
| :---- | :---- | :---- | :---- |
| **RNF-10** | Backend serverless | Implementado | Google Apps Script Web App (Execute as: Me, Access: Anyone). |
| **RNF-11** | Health check | Implementado | `doGet` → JSON status/version. |
| **RNF-12** | Recordatorios programados | Implementado | Trigger time-driven diario → `cron_dispararRecordatorios` (día 7). |
| **RNF-13** | Backups | Responsabilidad del operador | Respaldos de Spreadsheet (historial de versiones de Google / export). Objetivo operativo: al menos semanal. |

## 4.4 Mantenibilidad (RNF-MAINT)

* Código backend modular: Config, DB_Core, Auth, Utils, API_Dashboard, WebApp.
* Frontend: componentes UI base, composable `useAuth`, `apiClient` único.
* Principios de proyecto: cero mocks, cero lógica de negocio pesada en frontend, RBAC real.
