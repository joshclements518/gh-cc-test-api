import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createTask, listTasks, contractVersion } from '../src/tasks.js'

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
