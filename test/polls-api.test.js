import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

describe('polls-api', () => {
  let server
  const port = 4001

  before(async () => {
    // Start the server
    server = spawn('node', ['src/server.js'], {
      env: { ...process.env, PORT: String(port) },
      stdio: 'pipe',
    })

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  after(() => {
    if (server) {
      server.kill()
    }
  })

  it('POST /polls creates a poll and returns 201 with pollId', async () => {
    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'What snack for Friday?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })

    assert.equal(response.status, 201)
    const data = await response.json()
    assert.ok(data.pollId)
    assert.ok(data.pollId.startsWith('poll-'))
  })

  it('POST /polls handles missing fields gracefully', async () => {
    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    assert.equal(response.status, 201)
    const data = await response.json()
    assert.ok(data.pollId)
  })
})
