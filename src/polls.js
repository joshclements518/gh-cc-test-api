/** @typedef {{ id: string, question: string, deadline: string, createdAt: string, status: 'open' | 'closed' }} Poll */
/** @typedef {{ id: string, pollId: string, text: string }} Option */
/** @typedef {{ id: string, pollId: string, optionId: string, userId: string }} Vote */

/** @type {Poll[]} */
const polls = []

/** @type {Option[]} */
const options = []

/** @type {Vote[]} */
const votes = []

let nextId = 1
let nextOptionId = 1
let nextVoteId = 1

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

/**
 * @param {string} optionId
 * @returns {Option | undefined}
 */
export function getOption(optionId) {
  return options.find((opt) => opt.id === optionId)
}

/**
 * @param {string} pollId
 * @param {string} optionId
 * @param {string} userId
 * @returns {{ success: true, voteId: string } | { success: false, error: string, status: number }}
 */
export function castVote(pollId, optionId, userId) {
  // Check if poll exists
  const poll = getPoll(pollId)
  if (!poll) {
    return { success: false, error: 'Poll not found', status: 404 }
  }

  // Check if option exists and belongs to this poll
  const option = getOption(optionId)
  if (!option) {
    return { success: false, error: 'Option not found', status: 404 }
  }
  if (option.pollId !== pollId) {
    return { success: false, error: 'Option does not belong to this poll', status: 404 }
  }

  // Check if user has already voted on this poll
  const existingVote = votes.find((v) => v.pollId === pollId && v.userId === userId)
  if (existingVote) {
    return { success: false, error: 'User already voted on this poll', status: 409 }
  }

  // Create the vote
  const vote = {
    id: `vote-${nextVoteId++}`,
    pollId,
    optionId,
    userId,
  }
  votes.push(vote)
  return { success: true, voteId: vote.id }
}
