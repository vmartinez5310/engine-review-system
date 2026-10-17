# Requisitos Funcionales (RF) - Engine Review System

El sistema Engine Review System es una plataforma de gestión y captura de reseñas para cualquier tipo de servicio o producto (inmobiliarias, servicios profesionales, vendedores, etc.).

## 3.1 Requisitos de Captura y Widget de Reseñas

* **RF-01 (Widget de Reseña sin Fricción):** El formulario desplegado en el widget para clientes debe personalizarse según los parámetros dinámicos (<?= paramNombre ?>, <?= paramSlogan ?>, emoji según <?= paramServicio ?>). Incluye calificación con estrellas parciales (0.0 a 5.0), área de texto para la experiencia, nombre público, reCAPTCHA v3, checkboxes obligatorios (Aviso de Privacidad y Autorización de publicación) y botón de envío.
* **RF-02 (Validación de Acceso por Token):** El acceso al formulario de reseña requiere un token válido en la URL. Si el cliente entra sin token o con uno expirado/usado, se redirigirá automáticamente al sitio web público de la empresa.
* **RF-03 (Generación de Enlaces de Invitación y QR):** Los usuarios/administradores pueden solicitar reseñas ingresando Nombre del Cliente y Servicio Realizado. El sistema genera un enlace único con token, muestra un código QR para escaneo directo y habilita la API nativa de compartir (WhatsApp, email, AirDrop, etc.).
* **RF-04 (Ciclo de Vida del Token):** Cada token registrado almacena: ID_Enlace, UserId_Admin, Fecha_Envio, Nombre_Cliente y Zona_Servicio. Los estados del token pueden ser: Activo, Usado, Expirado (expira a los 30 días) o Revocado. El token se invalida automáticamente al enviar la reseña.
* **RF-05 (Notificaciones y Moderación):** Al recibir una reseña, se envía una notificación por correo al usuario creador de la invitación. Una reseña sólo se publicará en el sitio público si cuenta con confirmación legal (checkboxes), estado Aprobado y respuesta registrada por un Usuario/Admin.
* **RF-06 (Gestión de Roles y Permisos):** Definición de privilegios: *Developer* (gestiona Administradores), *Admin* (aprueba/pide/archiva reseñas, gestiona usuarios y configuración global), *Usuario Normal* (aprueba y pide reseñas), *Cliente* (solo envío de reseña mediante token, sin acceso al Dashboard). Ningún rol puede auto-modificarse el rol asignado.
* **RF-07 (Módulo de Configuración de Identidad Visual):** Módulo reservado a Admins para parametrizar: Nombre de la empresa, Color primario/acento, URL de Logo Horizontal, URL de Logo Vertical/Ícono y URL Pública Base de la App Frontend para enlaces unicos.

## 3.2 Matriz de Requisitos Funcionales del Sistema

| ID | Nombre del Requisito | Módulo / Área | Prioridad | Criterios de Aceptación |
| :---- | :---- | :---- | :---- | :---- |
| **RF-01** | Widget de Reseña sin Fricción | Widget / Frontend Publico | Must Have | Soporte de decimales 0.0-5.0, captcha, campos dinámicos y checkboxes legales. |
| **RF-02** | Validación por Token | Seguridad / Acceso | Must Have | Redirección automática al sitio principal si el token no es válido o está expirado. |
| **RF-03** | Pedir Reseña y Generación QR | Módulo Reseñas | Must Have | Generación de URL parametrizada, código QR visible y uso del Web Share API. |
| **RF-04** | Gestión de Tokens e Invites | Módulo Reseñas / Tokens | Must Have | Seguimiento de estados (activo, usado, expirado, revocado) y expiración a 30 días. |
| **RF-05** | Moderación y Respuesta de Reseñas | Módulo Reseñas | Must Have | Publicación condicionada a confirmación legal, estado aprobado y respuesta del Admin/User. |
| **RF-06** | Control de Roles (Developer, Admin, User) | Gestión de Usuarios | Must Have | Restricciones jerárquicas estrictas y bloqueo de auto-cambio de rol. |
| **RF-07** | Configuración de Marca y Layout | Configuración | Should Have | Persistencia de logos, URLs base y color de acento personalizado. |

## Reglas de Negocio, Restricciones y Supuestos

### Reglas de Negocio (RN)
* **RN-01:** [Describir políticas organizacionales o restricciones legales que condicionan el sistema.]

### Restricciones Técnicas y Operativas
* **RES-01:** [Compatibilidad con navegadores/dispositivos, lenguajes de programación requeridos o infraestructura específica.]

### Supuestos y Dependencias
* **SUP-01:** [Asunciones previas sobre la disponibilidad de APIs de terceros, hardware o información de entrada.]
