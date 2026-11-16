import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

describe('Clean Architecture Contract', () => {
    it('garantiza que no existen archivos legacy', () => {
        assert.equal(fs.existsSync('src/services/api.js'), false)
        assert.equal(fs.existsSync('backend'), false)
        assert.equal(fs.existsSync('docs'), false)
    })

    it('verifica que el esquema canónico y el cliente existen', () => {
        assert.equal(fs.existsSync('supabase/schema.sql'), true)
        assert.equal(fs.existsSync('src/services/supabaseClient.js'), true)
    })
})
