# Engine Review System

Sistema de gestión de reseñas y prueba social (Inmobiliarte 22 / Easy Broker y usos genéricos).

- **Dashboard** — Vue 3 + Vite + Tailwind (OTP, moderación, enlaces, usuarios, config).
- **Backend headless** — Google Apps Script + Google Sheets.
- **API pública** — reseñas aprobadas y alta de reseña con reCAPTCHA.

Documentación completa en [`docs/`](docs/).

---

## Arquitectura (snapshot)

```
[ Vue 3 Dashboard ]  --POST {action,payload,token}-->  [ GAS WebApp ]
        |
        +-- Auth: OTP correo + JWT 24h
        +-- RBAC por permisos
        +-- Sheets: Whitelist, Tokens, Resenas, Configuracion
```

Detalle: [docs/architecture/system_design.md](docs/architecture/system_design.md).

### Roles y permisos

| Rol | Permisos |
| --- | --- |
| ADMINISTRADOR | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena, gestionar_usuarios, configurar_sistema |
| SUPERVISOR | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena |
| APROBADOR | ver_dashboard, editar_resena |
| USUARIO | ver_dashboard, generar_enlace, ver_seguimientos |

### Hojas (GAS)

| Hoja | Uso |
| --- | --- |
| Whitelist | UserId, Nombre, Email, Estado, Rol, Logo |
| Tokens | ID_Enlace, UserId_Admin, Fecha_Envio, Nombre_Cliente, Zona_Servicio, URL_Generada, Estado |
| Resenas | ID_Resena, UserId, Fecha, Cliente, Servicio, Calificacion, Comentario, Legal_OK, Estado, Respuesta_Admin |
| Configuracion | KV: Empresa_Nombre, Color_Primario, Logo_Horizontal, Logo_Vertical, URL_Frontend_App |

Diccionario: [docs/database/data_dictionary.md](docs/database/data_dictionary.md).

---

## Frontend

```bash
npm install
npm run dev    # desarrollo
npm run build  # producción
```

URL del backend: `src/services/api.js` (`API_URL` del deployment `/exec`).

## Backend

Código en `backend/`. Despliegue y secretos: [backend/README.md](backend/README.md).

Script Properties: `SECRET_JWT`, `SECRET_FIRMA`, `RECAPTCHA_PROJECT`, `RECAPTCHA_API_KEY`, `RECAPTCHA_SITE_KEY`, `GEMINI_API_KEY`.

## Documentación

| Área | Ruta |
| --- | --- |
| Requisitos funcionales | [docs/requirements/functional.md](docs/requirements/functional.md) |
| Requisitos no funcionales | [docs/requirements/non_functional.md](docs/requirements/non_functional.md) |
| Matriz de cobertura | [docs/coverage_matrix.md](docs/coverage_matrix.md) |
| Arquitectura | [docs/architecture/system_design.md](docs/architecture/system_design.md) |
| ADR Auth | [docs/architecture/adr/0001-otp-jwt-auth.md](docs/architecture/adr/0001-otp-jwt-auth.md) |
| API (OpenAPI) | [docs/api/openapi.yaml](docs/api/openapi.yaml) |
| Datos | [docs/database/data_dictionary.md](docs/database/data_dictionary.md) |
| UI/UX | [docs/design/ui_ux_spec.md](docs/design/ui_ux_spec.md) |

## Reglas de diseño del proyecto

1. Cero lógica de negocio pesada en frontend  
2. Cero mocks / datos falsos  
3. RBAC por permisos reales en servidor  
4. Mobile-first  
5. Modularidad de vistas  
6. Login OTP-only (sin contraseña en Perfil)

## Estructura

```
backend/          # Google Apps Script
docs/             # Requisitos, arquitectura, API, datos, UI
src/
  components/     # layout + ui
  composables/    # useAuth
  services/       # apiClient
  views/          # auth, core, admin, user
```
