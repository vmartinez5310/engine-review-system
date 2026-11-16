-- ==============================================================================
-- SINCRONIZACIÓN AUTOMÁTICA DRY: auth.users <-> whitelist
-- ==============================================================================

-- 1. Trigger al autenticar por primera vez: enlaza auth_user_id y activa perfil
CREATE OR REPLACE FUNCTION public.handle_user_first_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.whitelist
    SET 
        auth_user_id = NEW.id,
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

-- 2. Si un administrador borra un usuario en el Dashboard, se revoca su sesión en auth
CREATE OR REPLACE FUNCTION public.handle_whitelist_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.auth_user_id IS NOT NULL THEN
        -- Elimina la sesión activa y credencial en auth.users
        DELETE FROM auth.users WHERE id = OLD.auth_user_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_whitelist_deleted ON public.whitelist;
CREATE TRIGGER tr_on_whitelist_deleted
    AFTER DELETE ON public.whitelist
    FOR EACH ROW EXECUTE FUNCTION public.handle_whitelist_user_deleted();
