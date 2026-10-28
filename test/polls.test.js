import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPoll } from '../src/polls.js'

describe('polls-api', () => {
  it('creates a valid poll with question and future deadline', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString() // 1 day in future
    const result = createPoll('What snack should we get?', futureDate)

    assert.ok(result.poll, 'Should return a poll')
    assert.ok(result.poll.pollId, 'Should have a pollId')
    assert.equal(result.poll.question, 'What snack should we get?')
    assert.equal(result.poll.deadline, futureDate)
    assert.ok(result.poll.createdAt, 'Should have createdAt timestamp')

    // Verify createdAt is a valid ISO 8601 timestamp
    const createdDate = new Date(result.poll.createdAt)
    assert.ok(!isNaN(createdDate.getTime()), 'createdAt should be a valid date')
  })

  it('rejects poll with missing question', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('', futureDate)

    assert.ok(result.error, 'Should return an error')
    assert.ok(!result.poll, 'Should not return a poll')
  })

  it('rejects poll with missing deadline', () => {
    const result = createPoll('What snack?', '')

    assert.ok(result.error, 'Should return an error')
    assert.ok(!result.poll, 'Should not return a poll')
  })

  it('rejects poll with past deadline', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString() // 1 day in past
    const result = createPoll('What snack?', pastDate)

    assert.ok(result.error, 'Should return an error')
    assert.equal(result.error, 'Deadline must be in the future')
    assert.ok(!result.poll, 'Should not return a poll')
  })

  it('rejects poll with invalid deadline format', () => {
    const result = createPoll('What snack?', 'not-a-date')

    assert.ok(result.error, 'Should return an error')
    assert.ok(!result.poll, 'Should not return a poll')
  })

  it('trims whitespace from question', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('  What snack?  ', futureDate)

    assert.ok(result.poll, 'Should return a poll')
    assert.equal(result.poll.question, 'What snack?')
  })

  it('generates unique poll IDs', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result1 = createPoll('First poll', futureDate)
    const result2 = createPoll('Second poll', futureDate)

    assert.ok(result1.poll, 'Should create first poll')
    assert.ok(result2.poll, 'Should create second poll')
    assert.notEqual(result1.poll.pollId, result2.poll.pollId, 'Poll IDs should be unique')
  })
})
