/**
 * Normalize token sheet state + age into UI lifecycle labels.
 * Mirrors backend dash_obtenerSeguimientos / dash_obtenerTokens.
 */
export function normalizeTokenEstado(rawEstado, dias = 0) {
  const raw = String(rawEstado || '').trim()
  if (raw === 'Usado') return 'Usado'
  if (raw === 'Cancelado') return 'Revocado'
  if (raw === 'Activo' && Number(dias) > 7) return 'Expirado'
  if (raw === 'Activo') return 'Activo'
  return raw || 'Activo'
}

export function statusTone(status) {
  const s = String(status || '').toUpperCase().trim()
  if (['ACTIVO', 'APROBADO', 'COMPLETADO', 'USADO'].includes(s)) return 'success'
  if (['PENDIENTE', 'EN ESPERA', 'REVISIÓN', 'EXPIRADO'].includes(s)) return 'warning'
  if (['REVOCADO', 'RECHAZADO', 'ERROR', 'CANCELADO', 'ARCHIVADO', 'SUSPENDIDO'].includes(s)) return 'danger'
  return 'neutral'
}
