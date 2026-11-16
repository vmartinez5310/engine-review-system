# Engine Review System

Plataforma de gestión de reseñas y testimonios de clientes para Inmobiliarte 22.

## Stack
- **Frontend:** Vue 3 (Vite + Tailwind CSS).
- **Backend & BD:** Supabase (PostgreSQL 15+ con RLS y Auth OTP 6 dígitos).
- **Hosting:** GitHub Pages.

## Configuración Local
1. Instalar dependencias: `npm install`
2. Crear `.env` basado en `.env.example`:
```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
```
