import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPoll, listPolls } from '../src/polls.js'

describe('polls-api', () => {
  it('creates a poll with valid question and deadline', () => {
    const question = 'What should we have for Friday snacks?'
    const deadline = '2026-11-01T12:00:00.000Z'

    const result = createPoll(question, deadline)

    assert.ok(!result.error, 'should not return an error')
    assert.ok(result.poll, 'should return a poll')
    assert.ok(result.poll.pollId, 'poll should have an id')
    assert.equal(result.poll.question, question)
    assert.equal(result.poll.deadline, deadline)
  })

  it('returns 400 error when question is empty', () => {
    const result = createPoll('', '2026-11-01T12:00:00.000Z')

    assert.ok(result.error, 'should return an error')
    assert.equal(result.error, 'Question cannot be empty')
    assert.ok(!result.poll, 'should not return a poll')
  })

  it('returns 400 error when question is whitespace only', () => {
    const result = createPoll('   ', '2026-11-01T12:00:00.000Z')

    assert.ok(result.error, 'should return an error')
    assert.equal(result.error, 'Question cannot be empty')
  })

  it('returns 400 error when deadline is invalid ISO8601', () => {
    const result = createPoll('Valid question', 'not-a-date')

    assert.ok(result.error, 'should return an error')
    assert.equal(result.error, 'Invalid deadline format (must be ISO8601)')
    assert.ok(!result.poll, 'should not return a poll')
  })

  it('returns 400 error when deadline is partial ISO8601', () => {
    const result = createPoll('Valid question', '2026-11-01')

    assert.ok(result.error, 'should return an error')
    assert.equal(result.error, 'Invalid deadline format (must be ISO8601)')
  })

  it('returns 400 error when deadline is missing', () => {
    const result = createPoll('Valid question', undefined)

    assert.ok(result.error, 'should return an error')
    assert.equal(result.error, 'Invalid deadline format (must be ISO8601)')
  })

  it('stores poll in the poll store', () => {
    const initialCount = listPolls().length
    const question = 'Test poll for storage'
    const deadline = '2026-11-02T12:00:00.000Z'

    const result = createPoll(question, deadline)

    assert.ok(result.poll)
    const currentPolls = listPolls()
    assert.equal(currentPolls.length, initialCount + 1)
    assert.ok(currentPolls.some(p => p.pollId === result.poll.pollId))
  })

  it('generates unique poll IDs', () => {
    const result1 = createPoll('Question 1', '2026-11-01T12:00:00.000Z')
    const result2 = createPoll('Question 2', '2026-11-01T12:00:00.000Z')

    assert.ok(result1.poll)
    assert.ok(result2.poll)
    assert.notEqual(result1.poll.pollId, result2.poll.pollId)
  })

  it('trims whitespace from question', () => {
    const result = createPoll('  Question with spaces  ', '2026-11-01T12:00:00.000Z')

    assert.ok(result.poll)
    assert.equal(result.poll.question, 'Question with spaces')
  })
})
