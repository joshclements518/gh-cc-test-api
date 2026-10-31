/**
 * Voting UI logic for snack poll
 * Handles vote button interactions and one-vote enforcement
 */

/**
 * Vote state manager to track if user has already voted
 */
class VotingManager {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl
    this.currentUserId = this.getUserId()
    this.hasVoted = false
    this.selectedOptionId = null
  }

  /**
   * Get or generate user ID (in production would come from auth)
   */
  getUserId() {
    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('userId', userId)
    }
    return userId
  }

  /**
   * Load poll data and render voting UI
   * @param {string} pollId - The poll ID to load
   * @param {HTMLElement} container - Container element for the UI
   */
  async loadPoll(pollId, container) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/polls/${pollId}`)
      if (!response.ok) {
        throw new Error('Poll not found')
      }
      const pollData = await response.json()
      this.renderPollUI(pollData, container)
    } catch (error) {
      container.innerHTML = `<div class="error">Error loading poll: ${error.message}</div>`
    }
  }

  /**
   * Render the poll voting interface
   * @param {Object} pollData - Poll data from API
   * @param {HTMLElement} container - Container element
   */
  renderPollUI(pollData, container) {
    const { question, options, deadline } = pollData

    // Check if user has already voted by checking vote state
    const votedOptionKey = `voted_${pollData.pollId}`
    const previousVote = localStorage.getItem(votedOptionKey)
    this.hasVoted = !!previousVote
    this.selectedOptionId = previousVote

    let html = `
      <div class="poll-container">
        <h2>${question}</h2>
        <p class="deadline">Deadline: ${new Date(deadline).toLocaleString()}</p>
        <div class="options-list">
    `

    if (options.length === 0) {
      html += '<p>No options available yet.</p>'
    } else if (this.hasVoted) {
      // Show "Already voted" state
      html += '<p class="voted-message">✓ You have already voted on this poll</p>'
      options.forEach((option) => {
        const isSelected = option.id === this.selectedOptionId
        html += `
          <div class="option ${isSelected ? 'selected' : ''}" data-option-id="${option.id}">
            <span class="option-text">${option.text}</span>
            ${isSelected ? '<span class="your-vote">← Your vote</span>' : ''}
          </div>
        `
      })
    } else {
      // Show vote buttons
      options.forEach((option) => {
        html += `
          <div class="option" data-option-id="${option.id}">
            <span class="option-text">${option.text}</span>
            <button class="vote-button" data-option-id="${option.id}">Vote</button>
          </div>
        `
      })
    }

    html += `
        </div>
        <div id="message" class="message"></div>
      </div>
    `

    container.innerHTML = html

    // Attach event listeners to vote buttons
    if (!this.hasVoted) {
      const voteButtons = container.querySelectorAll('.vote-button')
      voteButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
          const optionId = e.target.getAttribute('data-option-id')
          this.castVote(pollData.pollId, optionId, container)
        })
      })
    }
  }

  /**
   * Cast a vote for the selected option
   * @param {string} pollId - Poll ID
   * @param {string} optionId - Option ID to vote for
   * @param {HTMLElement} container - Container element
   */
  async castVote(pollId, optionId, container) {
    const messageEl = container.querySelector('#message')

    // UI-level double-vote prevention
    if (this.hasVoted) {
      messageEl.className = 'message error'
      messageEl.textContent = '✗ You have already voted on this poll'
      return
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionId,
          userId: this.currentUserId,
        }),
      })

      if (response.status === 409) {
        // User already voted (caught by API)
        this.hasVoted = true
        messageEl.className = 'message error'
        messageEl.textContent = '✗ You have already voted on this poll'
        localStorage.setItem(`voted_${pollId}`, optionId)

        // Reload the poll to show voted state
        await this.loadPoll(pollId, container)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cast vote')
      }

      const data = await response.json()

      // Success! Mark as voted and show confirmation
      this.hasVoted = true
      this.selectedOptionId = optionId
      localStorage.setItem(`voted_${pollId}`, optionId)

      // Show success message
      messageEl.className = 'message success'
      messageEl.textContent = `✓ Vote cast successfully! (Vote ID: ${data.voteId})`

      // Reload the poll UI to show "already voted" state
      setTimeout(() => {
        this.loadPoll(pollId, container)
      }, 1500)
    } catch (error) {
      messageEl.className = 'message error'
      messageEl.textContent = `✗ Error: ${error.message}`
    }
  }
}

// Export for use in both browser and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VotingManager }
}
