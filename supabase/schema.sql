-- ==============================================================================
-- Schema Definitivo: Engine Review System (Supabase / PostgreSQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tipos ENUM
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'APROBADOR', 'USUARIO');
    CREATE TYPE public.user_status AS ENUM ('Activo', 'Pendiente', 'Suspendido');
    CREATE TYPE public.token_status AS ENUM ('Activo', 'Usado', 'Cancelado');
    CREATE TYPE public.review_status AS ENUM ('Pendiente', 'Aprobado', 'Archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabla Whitelist (Operadores)
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

-- 3. Tabla Configuración (Clave-Valor)
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.configuracion (clave, valor) VALUES
    ('Empresa_Nombre', 'Inmobiliarte 22'),
    ('Color_Primario', '#4cc3e9'),
    ('Logo_Horizontal', ''),
    ('Logo_Vertical', ''),
    ('URL_Frontend_App', 'https://vmartinez5310.github.io/engine-review-system/')
ON CONFLICT (clave) DO NOTHING;

-- 4. Tabla Tokens (Enlaces de Invitación)
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

-- 5. Tabla Reseñas
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

-- 6. Funciones y Procedimientos Seguros (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.whitelist 
        WHERE (auth_user_id = auth.uid() OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email')))
          AND rol = 'ADMINISTRADOR'
          AND estado = 'Activo'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_email_authorized(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    found_user RECORD;
BEGIN
    SELECT id, user_id, nombre, email, estado, rol
    INTO found_user
    FROM public.whitelist
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(user_email))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('authorized', false, 'reason', 'not_found');
    END IF;

    IF found_user.estado = 'Suspendido' THEN
        RETURN json_build_object('authorized', false, 'reason', 'suspended');
    END IF;

    RETURN json_build_object('authorized', true, 'estado', found_user.estado);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSON AS $$
DECLARE
    current_email TEXT;
    user_record RECORD;
    resenas_pendientes INT := 0;
    tokens_activos INT := 0;
BEGIN
    current_email := LOWER(TRIM(auth.jwt()->>'email'));
    
    IF current_email IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No hay sesión activa');
    END IF;

    SELECT id, user_id, nombre, email, rol, estado, logo, auth_user_id
    INTO user_record
    FROM public.whitelist
    WHERE LOWER(TRIM(email)) = current_email OR auth_user_id = auth.uid()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Perfil no encontrado');
    END IF;

    IF user_record.estado = 'Pendiente' THEN
        UPDATE public.whitelist 
        SET estado = 'Activo', auth_user_id = auth.uid(), updated_at = NOW()
        WHERE id = user_record.id;
        user_record.estado := 'Activo';
    ELSIF user_record.auth_user_id IS NULL THEN
        UPDATE public.whitelist 
        SET auth_user_id = auth.uid(), updated_at = NOW()
        WHERE id = user_record.id;
    END IF;

    SELECT COUNT(*) INTO resenas_pendientes FROM public.resenas WHERE estado = 'Pendiente';
    SELECT COUNT(*) INTO tokens_activos FROM public.tokens WHERE estado = 'Activo';

    RETURN json_build_object(
        'success', true,
        'profile', json_build_object(
            'id', user_record.id,
            'userId', user_record.user_id,
            'nombre', user_record.nombre,
            'email', user_record.email,
            'rol', user_record.rol,
            'estado', user_record.estado,
            'logo', COALESCE(user_record.logo, ''),
            'notificaciones', json_build_object(
                'resenasNuevas', resenas_pendientes,
                'seguimientosAtrasados', tokens_activos
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_email_authorized(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 7. Triggers de Sincronización Automática con auth.users
CREATE OR REPLACE FUNCTION public.handle_user_first_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.whitelist
    SET auth_user_id = NEW.id,
        estado = CASE WHEN estado = 'Pendiente' THEN 'Activo'::public.user_status ELSE estado END,
        updated_at = NOW()
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
      AND (auth_user_id IS NULL OR auth_user_id = NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_first_login();

CREATE OR REPLACE FUNCTION public.handle_whitelist_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.auth_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = OLD.auth_user_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_whitelist_deleted ON public.whitelist;
CREATE TRIGGER tr_on_whitelist_deleted
    AFTER DELETE ON public.whitelist
    FOR EACH ROW EXECUTE FUNCTION public.handle_whitelist_user_deleted();

-- 8. Row Level Security (RLS)
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whitelist_select" ON public.whitelist FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid() OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email')) OR public.is_admin());
CREATE POLICY "whitelist_insert" ON public.whitelist FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "whitelist_update" ON public.whitelist FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid() OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email')) OR public.is_admin());
CREATE POLICY "whitelist_delete" ON public.whitelist FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "config_select" ON public.configuracion FOR SELECT USING (true);
CREATE POLICY "config_all" ON public.configuracion FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "tokens_select" ON public.tokens FOR SELECT TO authenticated USING (true);
CREATE POLICY "tokens_insert" ON public.tokens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tokens_update" ON public.tokens FOR UPDATE TO authenticated USING (true);

CREATE POLICY "resenas_select_public" ON public.resenas FOR SELECT USING (estado = 'Aprobado');
CREATE POLICY "resenas_select_auth" ON public.resenas FOR SELECT TO authenticated USING (true);
CREATE POLICY "resenas_insert_public" ON public.resenas FOR INSERT WITH CHECK (legal_ok = true);
CREATE POLICY "resenas_update_auth" ON public.resenas FOR UPDATE TO authenticated USING (true);
