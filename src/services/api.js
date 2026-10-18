const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  console.error('[api] VITE_API_URL is not set. Copy .env.example to .env')
}

export const apiClient = {
  async post(action, payload = {}) {
    const token = localStorage.getItem('inm_dash_token')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload, token })
      })
      const result = await res.json()
      if (result.status === 'error') throw new Error(result.message)
      return result.data
    } catch (err) {
      console.error(`API [${action}]:`, err)
      throw err
    }
  }
}

export function getApiUrl() {
  return API_URL
}
