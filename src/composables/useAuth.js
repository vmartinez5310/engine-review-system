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
    const payload = overrideToken ? { token: overrideToken } : {}
    const data = await apiClient.post('get_user_info', payload) 
    
    authState.user = data
    authState.isAuthenticated = true
    return true
  } catch (error) {
    console.error(error.message)
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