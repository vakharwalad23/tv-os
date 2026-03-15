import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { apiKey, messages, system } = body

    if (!apiKey || !messages) {
        return NextResponse.json({ error: 'Missing apiKey or messages' }, { status: 400 })
    }

    try {
        const client = new Anthropic({ apiKey })

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system,
            messages,
        })

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('')

        return NextResponse.json({ text })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
