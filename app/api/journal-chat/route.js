import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORY_CONTEXT = {
  'moral-beauty': 'witnessing an act of human kindness, courage, or virtue',
  'collective-effervescence': 'experiencing the electricity of people coming together',
  'nature': 'a moment of natural wonder',
  'music': 'a piece of music that touches something deep',
  'visual-design': 'a striking piece of visual art or design',
  'spirituality': 'a spiritual or transcendent experience',
  'life-death': 'reflecting on the cycles of life and death',
  'epiphany': 'a sudden moment of insight or realization',
}

const WALK_CATEGORY_CONTEXT = {
  'moral-beauty': 'doing something kind or witnessing human goodness',
  'collective-effervescence': 'being part of a group experience or shared energy',
  'nature': 'spending time in nature or noticing the natural world',
  'music': 'experiencing music in a new or deeper way',
  'visual-design': 'noticing visual beauty or design in the world around you',
  'spirituality': 'a spiritual or contemplative practice',
  'life-death': 'reflecting on life, mortality, or transformation',
  'epiphany': 'seeking or having a moment of insight',
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, category, type, activityText } = await request.json()

  const isWalk = type === 'walk'

  let systemPrompt
  if (isWalk) {
    const walkContext = WALK_CATEGORY_CONTEXT[category] || 'an awe-inspiring experience'
    systemPrompt = `You are a warm, gentle guide helping someone reflect on an awe walk they just completed.
The walk was: "${activityText}"
The category was about ${walkContext}.

Your role: ask simple, open questions about what they noticed and how they felt.

Rules:
- Keep each response to 1-2 short sentences only
- Be warm but not gushing
- No bullet points or lists
- If the user has responded 2 or more times, offer a brief closing reflection instead of another question — something that honors what they experienced
- Never use generic affirmations like "That's so interesting!" or "Great reflection!"
- Don't parrot their words back to them
- Use plain, everyday language
- Start the very first message with a short open question about how the walk went`
  } else {
    const context = CATEGORY_CONTEXT[category] || 'an awe-inspiring moment'
    systemPrompt = `You are a warm, gentle guide helping someone reflect on an awe-inspiring experience — specifically, ${context}.

Your role: ask simple, open questions that help them go a little deeper into what they felt.

Rules:
- Keep each response to 1-2 short sentences only
- Be warm but not gushing
- No bullet points or lists
- If the user has responded 2 or more times, offer a brief closing reflection instead of another question — something that honors what they shared
- Never use generic affirmations like "That's so interesting!" or "Great reflection!"
- Don't parrot their words back to them
- Use plain, everyday language
- Start the very first message with a short open question about the moment`
  }

  const seedMessage = isWalk
    ? `I just completed an awe walk: "${activityText}". Help me reflect on it.`
    : `I just watched something related to ${CATEGORY_CONTEXT[category] || 'an awe-inspiring moment'}. Help me reflect on it.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: systemPrompt,
      messages: messages.length > 0 ? messages : [
        { role: 'user', content: seedMessage }
      ],
    })

    return NextResponse.json({ reply: response.content[0].text })
  } catch (error) {
    console.error('Journal chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
