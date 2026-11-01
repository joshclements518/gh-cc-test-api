import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'

/**
 * Make HTTP request to test server
 * @param {string} method
 * @param {string} path
 * @param {object|null} body
 */
async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
    }

    const req = request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        })
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

describe('polls-api-contract', () => {
  it('POST /polls creates a poll and returns id', async () => {
    const res = await makeRequest('POST', '/polls', {
      question: 'What snack for Friday?',
      deadline: '2026-11-08T12:00:00Z',
    })

    assert.equal(res.status, 201)
    assert.ok(res.body.id, 'response should have id field')
    assert.match(res.body.id, /^poll-\d+$/, 'id should match poll-N format')
  })

  it('POST /polls returns 400 if question is missing', async () => {
    const res = await makeRequest('POST', '/polls', {
      deadline: '2026-11-08T12:00:00Z',
    })

    assert.equal(res.status, 400)
    assert.ok(res.body.error)
  })

  it('POST /polls returns 400 if deadline is missing', async () => {
    const res = await makeRequest('POST', '/polls', {
      question: 'What snack?',
    })

    assert.equal(res.status, 400)
    assert.ok(res.body.error)
  })

  it('POST /polls accepts ISO8601 deadline format', async () => {
    const res = await makeRequest('POST', '/polls', {
      question: 'Chips or cookies?',
      deadline: '2026-11-15T15:30:00.000Z',
    })

    assert.equal(res.status, 201)
    assert.ok(res.body.id)
  })

  it('POST /polls response shape contains only id field', async () => {
    const res = await makeRequest('POST', '/polls', {
      question: 'Pizza or tacos?',
      deadline: '2026-11-22T18:00:00Z',
    })

    assert.equal(res.status, 201)
    const keys = Object.keys(res.body)
    assert.deepEqual(keys, ['id'], 'response should only contain id field')
  })
})
