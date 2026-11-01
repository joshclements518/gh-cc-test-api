import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createTask, listTasks, contractVersion } from '../src/tasks.js'
import { createPoll, getPoll, addOption, listPolls } from '../src/polls.js'

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
    const poll = createPoll('What snack for Friday?', '2026-11-08T12:00:00Z')
    assert.ok(poll.id)
    assert.equal(poll.question, 'What snack for Friday?')
    assert.equal(poll.deadline, '2026-11-08T12:00:00Z')
    assert.ok(Array.isArray(poll.options))
    assert.equal(poll.options.length, 0)
  })

  it('adds option to poll and returns unique optionId', () => {
    const poll = createPoll('Lunch choice?', '2026-11-05T12:00:00Z')
    const option1 = addOption(poll.id, 'Pizza')

    assert.ok(option1)
    assert.ok(option1.optionId)
    assert.equal(option1.text, 'Pizza')

    // Verify the option was added to the poll
    const updatedPoll = getPoll(poll.id)
    assert.equal(updatedPoll.options.length, 1)
    assert.equal(updatedPoll.options[0].text, 'Pizza')
    assert.equal(updatedPoll.options[0].optionId, option1.optionId)
  })

  it('adds multiple options with unique optionIds', () => {
    const poll = createPoll('Snack poll', '2026-11-10T12:00:00Z')

    const opt1 = addOption(poll.id, 'Chips')
    const opt2 = addOption(poll.id, 'Cookies')
    const opt3 = addOption(poll.id, 'Fruit')

    assert.notEqual(opt1.optionId, opt2.optionId)
    assert.notEqual(opt2.optionId, opt3.optionId)
    assert.notEqual(opt1.optionId, opt3.optionId)

    const updatedPoll = getPoll(poll.id)
    assert.equal(updatedPoll.options.length, 3)
    assert.equal(updatedPoll.options[0].text, 'Chips')
    assert.equal(updatedPoll.options[1].text, 'Cookies')
    assert.equal(updatedPoll.options[2].text, 'Fruit')
  })

  it('returns null when adding option to non-existent poll', () => {
    const result = addOption('non-existent-poll', 'Option')
    assert.equal(result, null)
  })

  it('retrieves poll with all its options', () => {
    const poll = createPoll('Weekend activity?', '2026-11-09T12:00:00Z')
    addOption(poll.id, 'Hiking')
    addOption(poll.id, 'Movie')

    const retrieved = getPoll(poll.id)
    assert.equal(retrieved.id, poll.id)
    assert.equal(retrieved.question, 'Weekend activity?')
    assert.equal(retrieved.options.length, 2)
  })

  it('lists all polls', () => {
    const initialCount = listPolls().length
    createPoll('Test poll 1', '2026-11-05T12:00:00Z')
    createPoll('Test poll 2', '2026-11-06T12:00:00Z')

    const polls = listPolls()
    assert.ok(polls.length >= initialCount + 2)
  })
})
