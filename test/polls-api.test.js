import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'

// Import server setup (we'll make a minimal test server)
import { createPoll } from '../src/polls.js'

describe('polls-api', () => {
  let server
  const port = 4001

  before(() => {
    // Create a minimal test server with just the polls endpoint
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const cors = {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204, cors)
        res.end()
        return
      }

      if (req.method === 'POST' && url.pathname === '/polls') {
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}')
            const result = createPoll(parsed.question, parsed.deadline, parsed.options)
            if (result.error) {
              res.writeHead(400, { 'content-type': 'application/json', ...cors })
              res.end(JSON.stringify({ error: result.error }))
            } else {
              res.writeHead(201, { 'content-type': 'application/json', ...cors })
              res.end(JSON.stringify(result.poll))
            }
          } catch (err) {
            res.writeHead(400, { 'content-type': 'application/json', ...cors })
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          }
        })
        return
      }

      res.writeHead(404)
      res.end('not found')
    })

    return new Promise((resolve) => {
      server.listen(port, resolve)
    })
  })

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve)
    })
  })

  it('POST /polls returns 201 with valid data', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const payload = {
      question: 'Friday snack choice?',
      deadline: futureDate,
      options: ['Pizza', 'Tacos', 'Sushi'],
    }

    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    assert.equal(response.status, 201, 'Should return 201')
    const data = await response.json()
    assert.ok(data.id, 'Response should have poll id')
    assert.equal(data.question, payload.question)
    assert.equal(data.deadline, payload.deadline)
    assert.deepEqual(data.options, payload.options)
  })

  it('POST /polls returns 400 with missing question', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const payload = {
      deadline: futureDate,
      options: ['Pizza'],
    }

    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    assert.equal(response.status, 400, 'Should return 400')
    const data = await response.json()
    assert.ok(data.error, 'Response should have error message')
  })

  it('POST /polls returns 400 with past deadline', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const payload = {
      question: 'Test?',
      deadline: pastDate,
      options: ['Option1'],
    }

    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    assert.equal(response.status, 400, 'Should return 400')
    const data = await response.json()
    assert.match(data.error, /future/, 'Error should mention future deadline')
  })

  it('POST /polls returns 400 with empty options', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const payload = {
      question: 'Test?',
      deadline: futureDate,
      options: [],
    }

    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    assert.equal(response.status, 400, 'Should return 400')
    const data = await response.json()
    assert.ok(data.error, 'Response should have error message')
  })

  it('POST /polls returns 400 with invalid JSON', async () => {
    const response = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-valid-json',
    })

    assert.equal(response.status, 400, 'Should return 400')
    const data = await response.json()
    assert.match(data.error, /Invalid JSON/, 'Error should mention invalid JSON')
  })
})
