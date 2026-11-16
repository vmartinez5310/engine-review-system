import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTokenEstado, statusTone } from '../src/utils/tokenEstado.js'

describe('normalizeTokenEstado', () => {
  it('maps Activo under 7 days', () => {
    assert.equal(normalizeTokenEstado('Activo', 3), 'Activo')
  })
  it('maps Activo over 7 days to Expirado', () => {
    assert.equal(normalizeTokenEstado('Activo', 8), 'Expirado')
  })
  it('maps Usado', () => {
    assert.equal(normalizeTokenEstado('Usado', 0), 'Usado')
  })
  it('maps Cancelado to Revocado', () => {
    assert.equal(normalizeTokenEstado('Cancelado', 0), 'Revocado')
  })
  it('defaults empty to Activo', () => {
    assert.equal(normalizeTokenEstado('', 0), 'Activo')
  })
})

describe('statusTone', () => {
  it('success tones', () => {
    assert.equal(statusTone('Activo'), 'success')
    assert.equal(statusTone('Usado'), 'success')
    assert.equal(statusTone('Aprobado'), 'success')
  })
  it('warning tones', () => {
    assert.equal(statusTone('Pendiente'), 'warning')
    assert.equal(statusTone('Expirado'), 'warning')
  })
  it('danger tones', () => {
    assert.equal(statusTone('Revocado'), 'danger')
    assert.equal(statusTone('Archivado'), 'danger')
  })
})
