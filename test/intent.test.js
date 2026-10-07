import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { contractVersion } from '../src/tasks.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('api-intent', () => {
  it('OpenAPI version matches runtime contract', () => {
    const yaml = readFileSync(join(root, 'openapi/openapi.yaml'), 'utf8')
    const m = yaml.match(/version:\s*([0-9.]+)/)
    assert.ok(m, 'openapi version present')
    assert.equal(m[1], contractVersion())
  })

  it('Task schema has required baseline fields', () => {
    const yaml = readFileSync(join(root, 'openapi/openapi.yaml'), 'utf8')
    assert.match(yaml, /Task:/)
    assert.match(yaml, /title:/)
    assert.match(yaml, /status:/)
  })
})
