import { test, describe } from 'node:test'
import assert from 'node:assert'
import express from 'express'
import generateRouter from '../routes/generate.js'

// Setup lightweight test app
function createTestApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'StorySpark AI Backend',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
      serverTime: new Date().toISOString(),
    })
  })

  app.use('/api', generateRouter)
  return app
}

describe('StorySpark AI Backend API Security & Validation Tests', () => {
  let server
  let baseUrl

  test('Start test server', async () => {
    const app = createTestApp()
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })
    assert.ok(baseUrl)
  })

  test('GET /api/health should return status healthy and serverTime', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.strictEqual(data.status, 'healthy')
    assert.strictEqual(data.service, 'StorySpark AI Backend')
    assert.ok(data.serverTime)
  })

  test('POST /api/generate should reject requests without Authorization header (401)', async () => {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'idea', prompt: 'A magic compass' }),
    })
    assert.strictEqual(res.status, 401)
    const data = await res.json()
    assert.ok(data.error.includes('Authentication required'))
  })

  test('POST /api/generate should reject requests with empty Bearer token (401)', async () => {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ',
      },
      body: JSON.stringify({ mode: 'idea', prompt: 'A magic compass' }),
    })
    assert.strictEqual(res.status, 401)
    const data = await res.json()
    assert.ok(data.error)
  })

  test('POST /api/generate should reject requests with malformed/invalid token (401)', async () => {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake_invalid_jwt_token_12345',
      },
      body: JSON.stringify({ mode: 'idea', prompt: 'A magic compass' }),
    })
    assert.strictEqual(res.status, 401)
    const data = await res.json()
    assert.ok(data.error.includes('Invalid or expired'))
  })

  test('Shutdown test server', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    assert.strictEqual(server.listening, false)
  })
})
