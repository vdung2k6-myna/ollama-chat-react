import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { email, password } = await req.json();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data || !data.user) {
            return NextResponse.json({ error: 'Signup failed: Invalid response from Supabase' }, { status: 400 });
        }

        // If there's no session, email confirmation is required
        if (!data.session) {
            return NextResponse.json({
                user: data.user,
                session: null,
                message: 'Signup successful. Please check your email to confirm your account.'
            }, { status: 200 });
        }

        return NextResponse.json({ user: data.user, session: data.session });
    } catch (error) {
        console.error('Error in signup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
