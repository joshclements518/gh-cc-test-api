/** @typedef {{ id: string, question: string, deadline: string, createdAt: string, status: 'open' | 'closed' }} Poll */
/** @typedef {{ id: string, pollId: string, text: string }} Option */

/** @type {Poll[]} */
const polls = []

/** @type {Option[]} */
const options = []

let nextId = 1
let nextOptionId = 1

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

/**
 * @param {string} pollId
 * @param {string} text
 * @returns {Option | null}
 */
export function addOption(pollId, text) {
  const poll = getPoll(pollId)
  if (!poll) {
    return null
  }
  const option = {
    id: `option-${nextOptionId++}`,
    pollId,
    text,
  }
  options.push(option)
  return option
}

/**
 * @param {string} pollId
 * @returns {Option[]}
 */
export function getOptions(pollId) {
  return options.filter((opt) => opt.pollId === pollId)
}
