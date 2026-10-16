# Backend - Google Apps Script

Codigo fuente del backend del Engine Review System.

## Hojas requeridas

### 1. Whitelist
```
UserId | Nombre | Email | Estado | Rol
```
Estado: Activo | Pendiente | Suspendido  
Rol: ADMINISTRADOR | SUPERVISOR | APROBADOR | USUARIO

### 2. Tokens
```
ID_Enlace | UserId_Admin | Fecha_Envio | Nombre_Cliente | Zona_Servicio | URL_Generada | Estado
```
Estado: Activo | Usado | Cancelado

### 3. Resenas
```
ID_Resena | UserId | Fecha | Cliente | Servicio | Calificacion | Comentario | Legal_OK | Estado | Respuesta_Admin
```
Estado: Pendiente | Aprobado | Archivado

### 4. Configuracion
Key-Value (col A = clave, col B = valor):
```
Empresa_Nombre
Color_Primario
Logo_Horizontal
Logo_Vertical
URL_Frontend_App
```

## Secretos (Script Properties)

Project Settings -> Script properties:

| Property             | Descripcion |
|----------------------|-------------|
| SECRET_JWT           | Firma JWT |
| SECRET_FIRMA         | Firma enlaces |
| RECAPTCHA_PROJECT    | Project ID |
| RECAPTCHA_API_KEY    | API Key |
| RECAPTCHA_SITE_KEY   | Site Key |
| GEMINI_API_KEY       | Gemini Key |

Nunca subas estos valores al repositorio.

## Despliegue

1. Spreadsheet -> Extensiones -> Apps Script
2. Pega los archivos .gs de esta carpeta (Config.gs + tus archivos existentes actualizados)
3. Configura Script Properties
4. Deploy as Web App (Execute as: Me, Access: Anyone)
5. Copia la URL /exec a src/services/api.js del frontend

## Triggers

- cron_dispararRecordatorios -> time-driven diario

## Parches incluidos

- `Config.gs` — getSecret() + BD + ROLES + getConfig()
- `PATCH_auth_obtenerInfoUsuario.gs` — inyecta notificaciones reales
- `MIGRATE_SECRETS.md` — como mover secretos fuera del codigo
