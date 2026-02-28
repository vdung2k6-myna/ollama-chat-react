import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signOut();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: 'Successfully signed out' });
    } catch (error) {
        console.error('Error in signout:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
