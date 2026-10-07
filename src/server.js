import { createServer } from 'node:http'
import { createTask, listTasks, contractVersion } from './tasks.js'

const port = Number(process.env.PORT || 4000)

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (req.method === 'GET' && url.pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, contract: contractVersion() }))
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
  res.writeHead(404)
  res.end('not found')
})

server.listen(port, () => console.log(`accel-api on :${port}`))
