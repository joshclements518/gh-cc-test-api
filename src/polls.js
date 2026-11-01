/**
 * @typedef {{
 *   id: string,
 *   question: string,
 *   deadline: string,
 *   options: Array<{ optionId: string, text: string }>,
 *   votes: Record<string, string>,
 *   createdAt: string
 * }} Poll
 */

/** @type {Poll[]} */
const polls = []

let pollCounter = 0
let optionCounter = 0

/**
 * Create a new poll
 * @param {string} question
 * @param {string} deadline
 * @returns {Poll}
 */
export function createPoll(question, deadline) {
  pollCounter++
  const poll = {
    id: `poll-${pollCounter}`,
    question,
    deadline,
    options: [],
    votes: {},
    createdAt: new Date().toISOString(),
  }
  polls.push(poll)
  return poll
}

/**
 * Get a poll by ID
 * @param {string} pollId
 * @returns {Poll | undefined}
 */
export function getPoll(pollId) {
  return polls.find(p => p.id === pollId)
}

/**
 * Add an option to a poll
 * @param {string} pollId
 * @param {string} text
 * @returns {{ optionId: string, text: string } | null}
 */
export function addOption(pollId, text) {
  const poll = getPoll(pollId)
  if (!poll) {
    return null
  }

  optionCounter++
  const option = {
    optionId: `opt-${optionCounter}`,
    text,
  }

  poll.options.push(option)
  return option
}

/**
 * List all polls
 * @returns {Poll[]}
 */
export function listPolls() {
  return polls
}
