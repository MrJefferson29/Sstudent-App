import React, { useState, useCallback } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';

// --- Firebase Configuration & Imports (Required for persistent storage, though not used in this demo) ---
// Note: Since this is a simple stateless demo for API interaction, Firestore is initialized but not actively used.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Global variables provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The main application component
const App = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize Firebase (run once)
    React.useEffect(() => {
        if (Object.keys(firebaseConfig).length > 0) {
            try {
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                getFirestore(app); // Initialize Firestore
                
                const authenticate = async () => {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                };
                authenticate();
            } catch (e) {
                console.error("Firebase initialization failed:", e);
            }
        }
    }, []);

    // Function to handle the API call with exponential backoff
    const fetchContent = useCallback(async (userPrompt) => {
        const apiKey = ""; // API Key is provided by the Canvas environment automatically
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        
        const systemPrompt = "You are a concise, helpful, and creative assistant. Always format your responses clearly using Markdown.";
        
        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            // Using Google Search grounding for up-to-date information
            tools: [{ "google_search": {} }], 
        };

        const maxRetries = 5;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    const text = candidate.content.parts[0].text;
                    let sources = [];
                    const groundingMetadata = candidate.groundingMetadata;
                    
                    if (groundingMetadata && groundingMetadata.groundingAttributions) {
                        sources = groundingMetadata.groundingAttributions
                            .map(attribution => ({
                                uri: attribution.web?.uri,
                                title: attribution.web?.title,
                            }))
                            .filter(source => source.uri && source.title);
                    }
                    
                    return { text, sources };
                } else {
                    return { text: "No content generated.", sources: [] };
                }

            } catch (err) {
                if (attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw err; // Re-throw error after max retries
                }
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await fetchContent(prompt);
            setResponse(result);
        } catch (err) {
            console.error("API Call Error:", err);
            setError("Failed to fetch content. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderResponse = () => {
        if (!response) return null;

        return (
            <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 mt-6">
                <h3 className="flex items-center text-lg font-semibold text-indigo-700 mb-3 border-b pb-2">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                    Generated Content
                </h3>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {response.text}
                </div>

                {response.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-500 mb-2">Sources:</p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                            {response.sources.map((source, index) => (
                                <li key={index} className="text-gray-600 truncate">
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-indigo-500 hover:text-indigo-700 transition duration-150"
                                        title={source.title}
                                    >
                                        {source.title || source.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-inter">
            <style>{`
                /* Inter font loading (Tailwind default) */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                .font-inter {
                    font-family: 'Inter', sans-serif;
                }
                .prose {
                    /* Custom styles for the generated content rendering */
                    max-width: 100%;
                }
                .prose pre {
                    background-color: #f3f4f6;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                }
            `}</style>

            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-indigo-500 mr-2" />
                        Gemini Web Assistant
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Get up-to-date, grounded answers using the Gemini 2.5 Flash model.
                    </p>
                </header>

                <div className="bg-white p-6 rounded-2xl shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <textarea
                                id="prompt"
                                className="w-full p-4 pr-16 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none h-32"
                                placeholder="Ask me anything, like 'Summarize the latest trends in renewable energy.'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="submit"
                                className={`absolute bottom-4 right-4 p-3 rounded-full text-white transition duration-200 shadow-lg ${
                                    isLoading || !prompt.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                                }`}
                                disabled={isLoading || !prompt.trim()}
                                aria-label="Generate Content"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>

                    {isLoading && (
                        <div className="flex items-center justify-center mt-6 p-4 bg-indigo-50 rounded-xl text-indigo-700">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating response...
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-100 rounded-xl text-red-700 border border-red-300">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {renderResponse()}
                </div>
            </div>
        </div>
    );
};

export default App;