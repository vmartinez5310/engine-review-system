# Backend — Google Apps Script

Código fuente del API headless del Engine Review System.

## Hojas requeridas

### 1. Whitelist

```
UserId | Nombre | Email | Estado | Rol | Logo
```

- Estado: `Activo` | `Pendiente` | `Suspendido`
- Rol: `ADMINISTRADOR` | `SUPERVISOR` | `APROBADOR` | `USUARIO`
- Logo: URL pública opcional

### 2. Tokens

```
ID_Enlace | UserId_Admin | Fecha_Envio | Nombre_Cliente | Zona_Servicio | URL_Generada | Estado
```

- Estado: `Activo` | `Usado` | `Cancelado`

### 3. Resenas

```
ID_Resena | UserId | Fecha | Cliente | Servicio | Calificacion | Comentario | Legal_OK | Estado | Respuesta_Admin
```

- Estado: `Pendiente` | `Aprobado` | `Archivado`

### 4. Configuracion (clave-valor)

Columna A = clave, B = valor:

```
Empresa_Nombre
Color_Primario
Logo_Horizontal
Logo_Vertical
URL_Frontend_App
```

## Secretos (Script Properties)

Project Settings → Script properties:

| Property | Descripción |
| --- | --- |
| SECRET_JWT | Firma JWT de sesión |
| SECRET_FIRMA | Firma de enlaces de reseña |
| RECAPTCHA_PROJECT | Project ID reCAPTCHA Enterprise |
| RECAPTCHA_API_KEY | API Key reCAPTCHA |
| RECAPTCHA_SITE_KEY | Site Key reCAPTCHA |
| GEMINI_API_KEY | API Key Gemini |

Nunca subir estos valores al repositorio.

## Archivos

| Archivo | Rol |
| --- | --- |
| Config.gs | BD, ROLES, SEGURIDAD, getConfig |
| DB_Core.gs | getSheet, crear/leer/actualizar filas |
| Auth.gs | reCAPTCHA, OTP, JWT, requerirPermiso |
| Utils.gs | sanitización, correos, cron, notificaciones |
| API_Dashboard.gs | casos de uso de negocio |
| WebApp.gs | doGet / doPost (router por `action`) |

## Despliegue

1. Spreadsheet → Extensiones → Apps Script  
2. Pegar/actualizar los `.gs` de esta carpeta  
3. Configurar Script Properties  
4. Deploy → Web App (Execute as: **Me**, Access: **Anyone**)  
5. Copiar URL `/exec` a `src/services/api.js` del frontend  

## Triggers

- `cron_dispararRecordatorios` — time-driven **diario** (recordatorio día 7 a gestores).

## Contrato API

Ver [docs/api/openapi.yaml](../docs/api/openapi.yaml) y la matriz de acciones en [docs/requirements/functional.md](../docs/requirements/functional.md).

Respuesta unificada:

```json
{ "status": "success", "data": { } }
{ "status": "error", "message": "..." }
```
