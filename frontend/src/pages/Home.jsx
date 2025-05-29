import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import config from "../config/config";

export default function Home() {
    const navigate = useNavigate();

    const handleStartNewChat = () => {
        navigate('/chat/new');
    };

    return (
        <div className="flex flex-col h-screen">
            <NavBar title={config.app.name} />
            
            <div className="flex-grow flex justify-center items-center px-4">
                <div className="text-center max-w-md">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                            Welcome to Temporal AI Agent
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                            Start a conversation with our intelligent AI agent powered by Temporal workflows.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleStartNewChat}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg 
                            text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Start New Chat
                    </button>
                    
                    <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                        <p>Or resume an existing conversation by visiting its URL</p>
                        <p className="mt-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            /chat/[conversation-id]
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 