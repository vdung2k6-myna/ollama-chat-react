import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { message, model, messages, systemMessage } = await req.json();
        const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'https://myna.ddns.net:8080';

        // Build messages array for chat API
        const chatMessages: Array<{ role: string; content: string }> = [];

        // Add system message if provided
        if (systemMessage && systemMessage.trim() !== '') {
            chatMessages.push({ role: 'system', content: systemMessage });
        }

        // Add conversation messages
        if (messages && messages.length > 0) {
            chatMessages.push(...messages);
        } else {
            chatMessages.push({ role: 'user', content: message });
        }

        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: chatMessages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from Ollama API:', errorData);
            return NextResponse.json({ error: errorData.error || 'Error from Ollama API' }, { status: response.status });
        }

        // Return a ReadableStream for streaming responses
        const stream = response.body;
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Error in /chat endpoint:', error);
        return NextResponse.json({ error: 'Error connecting to Ollama API' }, { status: 500 });
    }
}
