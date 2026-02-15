// Journal questions for reflection prompts

export const GENERAL_QUESTIONS = [
  "How are you feeling right now?",
  "What are you grateful for today?",
  "Who made you smile today?",
  "What gave you perspective today?",
  "What's weighing on your mind?",
  "What small moment brought you joy today?",
  "Who are you thinking about right now?",
  "What made you feel connected today?",
  "What surprised you today?",
  "What do you hope for tomorrow?",
  "What made you feel alive today?",
  "What are you proud of today?",
  "What did you notice today that you usually overlook?",
  "What made you feel present today?",
  "Who do you want to reach out to?",
  "What touched your heart today?",
  "What made you pause today?",
  "What are you learning about yourself?",
  "What made you feel less alone today?",
  "What do you want to remember about today?"
]

export const CATEGORY_QUESTIONS = {
  'moral-beauty': [
    "Who inspires you to be a better person?",
    "What act of kindness have you witnessed recently?",
    "When have you felt called to do the right thing?"
  ],
  'collective-effervescence': [
    "When have you felt part of something bigger than yourself?",
    "What community makes you feel like you belong?",
    "When have you felt the energy of a group move you?"
  ],
  'nature': [
    "What in nature reminds you how vast the world is?",
    "When have you felt small in a beautiful way?",
    "What natural moment took your breath away?"
  ],
  'music': [
    "What song moves you beyond words?",
    "When has music helped you feel what you couldn't say?",
    "What rhythm or melody touches something deep in you?"
  ],
  'visual-design': [
    "What beauty have you noticed in everyday things?",
    "When has visual art changed how you see the world?",
    "What pattern or form captivates you?"
  ],
  'spirituality': [
    "What connects you to something beyond yourself?",
    "When have you felt a sense of the sacred?",
    "What gives your life deeper meaning?"
  ],
  'life-death': [
    "What reminds you that life is precious?",
    "Who do you want to appreciate while you still can?",
    "What matters most to you?"
  ],
  'epiphany': [
    "What recently clicked for you in a new way?",
    "When did you suddenly understand something differently?",
    "What insight changed your perspective?"
  ]
}

// Get a question for journaling
// 70% chance of general question, 30% chance of category-specific
export function getJournalQuestion(category) {
  const useGeneral = Math.random() < 0.7
  
  if (useGeneral || !CATEGORY_QUESTIONS[category]) {
    // Random general question
    return GENERAL_QUESTIONS[Math.floor(Math.random() * GENERAL_QUESTIONS.length)]
  } else {
    // Random category question
    const categoryQuestions = CATEGORY_QUESTIONS[category]
    return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)]
  }
}

// Deterministic question based on date and category (same question per day per category)
export function getDailyQuestion(category) {
  const today = new Date().toISOString().split('T')[0]
  const seed = today + category
  
  // Simple hash function for deterministic randomness
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }
  
  const useGeneral = Math.abs(hash) % 10 < 7 // 70% general
  
  if (useGeneral) {
    const index = Math.abs(hash) % GENERAL_QUESTIONS.length
    return GENERAL_QUESTIONS[index]
  } else {
    const categoryQuestions = CATEGORY_QUESTIONS[category] || GENERAL_QUESTIONS
    const index = Math.abs(hash) % categoryQuestions.length
    return categoryQuestions[index]
  }
}