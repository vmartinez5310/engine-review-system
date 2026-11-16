-- ==============================================================================
-- Corrección DRY: Verificación de acceso seguro pre-login sin romper RLS
-- ==============================================================================

-- 1. Función RPC con SECURITY DEFINER: Ejecutable anónimamente de forma segura
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

    RETURN json_build_object(
        'authorized', true,
        'user_id', found_user.user_id,
        'estado', found_user.estado,
        'rol', found_user.rol
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permiso de ejecución a usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.check_email_authorized(TEXT) TO anon, authenticated;

-- 2. Corregir y simplificar RLS en whitelist para evitar recursión
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de whitelist para usuarios autenticados" ON public.whitelist;
DROP POLICY IF EXISTS "Usuarios pueden leer su propio perfil" ON public.whitelist;
CREATE POLICY "Usuarios pueden leer su propio perfil" ON public.whitelist
    FOR SELECT TO authenticated
    USING (
        auth_user_id = auth.uid() 
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email'))
        OR EXISTS (
            SELECT 1 FROM public.whitelist w 
            WHERE w.auth_user_id = auth.uid() AND w.rol = 'ADMINISTRADOR'
        )
    );

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.whitelist;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.whitelist
    FOR UPDATE TO authenticated
    USING (
        auth_user_id = auth.uid() 
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email'))
        OR EXISTS (
            SELECT 1 FROM public.whitelist w 
            WHERE w.auth_user_id = auth.uid() AND w.rol = 'ADMINISTRADOR'
        )
    );

-- 3. Trigger automático para vincular auth_user_id al iniciar sesión
CREATE OR REPLACE FUNCTION public.sync_auth_user_whitelist()
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_whitelist();
