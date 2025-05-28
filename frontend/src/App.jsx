import React, { useEffect, useState, useRef, useCallback } from "react";
import NavBar from "./components/NavBar";
import ChatWindow from "./components/ChatWindow";
import { apiService } from "./services/api";

const POLL_INTERVAL = 2000; // 2 seconds (reduced from 600ms to be less aggressive)
const INITIAL_ERROR_STATE = { visible: false, message: '' };
const DEBOUNCE_DELAY = 300; // 300ms debounce for user input

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function App() {
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const pollingRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const consecutiveErrorsRef = useRef(0);
    
    const [conversation, setConversation] = useState([]);
    const [lastMessage, setLastMessage] = useState(null);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(INITIAL_ERROR_STATE);
    const [done, setDone] = useState(true);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [conversationStatus, setConversationStatus] = useState('active');

    const debouncedUserInput = useDebounce(userInput, DEBOUNCE_DELAY);

    const errorTimerRef = useRef(null);

    const handleError = useCallback((error, context) => {
        console.error(`${context}:`, error);
        
        // Increment consecutive errors
        consecutiveErrorsRef.current += 1;
        
        const isConversationFetchError = error.status === 404;
        const errorMessage = isConversationFetchError 
            ? "Conversation not found. Starting fresh."
            : `Error ${context.toLowerCase()}. Please try again.`;
    
        setError(prevError => {
            // If the same error is already being displayed, don't reset state (prevents flickering)
            if (prevError.visible && prevError.message === errorMessage) {
                return prevError;
            }
            return { visible: true, message: errorMessage };
        });
    
        // Clear any existing timeout
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
    
        // Auto-dismiss errors after 3 seconds
        errorTimerRef.current = setTimeout(() => setError(INITIAL_ERROR_STATE), 3000);

        // If too many consecutive errors, stop polling
        if (consecutiveErrorsRef.current >= 5) {
            console.warn('Too many consecutive errors, stopping polling');
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            setSessionStarted(false);
            apiService.clearSession();
        }
    }, []);
    
    
    const clearErrorOnSuccess = useCallback(() => {
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
        consecutiveErrorsRef.current = 0; // Reset error counter on success
        setError(INITIAL_ERROR_STATE);
    }, []);
    
    const fetchConversationHistory = useCallback(async () => {
        if (!apiService.currentSessionId) {
            return;
        }

        try {
            const response = await apiService.getConversationHistory();
            const conversationData = response.data;
            
            // Transform the conversation data to match the expected format
            const newConversation = conversationData.messages || [];
            
            setConversation(prevConversation => 
                JSON.stringify(prevConversation) !== JSON.stringify(newConversation) ? newConversation : prevConversation
            );
    
            if (newConversation.length > 0) {
                const lastMsg = newConversation[newConversation.length - 1];
                const isAgentMessage = lastMsg.role === "assistant";
                
                // Check if conversation is in a terminal state
                const isTerminalState = ['completed', 'terminated', 'failed'].includes(conversationData.status);
                
                setLoading(!isAgentMessage && conversationData.status === 'active');
                setDone(isTerminalState);
                setConversationStatus(conversationData.status);
    
                setLastMessage(prevLastMessage =>
                    !prevLastMessage || lastMsg.content !== prevLastMessage.content
                        ? lastMsg
                        : prevLastMessage
                );
            } else {
                const isTerminalState = ['completed', 'terminated', 'failed'].includes(conversationData.status);
                setLoading(false);
                setDone(isTerminalState);
                setConversationStatus(conversationData.status);
                setLastMessage(null);
            }
    
            // Successfully fetched data, clear any persistent errors
            clearErrorOnSuccess();
        } catch (err) {
            handleError(err, "fetching conversation");
        }
    }, [handleError, clearErrorOnSuccess]);
    
    // Setup polling with cleanup
    useEffect(() => {
        // Clear any existing polling first
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }

        if (sessionStarted && apiService.currentSessionId && !done) {
            console.log('Starting conversation polling for session:', apiService.currentSessionId);
            pollingRef.current = setInterval(fetchConversationHistory, POLL_INTERVAL);
            
            // Fetch immediately
            fetchConversationHistory();
        }
        
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [sessionStarted, apiService.currentSessionId, done]); // Add 'done' to dependencies to stop polling when conversation ends
    

    const scrollToBottom = useCallback(() => {
        if (containerRef.current) {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                const element = containerRef.current;
                element.scrollTop = element.scrollHeight;
                scrollTimeoutRef.current = null;
            }, 100);
        }
    }, []);

    const handleContentChange = useCallback(() => {
        scrollToBottom();
    }, [scrollToBottom]);

    useEffect(() => {
        if (lastMessage) {
            scrollToBottom();
        }
    }, [lastMessage, scrollToBottom]);

    useEffect(() => {
        if (inputRef.current && !loading && !done && sessionStarted) {
            inputRef.current.focus();
        }
        
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [loading, done, sessionStarted]);

    const handleSendMessage = async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput) return;
        
        try {
            setLoading(true);
            setError(INITIAL_ERROR_STATE);
            await apiService.sendMessage(trimmedInput);
            setUserInput("");
            // Don't set loading to false here - let the polling handle it
        } catch (err) {
            handleError(err, "sending message");
            setLoading(false);
        }
    };

    const handleConfirm = async (toolCallId = 'default', approved = true) => {
        try {
            setLoading(true);
            setError(INITIAL_ERROR_STATE);
            await apiService.approveToolExecution(toolCallId, approved);
            // Don't set loading to false here - let the polling handle it
        } catch (err) {
            handleError(err, "confirming action");
            setLoading(false);
        }
    };

    const handleStartNewChat = async () => {
        try {
            setError(INITIAL_ERROR_STATE);
            setLoading(true);
            
            // Clear any existing session
            apiService.clearSession();
            consecutiveErrorsRef.current = 0;
            
            // Stop any existing polling
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            
            const result = await apiService.startConversation();
            console.log('Started conversation:', result);
            
            setConversation([]);
            setLastMessage(null);
            setSessionStarted(true);
            setDone(false);
            
        } catch (err) {
            handleError(err, "starting new chat");
        } finally {
            setLoading(false);
        }
    };

    // Check for health on component mount
    useEffect(() => {
        const checkHealth = async () => {
            try {
                await apiService.healthCheck();
                clearErrorOnSuccess();
            } catch (err) {
                handleError(err, "connecting to server");
            }
        };
        
        checkHealth();
    }, [handleError, clearErrorOnSuccess]);

    return (
        <div className="flex flex-col h-screen">
            <NavBar title="Temporal AI Agent 🤖" />

            {error.visible && (
                <div className="fixed top-16 left-1/2 transform -translate-x-1/2 
                    bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 
                    transition-opacity duration-300">
                    {error.message}
                </div>
            )}

            <div className="flex-grow flex justify-center px-4 py-2 overflow-hidden">
                <div className="w-full max-w-lg bg-white dark:bg-gray-900 p-8 px-3 rounded shadow-md 
                    flex flex-col overflow-hidden">
                    <div ref={containerRef} 
                        className="flex-grow overflow-y-auto pb-20 pt-10 scroll-smooth">
                        
                        {!sessionStarted ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                <p className="mb-4">Welcome to Temporal AI Agent!</p>
                                <p className="text-sm mb-6">Click "Start New Chat" to begin a conversation with the AI agent.</p>
                                <button
                                    onClick={handleStartNewChat}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded 
                                        transition-all duration-200 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? "Starting..." : "Start New Chat"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <ChatWindow
                                    conversation={conversation}
                                    loading={loading}
                                    onConfirm={handleConfirm}
                                    onContentChange={handleContentChange}
                                />
                                {done && (
                                    <div className="text-center text-sm mt-4 animate-fade-in">
                                        {conversationStatus === 'failed' ? (
                                            <div className="text-red-500 dark:text-red-400">
                                                <div className="mb-2">⚠️ Conversation ended due to an error</div>
                                                <button
                                                    onClick={handleStartNewChat}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm 
                                                        transition-all duration-200 disabled:opacity-50"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Starting..." : "Start New Chat"}
                                                </button>
                                            </div>
                                        ) : conversationStatus === 'terminated' ? (
                                            <div className="text-gray-500 dark:text-gray-400">
                                                Chat was terminated
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 dark:text-gray-400">
                                                Chat ended
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {sessionStarted && (
                <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 
                    w-full max-w-lg bg-white dark:bg-gray-900 p-4
                    border-t border-gray-300 dark:border-gray-700 shadow-lg
                    transition-all duration-200"
                    style={{ zIndex: 10 }}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }} className="flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            className={`flex-grow rounded-l px-3 py-2 border border-gray-300
                                dark:bg-gray-700 dark:border-gray-600 focus:outline-none
                                transition-opacity duration-200
                                ${loading || done ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="Type your message..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={loading || done}
                            aria-label="Type your message"
                        />
                        <button
                            type="submit"
                            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r 
                                transition-all duration-200
                                ${loading || done ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={loading || done}
                            aria-label="Send message"
                        >
                            Send
                        </button>
                    </form>
                    
                    <div className="text-right mt-3">
                        <button
                            onClick={handleStartNewChat}
                            className={`text-sm underline text-gray-600 dark:text-gray-400 
                                hover:text-gray-800 dark:hover:text-gray-200 
                                transition-all duration-200
                                ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={loading}
                            aria-label="Start new chat"
                        >
                            Start New Chat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
