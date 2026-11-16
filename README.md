# Engine Review System

Sistema integral de gestión de reseñas, prueba social y fidelización de clientes (Inmobiliarte 22 / Easy Broker).

- **Frontend:** Vue 3 (Composition API) + Vite + Tailwind CSS + SweetAlert2.
- **Backend & Base de Datos:** [Supabase](https://supabase.com) (PostgreSQL 15+ con Row Level Security y PostgREST).
- **Autenticación:** Supabase Auth nativo (6-digit OTP sin contraseñas).
- **Despliegue:** GitHub Pages vía GitHub Actions.

---

## Arquitectura

- **Cliente Final (Formulario de Reseñas):** Valida token, envía reseña pública e interactúa directo con Supabase.
- **Operador / Administrador (Dashboard):** Autenticación OTP de 6 dígitos, gestión de usuarios, moderación de reseñas y emisión de invitaciones con QR.
- **Base de Datos (PostgreSQL):** Tablas `whitelist`, `tokens`, `resenas` y `configuracion`, protegidas por Row Level Security (RLS) y disparadores automáticos.

### Roles y Permisos (RBAC en Base de Datos)

| Rol | Permisos |
| --- | --- |
| **ADMINISTRADOR** | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena, gestionar_usuarios, configurar_sistema |
| **SUPERVISOR** | ver_dashboard, generar_enlace, ver_seguimientos, editar_resena |
| **APROBADOR** | ver_dashboard, editar_resena |
| **USUARIO** | ver_dashboard, generar_enlace, ver_seguimientos |

---

## Estructura del Proyecto

- `supabase/migrations/`: Esquema SQL, funciones RPC y disparadores automáticos.
- `src/components/`: Componentes UI reutilizables (DataTable, BaseModal, BaseButton, etc.).
- `src/composables/useAuth.js`: Estado reactivo de sesión y permisos.
- `src/services/supabaseClient.js`: Cliente Singleton de Supabase.
- `src/views/`: Vistas de autenticación (6 casillas OTP), dashboard, administración y formulario público.

---

## Configuración Local

1. Instalar dependencias:
   npm install

2. Variables de entorno (.env):
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key

3. Servidor de desarrollo:
   npm run dev

4. Compilar para producción:
   npm run build

---

## Base de Datos (Supabase)

Aplica las migraciones en orden dentro del SQL Editor de Supabase:
1. `0001_initial_schema.sql`: Tablas, tipos ENUM e índices.
2. `0002_fix_auth_and_whitelist.sql`: Funciones seguras pre-login.
3. `0003_fix_profile_rpc.sql`: RPC get_my_profile() libre de bloqueos RLS.
4. `0004_fix_rls_recursion.sql`: Corrección de recursión infinita mediante is_admin().
5. `0005_auto_sync_auth_users.sql`: Triggers de sincronización automática auth.users <-> whitelist.
