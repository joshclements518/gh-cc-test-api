/** @typedef {{ id: string, question: string, deadline: string, createdAt: string, status: 'open' | 'closed' }} Poll */

/** @type {Poll[]} */
const polls = []

let nextId = 1

/**
 * @param {string} question
 * @param {string} deadline
 * @returns {Poll}
 */
export function createPoll(question, deadline) {
  const now = new Date().toISOString()
  const poll = {
    id: `poll-${nextId++}`,
    question,
    deadline,
    createdAt: now,
    status: /** @type {const} */ ('open'),
  }
  polls.push(poll)
  return poll
}

/**
 * @param {string} id
 * @returns {Poll | undefined}
 */
export function getPoll(id) {
  return polls.find((p) => p.id === id)
}

/**
 * @returns {Poll[]}
 */
export function listPolls() {
  return polls
}
