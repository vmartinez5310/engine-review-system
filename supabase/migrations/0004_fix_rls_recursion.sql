-- ==============================================================================
-- FIX: Romper recursión infinita en políticas de whitelist usando SECURITY DEFINER
-- ==============================================================================

-- 1. Función auxiliar segura que NO dispara RLS recursivo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.whitelist 
        WHERE (auth_user_id = auth.uid() OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email')))
          AND rol = 'ADMINISTRADOR'
          AND estado = 'Activo'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Limpiar políticas recursivas de whitelist
DROP POLICY IF EXISTS "Lectura de whitelist para usuarios autenticados" ON public.whitelist;
DROP POLICY IF EXISTS "Gestión total de whitelist por Administradores" ON public.whitelist;
DROP POLICY IF EXISTS "Usuarios pueden leer su propio perfil" ON public.whitelist;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.whitelist;

-- 3. Crear políticas limpias sin subconsultas cíclicas
-- Lectura: Puedes leer tu propio registro O todos si eres administrador
CREATE POLICY "whitelist_select_policy" ON public.whitelist
    FOR SELECT TO authenticated
    USING (
        auth_user_id = auth.uid()
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email'))
        OR public.is_admin()
    );

-- Inserción: Solo administradores pueden dar de alta usuarios
CREATE POLICY "whitelist_insert_policy" ON public.whitelist
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
    );

-- Actualización: Cada quien actualiza sus datos básicos, o el admin edita cualquiera
CREATE POLICY "whitelist_update_policy" ON public.whitelist
    FOR UPDATE TO authenticated
    USING (
        auth_user_id = auth.uid()
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email'))
        OR public.is_admin()
    )
    WITH CHECK (
        auth_user_id = auth.uid()
        OR LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt()->>'email'))
        OR public.is_admin()
    );

-- Borrado: Solo administradores
CREATE POLICY "whitelist_delete_policy" ON public.whitelist
    FOR DELETE TO authenticated
    USING (
        public.is_admin()
    );
