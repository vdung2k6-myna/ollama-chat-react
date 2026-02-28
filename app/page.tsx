'use client';

import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import ChatInterface from './components/ChatInterface';

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in by checking session storage
        const checkAuth = async () => {
            try {
                const sessionUser = localStorage.getItem('user');
                const sessionToken = localStorage.getItem('token');

                if (sessionUser && sessionToken) {
                    setUser(JSON.parse(sessionUser));
                    setToken(sessionToken);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLoginSuccess = (loginUser: any, loginToken: string) => {
        setUser(loginUser);
        setToken(loginToken);
        localStorage.setItem('user', JSON.stringify(loginUser));
        localStorage.setItem('token', loginToken);
    };

    const handleLogout = () => {
        setUser(null);
        setToken('');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl text-gray-900">Loading...</div>
            </div>
        );
    }

    return (
        <main className="w-full h-screen bg-white">
            {!user ? (
                <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : (
                <ChatInterface user={user} onLogout={handleLogout} />
            )}
        </main>
    );
}
