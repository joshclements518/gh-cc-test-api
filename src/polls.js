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
 * Cast a vote for a poll option
 * @param {string} pollId
 * @param {string} userId
 * @param {string} optionId
 * @returns {{ success: boolean, error?: string }}
 */
export function castVote(pollId, userId, optionId) {
  const poll = getPoll(pollId)
  if (!poll) {
    return { success: false, error: 'Poll not found' }
  }

  // Verify the option exists in this poll
  const optionExists = poll.options.some(opt => opt.optionId === optionId)
  if (!optionExists) {
    return { success: false, error: 'Option not found in this poll' }
  }

  // Record the vote (overwrites if user already voted)
  poll.votes[userId] = optionId

  return { success: true }
}

/**
 * List all polls
 * @returns {Poll[]}
 */
export function listPolls() {
  return polls
}
