import { reactive } from 'vue'
import { supabase } from '../services/supabaseClient'

export const ROLES_PERMISOS = {
  ADMINISTRADOR: [
    'ver_dashboard',
    'generar_enlace',
    'ver_seguimientos',
    'editar_resena',
    'gestionar_usuarios',
    'configurar_sistema'
  ],
  SUPERVISOR: [
    'ver_dashboard',
    'generar_enlace',
    'ver_seguimientos',
    'editar_resena'
  ],
  APROBADOR: [
    'ver_dashboard',
    'editar_resena'
  ],
  USUARIO: [
    'ver_dashboard',
    'generar_enlace',
    'ver_seguimientos'
  ]
}

export const authState = reactive({
  user: null,
  isAuthenticated: false,
  isReady: false
})

export async function fetchUserInfo() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      authState.user = null
      authState.isAuthenticated = false
      return false
    }

    const emailLimpio = session.user.email.toLowerCase().trim()

    // Consultar perfil de whitelist en Supabase
    const { data: usuario, error: userError } = await supabase
      .from('whitelist')
      .select('*')
      .ilike('email', emailLimpio)
      .maybeSingle()

    if (userError || !usuario) {
      console.warn('Usuario no encontrado en la whitelist institucional:', emailLimpio)
      await supabase.auth.signOut()
      authState.user = null
      authState.isAuthenticated = false
      return false
    }

    if (String(usuario.estado).toUpperCase() === 'SUSPENDIDO') {
      await supabase.auth.signOut()
      authState.user = null
      authState.isAuthenticated = false
      throw new Error('Tu cuenta se encuentra suspendida. Contacta a un administrador.')
    }

    // Si el usuario estaba pendiente de activación, se activa con el primer inicio de sesión
    if (String(usuario.estado).toUpperCase() === 'PENDIENTE') {
      await supabase
        .from('whitelist')
        .update({ estado: 'Activo', auth_user_id: session.user.id })
        .eq('id', usuario.id)
      usuario.estado = 'Activo'
    } else if (!usuario.auth_user_id) {
      // Vincular UUID de autenticación si aún no lo tiene
      await supabase
        .from('whitelist')
        .update({ auth_user_id: session.user.id })
        .eq('id', usuario.id)
    }

    const rol = String(usuario.rol || 'USUARIO').toUpperCase().trim()
    const permisos = ROLES_PERMISOS[rol] || ROLES_PERMISOS.USUARIO

    // Notificaciones: conteo de reseñas pendientes y enlaces
    const [{ count: resenasNuevas }, { count: seguimientosAtrasados }] = await Promise.all([
      supabase.from('resenas').select('*', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
      supabase.from('tokens').select('*', { count: 'exact', head: true }).eq('estado', 'Activo')
    ])

    authState.user = {
      userId: usuario.user_id || usuario.id,
      nombre: usuario.nombre || 'Usuario',
      email: usuario.email,
      rol: usuario.rol || 'USUARIO',
      estado: usuario.estado,
      logo: usuario.logo || '',
      permisos,
      notificaciones: {
        resenasNuevas: resenasNuevas || 0,
        seguimientosAtrasados: seguimientosAtrasados || 0
      }
    }

    authState.isAuthenticated = true
    return true
  } catch (err) {
    console.error('Error al sincronizar usuario:', err)
    authState.user = null
    authState.isAuthenticated = false
    return false
  } finally {
    authState.isReady = true
  }
}

export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('inm_dash_token')
  authState.user = null
  authState.isAuthenticated = false
  window.location.reload()
}

export function hasPermission(permission) {
  return (authState.user?.permisos || []).includes(permission)
}

// Suscripción al estado de autenticación en Supabase
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    await fetchUserInfo()
  } else {
    authState.user = null
    authState.isAuthenticated = false
    authState.isReady = true
  }
})
