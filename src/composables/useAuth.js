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

    // Usar la función RPC para garantizar la lectura del perfil sin problemas de RLS
    const { data: result, error: rpcError } = await supabase.rpc('get_my_profile')

    if (rpcError || !result?.success) {
      console.warn('Error al obtener perfil:', rpcError?.message || result?.error)
      // Si el perfil no existe en la whitelist, cerrar sesión
      await supabase.auth.signOut()
      authState.user = null
      authState.isAuthenticated = false
      return false
    }

    const p = result.profile
    if (String(p.estado).toUpperCase() === 'SUSPENDIDO') {
      await supabase.auth.signOut()
      authState.user = null
      authState.isAuthenticated = false
      throw new Error('Tu cuenta se encuentra suspendida.')
    }

    const rol = String(p.rol || 'USUARIO').toUpperCase().trim()
    const permisos = ROLES_PERMISOS[rol] || ROLES_PERMISOS.USUARIO

    authState.user = {
      userId: p.userId,
      nombre: p.nombre || 'Usuario',
      email: p.email,
      rol: p.rol || 'USUARIO',
      estado: p.estado,
      logo: p.logo || '',
      permisos,
      notificaciones: p.notificaciones || { resenasNuevas: 0, seguimientosAtrasados: 0 }
    }

    authState.isAuthenticated = true
    return true
  } catch (err) {
    console.error('Error en fetchUserInfo:', err)
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

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    await fetchUserInfo()
  } else {
    authState.user = null
    authState.isAuthenticated = false
    authState.isReady = true
  }
})
