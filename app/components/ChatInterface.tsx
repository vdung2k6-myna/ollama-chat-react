'use client';

import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    user: any;
    onLogout: () => void;
}

export default function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [systemMessage, setSystemMessage] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const userPaneRef = useRef<HTMLDivElement>(null);
    const botPaneRef = useRef<HTMLDivElement>(null);

    // Fetch models on mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await fetch('/api/models');
                const data = await response.json();
                if (data.models) {
                    const modelNames = data.models.map((m: any) => m.name);
                    setModels(modelNames);
                    setSelectedModel(modelNames[0] || '');
                }
            } catch (error) {
                console.error('Error fetching models:', error);
            }
        };

        fetchModels();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (userPaneRef.current) {
            userPaneRef.current.scrollTop = userPaneRef.current.scrollHeight;
        }
        if (botPaneRef.current) {
            botPaneRef.current.scrollTop = botPaneRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedModel) return;

        const newMessage: Message = { role: 'user', content: input };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Display user message
            if (userPaneRef.current) {
                const userDiv = document.createElement('div');
                userDiv.className = 'mb-4 p-3 bg-blue-100 text-gray-900 rounded';
                userDiv.textContent = newMessage.content;
                userPaneRef.current.appendChild(userDiv);
            }

            // Get bot response
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    model: selectedModel,
                    messages: updatedMessages,
                    systemMessage: systemMessage,
                }),
            });

            if (!response.body) {
                throw new Error('No response body');
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botMessage = '';

            if (botPaneRef.current) {
                const botDiv = document.createElement('div');
                botDiv.className = 'mb-4 p-3 bg-gray-100 text-gray-900 rounded';
                botDiv.id = 'current-bot-message';
                botPaneRef.current.appendChild(botDiv);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (!line.trim()) continue;

                        try {
                            const data = JSON.parse(line);
                            if (data.message?.content) {
                                botMessage += data.message.content;
                                Promise.resolve(marked(botMessage)).then((html) => {
                                    botDiv.innerHTML = html;
                                });
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }

            // Update messages state
            setMessages([...updatedMessages, { role: 'assistant', content: botMessage }]);
        } catch (error) {
            console.error('Chat error:', error);
            if (botPaneRef.current) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'mb-4 p-3 bg-red-100 text-red-700 rounded';
                errorDiv.textContent = 'Error: ' + (error instanceof Error ? error.message : 'Unknown error');
                botPaneRef.current.appendChild(errorDiv);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        setMessages([]);
        setInput('');
        setSystemMessage('');
        onLogout();
    };

    const handleClear = () => {
        setMessages([]);
        setInput('');
        if (userPaneRef.current) userPaneRef.current.innerHTML = '';
        if (botPaneRef.current) botPaneRef.current.innerHTML = '';
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Settings Toggle Button */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="fixed left-0 top-1/2 -translate-y-1/2 px-2 py-4 bg-gray-200 hover:bg-gray-300 z-50 rounded-r transition-all duration-300"
                style={{ marginLeft: showSettings ? '16rem' : '0' }}
                title={showSettings ? 'Collapse settings' : 'Expand settings'}
            >
                {showSettings ? '◀' : '▶'}
            </button>

            {/* Settings Pane */}
            <div className={`transition-all duration-300 bg-gray-50 border-r flex-shrink-0 overflow-hidden ${showSettings ? 'w-64' : 'w-0'}`}>
                <div className={`p-4 min-w-64 ${showSettings ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="font-bold mb-4">Settings</h3>
                    
                    <div className="mb-4">
                        <label className="block font-semibold mb-2 text-gray-900">Model</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                        >
                            {models.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold mb-2 text-gray-900">System Message</label>
                        <textarea
                            value={systemMessage}
                            onChange={(e) => setSystemMessage(e.target.value)}
                            placeholder="Enter system message to guide the AI behavior..."
                            className="w-full p-2 border border-gray-300 rounded h-32 text-gray-900 placeholder-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-gray-100 border-b p-4 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-900">Chat with {user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex overflow-hidden border-b">
                    {/* User Messages */}
                    <div
                        ref={userPaneRef}
                        className="flex-1 overflow-y-auto p-4 bg-white"
                    />

                    {/* Divider */}
                    <div className="w-1 bg-gray-300" />

                    {/* Bot Messages */}
                    <div
                        ref={botPaneRef}
                        className="flex-1 overflow-y-auto p-4 bg-gray-50"
                    />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t p-4 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 p-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}
