# Requisitos No Funcionales (RNF)

Los requisitos no funcionales definen los atributos de calidad, restricciones técnicas y estándares de desempeño del sistema.

## 4.1 Rendimiento y Tiempo de Respuesta (RNF-PERF)
* **RNF-01 (Autenticación OTP y JWT):** El Dashboard requerirá inicio de sesión mediante código OTP y tokens JWT para mantener la sesión activa de forma persistente tras actualizar la página, evitando el almacenamiento tradicional de contraseñas.
* **RNF-02 (Diseño UI/UX Premium & Theme):** Interfaz minimalista tipo *Premium Bank* con navegación Side Menu (colapsable), degradados elegantes y una paleta estricta de 3 colores (oscuro, claro y color de acento dinámico configurado por el Administrador).

## 4.2 Seguridad y Privacidad (RNF-SEC)
* **RNF-03 (Seguridad en Formulario y reCAPTCHA):** Integración de reCAPTCHA en el widget de reseña para la protección contra spam y verificación del token en backend antes del procesamiento de la respuesta.
* **RNF-04 (Arquitectura del Dashboard y Navegación):** Estructura organizada en: Tablero de KPIs (vista principal), Menú Reseñas (Tabla de reseñas recibidas y Tabla de tokens por completar), Menú Usuarios (Gestión) y Módulo de Configuración.

## 4.3 Usabilidad y Accesibilidad (RNF-USA)
* **RNF-05 (Interfaz Intuitiva):** La interfaz debe ser receptiva (responsive) y permitir completar la tarea principal en no más de [X] clics/pasos.
* **RNF-06 (Accesibilidad):** Cumplimiento con estándares WCAG 2.1 Nivel AA.

## 4.4 Disponibilidad y Mantenibilidad (RNF-MAINT)
* **RNF-07 (Disponibilidad / Uptime):** El sistema debe garantizar un nivel de disponibilidad del [99.9%] mensual.
* **RNF-08 (Respaldos):** Se deben realizar copias de seguridad automáticas con una frecuencia de [diaria/semanal].
