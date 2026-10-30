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

  it('POST /polls/:id/options adds an option and returns 201 with optionId', async () => {
    // First create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Best snack?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Then add an option
    const optionResponse = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Pizza' }),
    })

    assert.equal(optionResponse.status, 201)
    const optionData = await optionResponse.json()
    assert.ok(optionData.optionId)
    assert.ok(optionData.optionId.startsWith('option-'))
  })

  it('POST /polls/:id/options returns 404 if poll does not exist', async () => {
    const response = await fetch(`http://localhost:${port}/polls/nonexistent-poll/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Pizza' }),
    })

    assert.equal(response.status, 404)
    const data = await response.json()
    assert.ok(data.error)
  })

  it('POST /polls/:id/vote casts a vote and returns 201 with voteId', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Best snack?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Add an option
    const optionResponse = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Pizza' }),
    })
    const optionData = await optionResponse.json()
    const optionId = optionData.optionId

    // Cast a vote
    const voteResponse = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'user1' }),
    })

    assert.equal(voteResponse.status, 201)
    const voteData = await voteResponse.json()
    assert.ok(voteData.voteId)
    assert.ok(voteData.voteId.startsWith('vote-'))
  })

  it('POST /polls/:id/vote returns 409 if user already voted on the poll', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Favorite snack?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Add an option
    const optionResponse = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Chips' }),
    })
    const optionData = await optionResponse.json()
    const optionId = optionData.optionId

    // Cast first vote
    await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'user2' }),
    })

    // Try to vote again
    const secondVoteResponse = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'user2' }),
    })

    assert.equal(secondVoteResponse.status, 409)
    const data = await secondVoteResponse.json()
    assert.ok(data.error)
    assert.match(data.error, /already voted/i)
  })

  it('POST /polls/:id/vote returns 404 if poll does not exist', async () => {
    const response = await fetch(`http://localhost:${port}/polls/nonexistent-poll/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: 'option-1', userId: 'user3' }),
    })

    assert.equal(response.status, 404)
    const data = await response.json()
    assert.ok(data.error)
  })

  it('POST /polls/:id/vote returns 404 if option does not exist', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Test poll?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Try to vote for non-existent option
    const voteResponse = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: 'nonexistent-option', userId: 'user4' }),
    })

    assert.equal(voteResponse.status, 404)
    const data = await voteResponse.json()
    assert.ok(data.error)
  })
})
