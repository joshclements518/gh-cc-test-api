import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTask, listTasks, contractVersion } from './tasks.js'
import { createPoll, addOption, castVote, getPollResults } from './polls.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

const port = Number(process.env.PORT || 4000)

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }

  // Serve static files from public/ and app/lib/
  if (req.method === 'GET') {
    // Serve voting page
    if (url.pathname === '/' || url.pathname === '/vote' || url.pathname === '/vote.html') {
      try {
        const html = await readFile(join(projectRoot, 'public', 'vote.html'), 'utf8')
        res.writeHead(200, { 'content-type': 'text/html', ...cors })
        res.end(html)
        return
      } catch (err) {
        // Continue to other routes if file not found
      }
    }

    // Serve voting.js
    if (url.pathname === '/app/lib/voting.js') {
      try {
        const js = await readFile(join(projectRoot, 'app', 'lib', 'voting.js'), 'utf8')
        res.writeHead(200, { 'content-type': 'application/javascript', ...cors })
        res.end(js)
        return
      } catch (err) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
    }
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
  // Match GET /polls/:id
  const pollMatch = url.pathname.match(/^\/polls\/([^/]+)$/)
  if (req.method === 'GET' && pollMatch) {
    const pollId = pollMatch[1]
    const results = getPollResults(pollId)
    if (!results) {
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'Poll not found' }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(results))
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(port, () => console.log(`accel-api on :${port}`))
