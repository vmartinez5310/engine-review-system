set -e

echo "=================================================="
echo ">>> INICIANDO FASE 5: Eliminación de Código Legacy"
echo "=================================================="

# 1. Eliminar cliente legacy y backend de Google Apps Script
echo ">>> Eliminando archivos legacy..."
rm -f src/services/api.js
rm -rf backend/

# 2. Actualizar las pruebas para el nuevo contrato con Supabase
echo ">>> Actualizando suite de pruebas..."
rm -f tests/apiHandlers.test.js

cat << 'EOF' > tests/supabaseContract.test.js
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
EOF

# 3. Compilación de producción
echo ">>> Ejecutando npm run build..."
npm run build

# 4. Ejecución de pruebas unitarias
echo ">>> Ejecutando pruebas unitarias con npm test..."
npm test

# 5. Commit y push final
echo ">>> Registrando cambios en Git..."
git add .
git commit -m "chore(cleanup): remove legacy Google Apps Script backend and api client (Fase 5 final)"
git push origin HEAD || echo "[WARN] Verifica tu conexión remota para push"

rm run_fase5.sh

echo "=================================================="
echo ">>> ¡MIGRACIÓN COMPLETADA EXITOSAMENTE! 🎉"
echo ">>> Arquitectura 100% migrada a Vue 3 + Supabase (PostgreSQL)."
echo "=================================================="
