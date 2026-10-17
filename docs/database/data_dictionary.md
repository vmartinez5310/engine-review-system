# Data Dictionary - Engine Review System

A continuación se detallan las tablas y el catálogo consolidado de enumeraciones (Enums) que conforman la estructura de la base de datos del sistema Engine Review System.

## 7.1 Tabla Tokens
| Campo | Tipo de Dato | Restricción | Descripción |
| :---- | :---- | :---- | :---- |
| **ID_Enlace** | UUID / INT | PK, NOT NULL | Identificador único del token/enlace de invitación. |
| **UserId_Admin** | UUID / INT | FK, NOT NULL | Identificador del usuario/administrador que generó la invitación. |
| **Fecha_Envio** | DATETIME | NOT NULL | Fecha y hora en la que se generó y envió el token. |
| **Nombre_Cliente** | VARCHAR(150) | NOT NULL | Nombre del cliente al que se le solicita la reseña. |
| **Zona_Servicio** | VARCHAR(100) | NULL | Zona o sucursal donde se prestó el servicio. |
| **Estado** | ENUM | NOT NULL | Estado del token: Activo, Usado, Expirado, Revocado. |

## 7.2 Tabla Resenas
| Campo | Tipo de Dato | Restricción | Descripción |
| :---- | :---- | :---- | :---- |
| **ID_Resena** | UUID / INT | PK, NOT NULL | Identificador único de la reseña. |
| **ID_Enlace** | UUID / INT | FK, NOT NULL | Referencia al token/enlace utilizado para enviar la reseña. |
| **Calificacion** | DECIMAL(2,1) | NOT NULL | Puntuación otorgada por el cliente (0.0 a 5.0). |
| **Comentario** | TEXT | NULL | Texto explicativo de la experiencia del cliente. |
| **Nombre_Publico** | VARCHAR(150) | NOT NULL | Nombre visible con el que se publicará la reseña. |
| **Aviso_Privacidad** | BOOLEAN | NOT NULL | Aceptación de los términos de privacidad por el cliente. |
| **Autorizacion_Publicacion** | BOOLEAN | NOT NULL | Consentimiento expreso para la publicación pública de la reseña. |
| **Estado_Moderacion** | ENUM | NOT NULL | Estado de revisión: Pendiente, Aprobado, Archivado, Rechazado. |
| **Respuesta_Admin** | TEXT | NULL | Respuesta redactada por el equipo administrativo. |
| **Fecha_Respuesta** | DATETIME | NULL | Fecha y hora en la que se registró la respuesta del administrador. |

## 7.3 Tabla Whitelist
| Campo | Tipo de Dato | Restricción | Descripción |
| :---- | :---- | :---- | :---- |
| **UserId** | UUID / INT | PK, NOT NULL | Identificador único del usuario interno. |
| **Email** | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico institucional o registrado del usuario. |
| **Rol** | ENUM | NOT NULL | Rol asignado: Developer, Admin, Usuario Normal. |
| **Activo** | BOOLEAN | NOT NULL | Indica si el acceso del usuario está habilitado o suspendido. |

## 7.4 Tabla Configuracion
| Campo | Tipo de Dato | Restricción | Descripción |
| :---- | :---- | :---- | :---- |
| **ID_Config** | INT | PK, NOT NULL | Identificador del registro de configuración. |
| **Nombre_Empresa** | VARCHAR(150) | NOT NULL | Nombre de la empresa desplegado en el widget y comunicaciones. |
| **Color_Primario** | VARCHAR(7) | NOT NULL | Código de color hexadecimal primario (ej. #0F172A). |
| **Color_Acento** | VARCHAR(7) | NOT NULL | Código de color hexadecimal de acento. |
| **URL_Logo_Horizontal** | VARCHAR(500) | NULL | Enlace directo al recurso de imagen del logo horizontal. |
| **URL_Logo_Icono** | VARCHAR(500) | NULL | Enlace directo al recurso de imagen del logo vertical o ícono. |
| **URL_Publica_Base** | VARCHAR(255) | NOT NULL | URL base para la construcción de enlaces de invitación públicos. |

## 7.5 Catálogo Consolidado de Enums
| Nombre del Enum | Valores Permitidos | Descripción / Uso |
| :---- | :---- | :---- |
| **EstadoTokenEnum** | 'Activo', 'Usado', 'Expirado', 'Revocado' | Control del ciclo de vida de las invitaciones a reseñas en la tabla Tokens. |
| **EstadoModeracionEnum** | 'Pendiente', 'Aprobado', 'Archivado', 'Rechazado' | Fases de revisión administrativa para publicaciones en la tabla Resenas. |
| **RolUsuarioEnum** | 'Developer', 'Admin', 'Usuario Normal' | Niveles de acceso y permisos dentro de la plataforma en la tabla Whitelist. |
