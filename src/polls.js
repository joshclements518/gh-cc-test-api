/** @typedef {{ pollId: string, question: string, deadline: string, createdAt: string }} Poll */

/** @type {Poll[]} */
const polls = []

let nextPollId = 1

/**
 * Creates a new poll
 * @param {string} question - The poll question
 * @param {string} deadline - ISO 8601 deadline timestamp
 * @returns {{ poll?: Poll, error?: string }}
 */
export function createPoll(question, deadline) {
  // Validate required fields
  if (!question || typeof question !== 'string' || question.trim() === '') {
    return { error: 'Question is required and must be a non-empty string' }
  }

  if (!deadline || typeof deadline !== 'string') {
    return { error: 'Deadline is required and must be a valid ISO 8601 timestamp' }
  }

  // Validate deadline format and that it's in the future
  let deadlineDate
  try {
    deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return { error: 'Deadline must be a valid ISO 8601 timestamp' }
    }
  } catch (e) {
    return { error: 'Deadline must be a valid ISO 8601 timestamp' }
  }

  const now = new Date()
  if (deadlineDate <= now) {
    return { error: 'Deadline must be in the future' }
  }

  const poll = {
    pollId: `poll-${nextPollId++}`,
    question: question.trim(),
    deadline,
    createdAt: now.toISOString(),
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
