/** @typedef {{ pollId: string, question: string, deadline: string }} Poll */

/** @type {Poll[]} */
const polls = []

/**
 * Validates an ISO8601 date string
 * @param {string} dateString
 * @returns {boolean}
 */
function isValidISO8601(dateString) {
  if (typeof dateString !== 'string' || !dateString) {
    return false
  }
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.toISOString() === dateString
}

/**
 * Creates a new poll
 * @param {string} question
 * @param {string} deadline - ISO8601 date string
 * @returns {{ poll?: Poll, error?: string }}
 */
export function createPoll(question, deadline) {
  // Validate question
  if (typeof question !== 'string' || question.trim() === '') {
    return { error: 'Question cannot be empty' }
  }

  // Validate deadline
  if (!isValidISO8601(deadline)) {
    return { error: 'Invalid deadline format (must be ISO8601)' }
  }

  const poll = {
    pollId: `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    question: question.trim(),
    deadline,
  }

  polls.push(poll)
  return { poll }
}

/**
 * Lists all polls
 * @returns {Poll[]}
 */
export function listPolls() {
  return polls
}
