export const cacheStorage = {
  get(key, maxAgeMs = 300000) {
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
      console.warn('Fallo al escribir en cache:', e)
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(`app_cache_${key}`)
    } catch {}
  },
  invalidate(key) {
    this.remove(key)
  },
  invalidateAll() {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('app_cache_'))
        .forEach(k => sessionStorage.removeItem(k))
    } catch {}
  }
}
