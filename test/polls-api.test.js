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

  it('GET /polls/:id returns poll details with tallies and winner', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Best Friday snack?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Add options
    const pizzaResponse = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Pizza' }),
    })
    const pizzaData = await pizzaResponse.json()
    const pizzaId = pizzaData.optionId

    const tacoResponse = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Tacos' }),
    })
    const tacoData = await tacoResponse.json()
    const tacoId = tacoData.optionId

    // Cast votes (3 for pizza, 1 for tacos)
    await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: pizzaId, userId: 'user5' }),
    })
    await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: pizzaId, userId: 'user6' }),
    })
    await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: pizzaId, userId: 'user7' }),
    })
    await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: tacoId, userId: 'user8' }),
    })

    // Get poll results
    const resultsResponse = await fetch(`http://localhost:${port}/polls/${pollId}`)
    assert.equal(resultsResponse.status, 200)
    const results = await resultsResponse.json()

    assert.equal(results.pollId, pollId)
    assert.equal(results.question, 'Best Friday snack?')
    assert.equal(results.deadline, '2026-11-01T12:00:00Z')
    assert.equal(results.options.length, 2)

    // Find pizza and taco options
    const pizzaOption = results.options.find((opt) => opt.id === pizzaId)
    const tacoOption = results.options.find((opt) => opt.id === tacoId)

    assert.ok(pizzaOption)
    assert.equal(pizzaOption.text, 'Pizza')
    assert.equal(pizzaOption.voteCount, 3)

    assert.ok(tacoOption)
    assert.equal(tacoOption.text, 'Tacos')
    assert.equal(tacoOption.voteCount, 1)

    // Pizza should be the winner
    assert.equal(results.winner, pizzaId)
  })

  it('GET /polls/:id returns 404 if poll does not exist', async () => {
    const response = await fetch(`http://localhost:${port}/polls/nonexistent-poll`)
    assert.equal(response.status, 404)
    const data = await response.json()
    assert.ok(data.error)
  })

  it('GET /polls/:id returns null winner when no votes have been cast', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'No votes poll?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Add an option but don't vote
    await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Option 1' }),
    })

    // Get poll results
    const resultsResponse = await fetch(`http://localhost:${port}/polls/${pollId}`)
    assert.equal(resultsResponse.status, 200)
    const results = await resultsResponse.json()

    assert.equal(results.winner, null)
    assert.equal(results.options[0].voteCount, 0)
  })

  it('GET /polls/:id returns empty options array when no options added', async () => {
    // Create a poll without adding options
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Empty poll?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Get poll results
    const resultsResponse = await fetch(`http://localhost:${port}/polls/${pollId}`)
    assert.equal(resultsResponse.status, 200)
    const results = await resultsResponse.json()

    assert.equal(results.options.length, 0)
    assert.equal(results.winner, null)
  })
})
