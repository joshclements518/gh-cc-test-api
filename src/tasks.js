/** @typedef {{ id: string, title: string, status: 'open' | 'archived', priority?: 'low' | 'medium' | 'high' }} Task */

/** @type {Task[]} */
const tasks = [
  { id: 't1', title: 'Welcome', status: 'open', priority: 'medium' },
]

export function listTasks() {
  return tasks.filter((t) => t.status === 'open')
}

/** @param {string} title */
export function createTask(title) {
  const task = {
    id: `t${tasks.length + 1}`,
    title,
    status: /** @type {const} */ ('open'),
    priority: /** @type {const} */ ('medium'),
  }
  tasks.push(task)
  return task
}

export function contractVersion() {
  return '1.1.0'
}
