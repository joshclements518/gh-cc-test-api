import { createServer } from 'node:http'
import { createTask, listTasks, contractVersion } from './tasks.js'
import { createPoll, addOption, castVote } from './polls.js'

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
      const parsed = JSON.parse(body || '{}')
      const poll = createPoll(String(parsed.question ?? ''), String(parsed.deadline ?? ''))
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ pollId: poll.id }))
    })
    return
  }
  // Match POST /polls/:id/options
  const optionsMatch = url.pathname.match(/^\/polls\/([^/]+)\/options$/)
  if (req.method === 'POST' && optionsMatch) {
    const pollId = optionsMatch[1]
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}')
      const option = addOption(pollId, String(parsed.text ?? ''))
      if (!option) {
        res.writeHead(404, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'Poll not found' }))
        return
      }
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ optionId: option.id }))
    })
    return
  }
  // Match POST /polls/:id/vote
  const voteMatch = url.pathname.match(/^\/polls\/([^/]+)\/vote$/)
  if (req.method === 'POST' && voteMatch) {
    const pollId = voteMatch[1]
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}')
      const result = castVote(pollId, String(parsed.optionId ?? ''), String(parsed.userId ?? ''))
      if (!result.success) {
        res.writeHead(result.status, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: result.error }))
        return
      }
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ voteId: result.voteId }))
    })
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(port, () => console.log(`accel-api on :${port}`))
