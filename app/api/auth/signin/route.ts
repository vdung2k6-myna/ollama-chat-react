import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { email, password } = await req.json();

        if (email && password) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Supabase signin error:', error);
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            if (!data || !data.user || !data.session) {
                console.error('Signin response missing data:', { data });
                return NextResponse.json({ error: 'Signin failed: Invalid response from Supabase' }, { status: 400 });
            }

            return NextResponse.json({ user: data.user, session: data.session });
        }

        console.warn('Signin attempt without email and password');
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    } catch (error) {
        console.error('Error in signin:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
