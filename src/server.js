import { createServer } from 'node:http'
import { createTask, listTasks, contractVersion } from './tasks.js'
import { createPoll } from './polls.js'

const port = Number(process.env.PORT || 4000)

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }
  if (req.method === 'GET' && url.pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json', ...cors })
    res.end(
      JSON.stringify({
        ok: true,
        service: 'accel-api',
        repo: 'joshclements518/gh-cc-test-api',
        contract: contractVersion(),
        sha: (process.env.AICP_GIT_SHA || 'unknown').slice(0, 12),
      }),
    )
    return
  }
  if (req.method === 'GET' && url.pathname === '/tasks') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(listTasks()))
    return
  }
  if (req.method === 'POST' && url.pathname === '/tasks') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}')
      const task = createTask(String(parsed.title ?? 'untitled'))
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify(task))
    })
    return
  }
  if (req.method === 'POST' && url.pathname === '/polls') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}')
        const result = createPoll(parsed.question, parsed.deadline, parsed.options)
        if (result.error) {
          res.writeHead(400, { 'content-type': 'application/json', ...cors })
          res.end(JSON.stringify({ error: result.error }))
        } else {
          res.writeHead(201, { 'content-type': 'application/json', ...cors })
          res.end(JSON.stringify(result.poll))
        }
      } catch (err) {
        res.writeHead(400, { 'content-type': 'application/json', ...cors })
        res.end(JSON.stringify({ error: 'Invalid JSON body' }))
      }
    })
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(port, () => console.log(`accel-api on :${port}`))
