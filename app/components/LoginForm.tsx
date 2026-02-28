'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

interface LoginFormProps {
    onLoginSuccess: (user: any, token: string) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [supabaseClient, setSupabaseClient] = useState<any>(null);

    useEffect(() => {
        // Initialize Supabase
        const initSupabase = async () => {
            try {
                // fetch config just to keep pattern; client uses public env variables
                await fetch('/api/auth/github');

                const client = getSupabase();
                setSupabaseClient(client);

                // Listen for auth changes from OAuth callback
                const { data } = client.auth.onAuthStateChange((event: string, session: any) => {
                    if (event === 'SIGNED_IN' && session) {
                        onLoginSuccess(session.user, session.access_token);
                    }
                });

                return () => {
                    data?.subscription?.unsubscribe();
                };
            } catch (err) {
                console.error('Error initializing Supabase:', err);
                setError('Failed to initialize authentication');
            }
        };

        initSupabase();
    }, [onLoginSuccess]);

    const handleGitHubLogin = async () => {
        if (!supabaseClient) return;

        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            });

            if (error) {
                setError(error.message);
            }
        } catch (err: any) {
            setError(err.message || 'GitHub login failed');
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || `Login failed (${response.status})`);
                return;
            }

            onLoginSuccess(data.user, data.session.access_token);
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Signup failed');
                return;
            }

            if (!data.session) {
                setError(data.message || 'Signup successful! Please check your email to confirm.');
                setEmail('');
                setPassword('');
                return;
            }

            onLoginSuccess(data.user, data.session.access_token);
        } catch (err: any) {
            setError(err.message || 'An error occurred during signup');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGitHubLogin}
                    className="w-full mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                >
                    Login with GitHub
                </button>

                <div className="mb-4 text-center text-gray-600">--- or ---</div>

                <form onSubmit={handleEmailLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mb-3 px-4 py-2 border border-gray-300 rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={handleSignup}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
}
