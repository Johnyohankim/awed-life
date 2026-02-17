import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PREVIEW_VIDEO_CONTEXT = `A woman store clerk and mother instinctively catches a baby from a young woman who suddenly begins having a stroke. In a split second, before the mother even falls, the clerk reaches out and grabs the baby. Another bystander rushes over and calls 911.`

export async function POST(request) {
  const { messages } = await request.json()

  const systemPrompt = `You are a warm, gentle guide helping someone reflect on a moment of moral beauty they just watched — a woman store clerk and mother who instinctively caught a baby from a young woman beginning to have a stroke, before anyone else had even processed what was happening. Another bystander stepped in to call 911.

Your role: ask simple, open questions that help them go a little deeper into what they felt watching this.

Rules:
- Keep each response to 1-2 short sentences only
- Be warm but not gushing
- No bullet points or lists
- If the user has responded 2 or more times, offer a brief closing reflection instead of another question — something that honors what they shared
- Never use generic affirmations like "That's so interesting!" or "Great reflection!"
- Don't parrot their words back to them
- Use plain, everyday language
- Start the very first message with a short, specific open question about what they felt watching that moment — the catch, the instinct, the strangers stepping up`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: systemPrompt,
      messages: messages.length > 0 ? messages : [
        { role: 'user', content: `I just watched a video of a store clerk catching a baby from a woman having a stroke. Help me reflect on it.` }
      ],
    })

    return NextResponse.json({ reply: response.content[0].text })
  } catch (error) {
    console.error('Preview chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
