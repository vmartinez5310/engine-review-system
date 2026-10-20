import { reactive } from 'vue'
import { apiClient } from '../services/api'

export const authState = reactive({
  user: null,
  isAuthenticated: false,
  isReady: false
})

export async function fetchUserInfo(overrideToken = null) {
  const token = overrideToken || localStorage.getItem('inm_dash_token')
  if (!token) {
    authState.isReady = true
    return false
  }

  try {
    const data = await apiClient.post('get_user_info', overrideToken ? { token: overrideToken } : {})
    authState.user = data
    authState.isAuthenticated = true
    return true
  } catch (e) {
    console.error(e.message)
    return false
  } finally {
    authState.isReady = true
  }
}

export function logout() {
  localStorage.removeItem('inm_dash_token')
  authState.user = null
  authState.isAuthenticated = false
  window.location.reload()
}

export function hasPermission(permission) {
  return (authState.user?.permisos || []).includes(permission)
}
