import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/** Expected WebApp action registry — must stay in sync with backend/WebApp.gs */
const REQUIRED_ACTIONS = [
  'get_public_reviews',
  'submit_review',
  'request_otp',
  'verify_otp',
  'get_dashboard_reviews',
  'update_review',
  'generate_link',
  'get_tracking',
  'revoke_link',
  'get_users',
  'update_user',
  'update_profile',
  'add_user',
  'call_ai',
  'get_public_config',
  'update_config',
  'get_user_info',
  'get_kpis',
  'get_tokens'
]

describe('WebApp handler registry', () => {
  it('lists all required actions', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync(new URL('../backend/WebApp.gs', import.meta.url), 'utf8')
    for (const action of REQUIRED_ACTIONS) {
      assert.match(src, new RegExp(`${action}\\s*:`), `missing handler: ${action}`)
    }
  })
})

describe('env contract', () => {
  it('ships .env.example with VITE_API_URL', async () => {
    const fs = await import('node:fs')
    const example = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
    assert.match(example, /VITE_API_URL=/)
  })
  it('api.js reads import.meta.env.VITE_API_URL', async () => {
    const fs = await import('node:fs')
    const api = fs.readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8')
    assert.match(api, /import\.meta\.env\.VITE_API_URL/)
  })
})
