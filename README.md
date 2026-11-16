# Engine Review System

Plataforma de gestión de reseñas y testimonios de clientes para Inmobiliarte 22.

## Stack
- Frontend: Vue 3 (Vite + Tailwind CSS).
- Backend y BD: Supabase (PostgreSQL 15+ con RLS y Auth OTP 6 dígitos).
- Notificaciones: Supabase Edge Functions + SMTP.
- Hosting: GitHub Pages.

---

## Configuración Local

1. Instalar dependencias:
npm install

2. Crear archivo .env basado en .env.example:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

3. Iniciar desarrollo:
npm run dev

4. Compilar producción:
npm run build

---

## Base de Datos
El esquema definitivo se encuentra en supabase/schema.sql. Cópialo y ejecútalo en el SQL Editor de Supabase.

---

## Notificaciones por Correo al Asesor (Edge Function)

Cuando un cliente envía una reseña, la función notificar-resena envía automáticamente un correo al asesor correspondiente con los detalles de la evaluación.

1. Configurar credenciales de correo de forma segura (una sola vez):
npx supabase secrets set SMTP_USER="tu-correo@gmail.com" SMTP_PASS="tu-contraseña-de-aplicacion"

2. Desplegar la función:
npx supabase functions deploy notificar-resena --no-verify-jwt

3. Activar Webhook en Supabase (Database -> Webhooks):
- Tabla: public.resenas
- Evento: INSERT
- Tipo: Supabase Edge Functions
- Función: notificar-resena

---

## Transición a Correo Corporativo
Cuando se cambie al correo de la empresa, no es necesario tocar el código fuente. Solo entra al Dashboard de Supabase en Project Settings -> Edge Functions -> Secrets y actualiza los valores de SMTP_USER y SMTP_PASS.
