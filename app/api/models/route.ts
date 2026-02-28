import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'https://myna.ddns.net:8080';
        
        const response = await fetch(`${ollamaUrl}/api/tags`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json({ error: 'Error fetching models from Ollama' }, { status: 500 });
    }
}
