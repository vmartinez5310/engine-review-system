import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

describe('Arquitectura y Contrato de Persistencia', () => {
  it('garantiza la ausencia de controladores heredados', () => {
    assert.equal(fs.existsSync('src/services/api.js'), false)
    assert.equal(fs.existsSync('backend'), false)
    assert.equal(fs.existsSync('docs'), false)
  })

  it('valida la disponibilidad del esquema de base de datos y cliente Supabase', () => {
    assert.equal(fs.existsSync('supabase/schema.sql'), true)
    assert.equal(fs.existsSync('src/services/supabaseClient.js'), true)
  })
})
