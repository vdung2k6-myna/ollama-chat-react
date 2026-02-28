import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.getUser(token);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ user: data.user });
    } catch (error) {
        console.error('Error getting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
