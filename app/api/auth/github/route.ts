import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        return NextResponse.json({
            supabaseUrl: supabaseUrl,
            supabaseAnonKey: supabaseAnonKey,
            redirectTo: `${req.nextUrl.origin}/`
        });
    } catch (error) {
        console.error('Error in GitHub auth config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
