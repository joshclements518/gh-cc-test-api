import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createTask, listTasks, contractVersion } from '../src/tasks.js'
import { createPoll, getPoll } from '../src/polls.js'

describe('api-unit', () => {
  it('lists open tasks', () => {
    assert.ok(listTasks().length >= 1)
  })
  it('creates a task', () => {
    const t = createTask('unit')
    assert.equal(t.title, 'unit')
    assert.equal(t.status, 'open')
  })
  it('reports contract version', () => {
    assert.equal(contractVersion(), '1.0.0')
  })
})

describe('polls-unit', () => {
  it('creates a poll with question and deadline', () => {
    const poll = createPoll('What snack?', '2026-11-08T12:00:00Z')
    assert.ok(poll.id)
    assert.equal(poll.question, 'What snack?')
    assert.equal(poll.deadline, '2026-11-08T12:00:00Z')
  })

  it('returns poll by id', () => {
    const created = createPoll('Test poll', '2026-11-15T12:00:00Z')
    const retrieved = getPoll(created.id)
    assert.deepEqual(retrieved, created)
  })

  it('throws error if question is missing', () => {
    assert.throws(() => createPoll('', '2026-11-08T12:00:00Z'), /required/)
  })

  it('throws error if deadline is missing', () => {
    assert.throws(() => createPoll('What snack?', ''), /required/)
  })
})
