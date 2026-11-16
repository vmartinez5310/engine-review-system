-- ==============================================================================
-- Función RPC: Obtener perfil institucional del usuario autenticado
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSON AS $$
DECLARE
    current_email TEXT;
    user_record RECORD;
    resenas_pendientes INT := 0;
    tokens_activos INT := 0;
BEGIN
    -- Obtener el email del token de sesión de Supabase
    current_email := LOWER(TRIM(auth.jwt()->>'email'));
    
    IF current_email IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No hay sesión activa');
    END IF;

    -- Buscar en la tabla whitelist sin que RLS interfiera
    SELECT id, user_id, nombre, email, rol, estado, logo, auth_user_id
    INTO user_record
    FROM public.whitelist
    WHERE LOWER(TRIM(email)) = current_email
       OR auth_user_id = auth.uid()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Perfil no encontrado en whitelist');
    END IF;

    -- Si estaba pendiente, activarlo
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

    -- Conteos para insignias de notificación
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

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
