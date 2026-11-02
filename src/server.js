import { createServer } from 'node:http'
import { createTask, listTasks, contractVersion } from './tasks.js'
import { createPoll, getPoll, addOption, listPolls, castVote } from './polls.js'

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
  if (req.method === 'GET' && url.pathname === '/polls') {
    res.writeHead(200, { 'content-type': 'application/json', ...cors })
    res.end(JSON.stringify(listPolls()))
    return
  }
  if (req.method === 'POST' && url.pathname === '/polls') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}')
      const poll = createPoll(
        String(parsed.question ?? 'Untitled poll'),
        String(parsed.deadline ?? new Date().toISOString())
      )
      res.writeHead(201, { 'content-type': 'application/json', ...cors })
      res.end(JSON.stringify(poll))
    })
    return
  }
  if (req.method === 'GET' && url.pathname.startsWith('/polls/')) {
    const pollId = url.pathname.split('/')[2]
    const poll = getPoll(pollId)
    if (!poll) {
      res.writeHead(404, { 'content-type': 'application/json', ...cors })
      res.end(JSON.stringify({ error: 'Poll not found' }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json', ...cors })
    res.end(JSON.stringify(poll))
    return
  }
  if (req.method === 'POST' && url.pathname.match(/^\/polls\/[^/]+\/options$/)) {
    const pollId = url.pathname.split('/')[2]
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}')
      const option = addOption(pollId, String(parsed.text ?? ''))
      if (!option) {
        res.writeHead(404, { 'content-type': 'application/json', ...cors })
        res.end(JSON.stringify({ error: 'Poll not found' }))
        return
      }
      res.writeHead(201, { 'content-type': 'application/json', ...cors })
      res.end(JSON.stringify(option))
    })
    return
  }
  if (req.method === 'POST' && url.pathname.match(/^\/polls\/[^/]+\/vote$/)) {
    const pollId = url.pathname.split('/')[2]
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}')
      const result = castVote(
        pollId,
        String(parsed.userId ?? ''),
        String(parsed.optionId ?? '')
      )
      if (!result.success) {
        res.writeHead(400, { 'content-type': 'application/json', ...cors })
        res.end(JSON.stringify({ error: result.error }))
        return
      }
      res.writeHead(200, { 'content-type': 'application/json', ...cors })
      res.end(JSON.stringify(result))
    })
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(port, () => console.log(`accel-api on :${port}`))
