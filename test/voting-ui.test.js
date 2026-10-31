import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

describe('voting-ui', () => {
  let server
  const port = 4002

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

  it('serves voting UI HTML at /vote', async () => {
    const response = await fetch(`http://localhost:${port}/vote`)
    assert.equal(response.status, 200)
    const contentType = response.headers.get('content-type')
    assert.ok(contentType.includes('text/html'))

    const html = await response.text()
    assert.ok(html.includes('Vote - Snack Poll'))
    assert.ok(html.includes('voting.js'))
  })

  it('serves voting.js script at /app/lib/voting.js', async () => {
    const response = await fetch(`http://localhost:${port}/app/lib/voting.js`)
    assert.equal(response.status, 200)
    const contentType = response.headers.get('content-type')
    assert.ok(contentType.includes('application/javascript'))

    const js = await response.text()
    assert.ok(js.includes('VotingManager'))
    assert.ok(js.includes('castVote'))
  })

  it('voting UI successfully casts a vote', async () => {
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

    // Add options
    const option1Response = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Pizza' }),
    })
    const option1Data = await option1Response.json()
    const optionId = option1Data.optionId

    const option2Response = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Tacos' }),
    })

    // Get poll data (simulating what voting UI loads)
    const pollDetailsResponse = await fetch(`http://localhost:${port}/polls/${pollId}`)
    assert.equal(pollDetailsResponse.status, 200)
    const pollDetails = await pollDetailsResponse.json()

    // Verify poll has options with vote buttons data
    assert.equal(pollDetails.options.length, 2)
    assert.ok(pollDetails.options.find((opt) => opt.text === 'Pizza'))
    assert.ok(pollDetails.options.find((opt) => opt.text === 'Tacos'))

    // Cast a vote (simulating UI button click)
    const voteResponse = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'test-user-ui-1' }),
    })

    assert.equal(voteResponse.status, 201)
    const voteData = await voteResponse.json()
    assert.ok(voteData.voteId)
  })

  it('voting UI prevents double-voting via API 409 response', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Double vote test?',
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

    // First vote succeeds
    const vote1Response = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'test-user-ui-2' }),
    })
    assert.equal(vote1Response.status, 201)

    // Second vote fails with 409 (UI will show "Already voted" message)
    const vote2Response = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'test-user-ui-2' }),
    })
    assert.equal(vote2Response.status, 409)
    const errorData = await vote2Response.json()
    assert.ok(errorData.error)
    assert.match(errorData.error, /already voted/i)
  })

  it('voting UI shows success confirmation after vote', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'Success message test?',
        deadline: '2026-11-01T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Add an option
    const optionResponse = await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Cookies' }),
    })
    const optionData = await optionResponse.json()
    const optionId = optionData.optionId

    // Cast vote
    const voteResponse = await fetch(`http://localhost:${port}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId, userId: 'test-user-ui-3' }),
    })

    assert.equal(voteResponse.status, 201)
    const voteData = await voteResponse.json()

    // Verify success response that UI will display
    assert.ok(voteData.voteId)
    assert.ok(voteData.voteId.startsWith('vote-'))
  })

  it('voting UI displays option list for open poll', async () => {
    // Create a poll
    const pollResponse = await fetch(`http://localhost:${port}/polls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'What should we have?',
        deadline: '2026-11-05T12:00:00Z',
      }),
    })
    const pollData = await pollResponse.json()
    const pollId = pollData.pollId

    // Add multiple options
    await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Pizza' }),
    })
    await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Burgers' }),
    })
    await fetch(`http://localhost:${port}/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Salad' }),
    })

    // Get poll details (what UI loads)
    const pollDetailsResponse = await fetch(`http://localhost:${port}/polls/${pollId}`)
    const pollDetails = await pollDetailsResponse.json()

    // Verify UI has all the data needed to show option list with vote buttons
    assert.equal(pollDetails.question, 'What should we have?')
    assert.equal(pollDetails.deadline, '2026-11-05T12:00:00Z')
    assert.equal(pollDetails.options.length, 3)

    const optionTexts = pollDetails.options.map((opt) => opt.text)
    assert.ok(optionTexts.includes('Pizza'))
    assert.ok(optionTexts.includes('Burgers'))
    assert.ok(optionTexts.includes('Salad'))

    // Each option should have an id for voting
    pollDetails.options.forEach((option) => {
      assert.ok(option.id)
      assert.ok(option.text)
    })
  })
})
