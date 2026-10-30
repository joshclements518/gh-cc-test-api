/** @typedef {{ id: string, question: string, deadline: string, options: string[], createdAt: string }} Poll */

/** @type {Poll[]} */
const polls = []

let pollIdCounter = 1

/**
 * @param {string} question
 * @param {string} deadline - ISO timestamp
 * @param {string[]} options
 * @returns {{ poll?: Poll, error?: string }}
 */
export function createPoll(question, deadline, options) {
  // Validate required fields
  if (!question || typeof question !== 'string' || question.trim() === '') {
    return { error: 'Question is required and must be a non-empty string' }
  }

  if (!deadline || typeof deadline !== 'string') {
    return { error: 'Deadline is required and must be an ISO timestamp string' }
  }

  if (!Array.isArray(options) || options.length === 0) {
    return { error: 'Options must be a non-empty array of strings' }
  }

  // Validate deadline is valid ISO date and not in the past
  const deadlineDate = new Date(deadline)
  if (isNaN(deadlineDate.getTime())) {
    return { error: 'Deadline must be a valid ISO timestamp' }
  }

  if (deadlineDate <= new Date()) {
    return { error: 'Deadline must be in the future' }
  }

  // Validate options are all strings
  if (!options.every((opt) => typeof opt === 'string' && opt.trim() !== '')) {
    return { error: 'All options must be non-empty strings' }
  }

  const poll = {
    id: `poll${pollIdCounter++}`,
    question: question.trim(),
    deadline,
    options,
    createdAt: new Date().toISOString(),
  }

  polls.push(poll)
  return { poll }
}

export function listPolls() {
  return polls
}

export function getPollById(id) {
  return polls.find((p) => p.id === id)
}
