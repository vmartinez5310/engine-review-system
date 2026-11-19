export const cacheStorage = {
  get(key, maxAgeMs = 180000) {
    try {
      const raw = sessionStorage.getItem(`app_cache_${key}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const isExpired = Date.now() - parsed.timestamp > maxAgeMs
      return { data: parsed.data, isExpired }
    } catch {
      return null
    }
  },
  set(key, data) {
    try {
      sessionStorage.setItem(`app_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.warn('Fallo al escribir en caché:', e)
    }
  },
  invalidate(key) {
    try {
      sessionStorage.removeItem(`app_cache_${key}`)
    } catch {}
  },
  invalidateAll() {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('app_cache_'))
        .forEach(k => sessionStorage.removeItem(k))
    } catch {}
  }
}
