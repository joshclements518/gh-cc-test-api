/** @typedef {{ id: string, question: string, deadline: string }} Poll */

/** @type {Map<string, Poll>} */
const polls = new Map()

let pollCounter = 0

/**
 * @param {string} question
 * @param {string} deadline - ISO8601 formatted date
 * @returns {Poll}
 */
export function createPoll(question, deadline) {
  if (!question || !deadline) {
    throw new Error('question and deadline are required')
  }

  pollCounter++
  const poll = {
    id: `poll-${pollCounter}`,
    question,
    deadline,
  }
  polls.set(poll.id, poll)
  return poll
}

/**
 * @param {string} id
 * @returns {Poll | undefined}
 */
export function getPoll(id) {
  return polls.get(id)
}

export function contractVersion() {
  return '1.0.0'
}
