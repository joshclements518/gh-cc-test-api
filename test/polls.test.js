import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPoll, listPolls, getPollById } from '../src/polls.js'

describe('polls-unit', () => {
  it('creates a valid poll', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow
    const result = createPoll('What snack?', futureDate, ['Pizza', 'Tacos', 'Sushi'])
    assert.ok(result.poll, 'Poll should be created')
    assert.ok(result.poll.id, 'Poll should have an ID')
    assert.equal(result.poll.question, 'What snack?')
    assert.equal(result.poll.deadline, futureDate)
    assert.deepEqual(result.poll.options, ['Pizza', 'Tacos', 'Sushi'])
    assert.ok(result.poll.createdAt, 'Poll should have createdAt timestamp')
  })

  it('rejects poll with missing question', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('', futureDate, ['Option1'])
    assert.ok(result.error, 'Should return error')
    assert.match(result.error, /Question is required/)
  })

  it('rejects poll with missing deadline', () => {
    const result = createPoll('Question?', '', ['Option1'])
    assert.ok(result.error, 'Should return error')
    assert.match(result.error, /Deadline is required/)
  })

  it('rejects poll with past deadline', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday
    const result = createPoll('Question?', pastDate, ['Option1'])
    assert.ok(result.error, 'Should return error')
    assert.match(result.error, /Deadline must be in the future/)
  })

  it('rejects poll with invalid deadline format', () => {
    const result = createPoll('Question?', 'not-a-date', ['Option1'])
    assert.ok(result.error, 'Should return error')
    assert.match(result.error, /valid ISO timestamp/)
  })

  it('rejects poll with empty options array', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('Question?', futureDate, [])
    assert.ok(result.error, 'Should return error')
    assert.match(result.error, /non-empty array/)
  })

  it('rejects poll with non-string options', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('Question?', futureDate, ['Valid', '', 'Another'])
    assert.ok(result.error, 'Should return error')
    assert.match(result.error, /non-empty strings/)
  })

  it('lists all polls', () => {
    const initialCount = listPolls().length
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    createPoll('Test poll', futureDate, ['A', 'B'])
    const polls = listPolls()
    assert.equal(polls.length, initialCount + 1)
  })

  it('gets poll by id', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const result = createPoll('Find me', futureDate, ['X', 'Y'])
    const found = getPollById(result.poll.id)
    assert.ok(found, 'Poll should be found')
    assert.equal(found.question, 'Find me')
  })
})
