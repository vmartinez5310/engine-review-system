-- ==============================================================================
-- Schema: Engine Review System (Supabase / PostgreSQL)
-- Optimizado bajo principios DRY (funciones reutilizables y disparadores centralizados)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerados para estados y roles alineados al diccionario de datos existente
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'APROBADOR', 'USUARIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM ('Activo', 'Pendiente', 'Suspendido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.token_status AS ENUM ('Activo', 'Usado', 'Cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.review_status AS ENUM ('Pendiente', 'Aprobado', 'Archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Función DRY reutilizable para disparadores de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tabla: whitelist (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol public.user_role NOT NULL DEFAULT 'USUARIO',
    estado public.user_status NOT NULL DEFAULT 'Pendiente',
    logo TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_whitelist_email ON public.whitelist(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_whitelist_user_id ON public.whitelist(user_id);

DROP TRIGGER IF EXISTS tr_whitelist_updated_at ON public.whitelist;
CREATE TRIGGER tr_whitelist_updated_at
    BEFORE UPDATE ON public.whitelist
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Tabla: configuracion (clave-valor de marca)
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

DROP TRIGGER IF EXISTS tr_configuracion_updated_at ON public.configuracion;
CREATE TRIGGER tr_configuracion_updated_at
    BEFORE UPDATE ON public.configuracion
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Tabla: tokens (enlaces de invitación emitidos a clientes)
CREATE TABLE IF NOT EXISTS public.tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_enlace TEXT UNIQUE NOT NULL,
    user_id_admin TEXT NOT NULL REFERENCES public.whitelist(user_id) ON UPDATE CASCADE,
    fecha_envio DATE NOT NULL DEFAULT CURRENT_DATE,
    nombre_cliente TEXT NOT NULL,
    zona_servicio TEXT NOT NULL DEFAULT '',
    url_generada TEXT NOT NULL,
    estado public.token_status NOT NULL DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_tokens_id_enlace ON public.tokens(id_enlace);
CREATE INDEX IF NOT EXISTS idx_tokens_estado ON public.tokens(estado);

-- 7. Tabla: resenas
CREATE TABLE IF NOT EXISTS public.resenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_resena TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'WEB',
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente TEXT NOT NULL,
    servicio TEXT DEFAULT '',
    calificacion NUMERIC(2,1) NOT NULL CHECK (calificacion >= 0 AND calificacion <= 5),
    comentario TEXT DEFAULT '',
    legal_ok BOOLEAN NOT NULL DEFAULT FALSE,
    estado public.review_status NOT NULL DEFAULT 'Pendiente',
    respuesta_admin TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_resenas_estado ON public.resenas(estado);
CREATE INDEX IF NOT EXISTS idx_resenas_fecha ON public.resenas(fecha DESC);

DROP TRIGGER IF EXISTS tr_resenas_updated_at ON public.resenas;
CREATE TRIGGER tr_resenas_updated_at
    BEFORE UPDATE ON public.resenas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Datos iniciales de configuración por defecto
INSERT INTO public.configuracion (clave, valor) VALUES
    ('Empresa_Nombre', 'Inmobiliarte 22'),
    ('Color_Primario', '#4cc3e9'),
    ('Logo_Horizontal', ''),
    ('Logo_Vertical', ''),
    ('URL_Frontend_App', 'https://vmartinez5310.github.io/engine-review-system/')
ON CONFLICT (clave) DO NOTHING;

-- 9. Funciones DRY para comprobación de roles en RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
    SELECT rol FROM public.whitelist 
    WHERE auth_user_id = auth.uid() 
       OR LOWER(email) = LOWER(auth.jwt()->>'email') 
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 10. Habilitar Row Level Security (RLS)
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

-- 11. Políticas de Seguridad (RLS)

-- Configuracion: pública para lectura de marca; modificable solo por ADMINISTRADOR
DROP POLICY IF EXISTS "Lectura pública de configuración" ON public.configuracion;
CREATE POLICY "Lectura pública de configuración" ON public.configuracion
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificación de configuración por Administradores" ON public.configuracion;
CREATE POLICY "Modificación de configuración por Administradores" ON public.configuracion
    FOR ALL TO authenticated
    USING (public.current_user_role() = 'ADMINISTRADOR');

-- Whitelist:
DROP POLICY IF EXISTS "Lectura de whitelist para usuarios autenticados" ON public.whitelist;
CREATE POLICY "Lectura de whitelist para usuarios autenticados" ON public.whitelist
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestión total de whitelist por Administradores" ON public.whitelist;
CREATE POLICY "Gestión total de whitelist por Administradores" ON public.whitelist
    FOR ALL TO authenticated
    USING (public.current_user_role() = 'ADMINISTRADOR');

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.whitelist;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.whitelist
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
    WITH CHECK (auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'));

-- Tokens:
DROP POLICY IF EXISTS "Lectura de tokens por roles autorizados" ON public.tokens;
CREATE POLICY "Lectura de tokens por roles autorizados" ON public.tokens
    FOR SELECT TO authenticated
    USING (public.current_user_role() IN ('ADMINISTRADOR', 'SUPERVISOR', 'USUARIO'));

DROP POLICY IF EXISTS "Inserción de tokens autorizada" ON public.tokens;
CREATE POLICY "Inserción de tokens autorizada" ON public.tokens
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_role() IN ('ADMINISTRADOR', 'SUPERVISOR', 'USUARIO'));

DROP POLICY IF EXISTS "Actualización de tokens para moderadores" ON public.tokens;
CREATE POLICY "Actualización de tokens para moderadores" ON public.tokens
    FOR UPDATE TO authenticated
    USING (public.current_user_role() IN ('ADMINISTRADOR', 'SUPERVISOR'));

-- Reseñas:
DROP POLICY IF EXISTS "Lectura pública de reseñas aprobadas" ON public.resenas;
CREATE POLICY "Lectura pública de reseñas aprobadas" ON public.resenas
    FOR SELECT USING (estado = 'Aprobado');

DROP POLICY IF EXISTS "Inserción pública de reseñas con aviso legal" ON public.resenas;
CREATE POLICY "Inserción pública de reseñas con aviso legal" ON public.resenas
    FOR INSERT WITH CHECK (legal_ok = true);

DROP POLICY IF EXISTS "Lectura de todas las reseñas en panel autenticado" ON public.resenas;
CREATE POLICY "Lectura de todas las reseñas en panel autenticado" ON public.resenas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Moderación de reseñas por roles asignados" ON public.resenas;
CREATE POLICY "Moderación de reseñas por roles asignados" ON public.resenas
    FOR UPDATE TO authenticated
    USING (public.current_user_role() IN ('ADMINISTRADOR', 'SUPERVISOR', 'APROBADOR'));
