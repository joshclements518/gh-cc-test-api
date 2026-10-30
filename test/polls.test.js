import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createPoll, getPoll, listPolls } from '../src/polls.js'

describe('polls-unit', () => {
  it('creates a poll with question and deadline', () => {
    const poll = createPoll('What snack for Friday?', '2026-11-01T12:00:00Z')
    assert.ok(poll.id)
    assert.equal(poll.question, 'What snack for Friday?')
    assert.equal(poll.deadline, '2026-11-01T12:00:00Z')
    assert.equal(poll.status, 'open')
    assert.ok(poll.createdAt)
  })

  it('generates unique poll ids', () => {
    const poll1 = createPoll('Poll 1?', '2026-11-01T12:00:00Z')
    const poll2 = createPoll('Poll 2?', '2026-11-02T12:00:00Z')
    assert.notEqual(poll1.id, poll2.id)
  })

  it('includes creation timestamp', () => {
    const beforeCreate = new Date().toISOString()
    const poll = createPoll('Timestamp test?', '2026-11-01T12:00:00Z')
    const afterCreate = new Date().toISOString()

    assert.ok(poll.createdAt >= beforeCreate)
    assert.ok(poll.createdAt <= afterCreate)
  })

  it('retrieves a poll by id', () => {
    const poll = createPoll('Find me?', '2026-11-01T12:00:00Z')
    const found = getPoll(poll.id)
    assert.deepEqual(found, poll)
  })

  it('lists all polls', () => {
    const initialCount = listPolls().length
    createPoll('List test 1?', '2026-11-01T12:00:00Z')
    createPoll('List test 2?', '2026-11-02T12:00:00Z')
    assert.equal(listPolls().length, initialCount + 2)
  })
})
