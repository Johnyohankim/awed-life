// Simple analytics tracking helper
export async function trackEvent(eventName, properties = {}) {
  try {
    // Add session ID if not present
    if (!properties.sessionId) {
      properties.sessionId = getSessionId()
    }

    // Add timestamp
    properties.timestamp = new Date().toISOString()

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, properties })
    })
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.error('Analytics error:', error)
  }
}

// Get or create session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('awed_session_id')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('awed_session_id', sessionId)
  }
  return sessionId
}

// Key events to track
export const EVENTS = {
  // User lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_RETURNED: 'user_returned',

  // Card actions
  CARD_VIEWED: 'card_viewed',
  CARD_KEPT: 'card_kept',
  CARD_NAWED: 'card_nawed',

  // Reactions
  REACTION_AWED: 'reaction_awed',
  REACTION_NAWED: 'reaction_nawed',

  // Submissions
  SUBMISSION_CREATED: 'submission_created',

  // Milestones
  MILESTONE_ACHIEVED: 'milestone_achieved',

  // Journal
  JOURNAL_STARTED: 'journal_started',
  JOURNAL_COMPLETED: 'journal_completed',

  // Welcome
  WELCOME_COMPLETED: 'welcome_completed',
  WELCOME_SKIPPED: 'welcome_skipped',

  // Navigation
  PAGE_VIEWED: 'page_viewed',
  COLLECTION_VIEWED: 'collection_viewed',
}
