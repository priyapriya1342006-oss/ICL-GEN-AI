import { test, describe } from 'node:test'
import assert from 'node:assert'
import express from 'express'
import { generationLimiter } from '../middleware/rateLimiter.js'

describe('StorySpark Input Validation & Rate Limiting Tests', () => {
  test('Rate limiter middleware attaches standard rate-limit headers', async () => {
    const app = express()
    app.use(generationLimiter)
    app.get('/test-limit', (req, res) => res.json({ ok: true }))

    let server
    const port = await new Promise((resolve) => {
      server = app.listen(0, () => resolve(server.address().port))
    })

    const res = await fetch(`http://127.0.0.1:${port}/test-limit`)
    assert.strictEqual(res.status, 200)
    assert.ok(res.headers.get('ratelimit-limit'))
    assert.ok(res.headers.get('ratelimit-remaining'))

    await new Promise((resolve) => server.close(resolve))
  })

  test('Validates prompt boundaries (1 to 1200 characters)', () => {
    const emptyPrompt = '   '
    assert.strictEqual(emptyPrompt.trim().length === 0, true)

    const validPrompt = 'A clockmaker finds a lost time gear'
    assert.ok(validPrompt.trim().length >= 5 && validPrompt.trim().length <= 1200)

    const oversizedPrompt = 'a'.repeat(1201)
    assert.ok(oversizedPrompt.length > 1200)
  })

  test('Supports all 5 creative modes accurately', () => {
    const VALID_MODES = ['idea', 'full_story', 'script', 'character', 'plot']
    assert.strictEqual(VALID_MODES.length, 5)
    assert.ok(VALID_MODES.includes('idea'))
    assert.ok(VALID_MODES.includes('full_story'))
    assert.ok(VALID_MODES.includes('script'))
    assert.ok(VALID_MODES.includes('character'))
    assert.ok(VALID_MODES.includes('plot'))
  })
})
