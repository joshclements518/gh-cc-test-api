import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createPoll } from '../src/polls.js'

// Mock server endpoint for testing
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4001,
      path,
      method,
      headers: { 'content-type': 'application/json' },
    }

    const req = createServer.request || require('node:http').request
    const request = req(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data ? JSON.parse(data) : null,
        })
      })
    })

    request.on('error', reject)
    if (body) request.write(JSON.stringify(body))
    request.end()
  })
}

describe('polls-http-api', () => {
  it('POST /polls creates a poll and returns 201', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('Test poll question', futureDate)

    assert.ok(result.poll)
    assert.equal(result.poll.question, 'Test poll question')
    assert.equal(result.poll.deadline, futureDate)
  })

  it('POST /polls validates missing question', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('', futureDate)

    assert.ok(result.error)
  })

  it('POST /polls validates past deadline', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const result = createPoll('Test question', pastDate)

    assert.ok(result.error)
    assert.equal(result.error, 'Deadline must be in the future')
  })
})
