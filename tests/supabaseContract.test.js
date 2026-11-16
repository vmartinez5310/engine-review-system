import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

describe('Supabase Client Contract & Clean Architecture', () => {
  it('garantiza que el backend de Google Apps Script y api.js han sido eliminados', () => {
    assert.equal(fs.existsSync('src/services/api.js'), false, 'src/services/api.js aún existe')
    assert.equal(fs.existsSync('backend'), false, 'El directorio backend/ aún existe')
  })

  it('verifica que el cliente supabaseClient.js existe y está configurado', () => {
    assert.equal(fs.existsSync('src/services/supabaseClient.js'), true, 'supabaseClient.js no encontrado')
    const content = fs.readFileSync('src/services/supabaseClient.js', 'utf8')
    assert.match(content, /createClient/, 'supabaseClient.js no inicializa createClient')
  })

  it('valida que el esquema relacional de migraciones existe', () => {
    assert.equal(fs.existsSync('supabase/migrations/0001_initial_schema.sql'), true, 'Migración inicial faltante')
    assert.equal(fs.existsSync('supabase/migrations/0002_fix_auth_and_whitelist.sql'), true, 'Migración de corrección faltante')
  })

  it('comprueba que .env.example incluya las variables de Supabase', () => {
    const envExample = fs.readFileSync('.env.example', 'utf8')
    assert.match(envExample, /VITE_SUPABASE_URL/, 'Falta VITE_SUPABASE_URL en .env.example')
    assert.match(envExample, /VITE_SUPABASE_ANON_KEY/, 'Falta VITE_SUPABASE_ANON_KEY en .env.example')
  })
})
