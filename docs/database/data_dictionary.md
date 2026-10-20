# Data Dictionary — Engine Review System

Persistencia real: **Google Sheets**. Cada "tabla" es una hoja; la fila 1 son encabezados. El acceso se hace vía `DB_Core.gs` (`db_leerTodo`, `db_crearFila`, `db_actualizarCampos`).

## 7.1 Hoja Whitelist

| Campo | Tipo lógico | Req | Descripción |
| :---- | :---- | :---- | :---- |
| UserId | string | PK | Identificador de usuario/asesor |
| Nombre | string | sí | Nombre visible |
| Email | string | único | Correo para OTP (case-insensitive) |
| Estado | enum | sí | `Activo` \| `Pendiente` \| `Suspendido` |
| Rol | enum | sí | `ADMINISTRADOR` \| `SUPERVISOR` \| `APROBADOR` \| `USUARIO` |
| Logo | URL string | no | Avatar / logo del usuario |

## 7.2 Hoja Tokens

| Campo | Tipo lógico | Req | Descripción |
| :---- | :---- | :---- | :---- |
| ID_Enlace | string | PK | Ej. `LNK-XXXXXX` |
| UserId_Admin | string | FK lógico | Gestor que generó el enlace |
| Fecha_Envio | date `yyyy-MM-dd` | sí | Fecha de emisión |
| Nombre_Cliente | string | sí | Cliente invitado |
| Zona_Servicio | string | sí | Servicio / zona |
| URL_Generada | URL | sí | Link firmado completo |
| Estado | enum | sí | `Activo` \| `Usado` \| `Cancelado` |

## 7.3 Hoja Resenas

| Campo | Tipo lógico | Req | Descripción |
| :---- | :---- | :---- | :---- |
| ID_Resena | string | PK | Ej. `RES-XXXXXXXX` |
| UserId | string | sí | Gestor asociado o `WEB` |
| Fecha | date `yyyy-MM-dd` | sí | Fecha de registro |
| Cliente | string | sí | Nombre público |
| Servicio | string | no | Zona / servicio declarado |
| Calificacion | number | sí | 0–5 |
| Comentario | text | no | Experiencia |
| Legal_OK | boolean | sí | Aceptación de aviso / publicación |
| Estado | enum | sí | `Pendiente` \| `Aprobado` \| `Archivado` |
| Respuesta_Admin | text | no | Respuesta pública del equipo |

*Nota de cobertura:* Documentación previa incluía `ID_Enlace`, `Autorizacion_Publicacion` separada y `Fecha_Respuesta`. En el snapshot, el vínculo al token se resuelve al marcar el token `Usado` y el consentimiento se concentra en `Legal_OK`. Campos adicionales pueden añadirse a la hoja sin romper lecturas por encabezado.

## 7.4 Hoja Configuracion (clave-valor)

| Clave (col A) | Valor (col B) | Uso |
| :---- | :---- | :---- |
| Empresa_Nombre | string | Nombre de marca |
| Color_Primario | hex | `--brand-color` / correos |
| Logo_Horizontal | URL | Header / login |
| Logo_Vertical | URL | Ícono / login |
| URL_Frontend_App | URL base | Construcción de enlaces de invitación |

## 7.5 Enums efectivos

| Enum | Valores | Uso |
| :---- | :---- | :---- |
| EstadoUsuario | Activo, Pendiente, Suspendido | Whitelist |
| RolUsuario | ADMINISTRADOR, SUPERVISOR, APROBADOR, USUARIO | Whitelist + ROLES |
| EstadoToken | Activo, Usado, Cancelado | Tokens |
| EstadoResena | Pendiente, Aprobado, Archivado | Resenas |

## 7.6 Mapeo con modelo relacional aspiracional

El archivo `schema.dbml` se mantiene como **modelo conceptual**. Donde difiere (nombres de rol, estados de token, columnas de Resenas), prevalece este diccionario y las hojas reales.
