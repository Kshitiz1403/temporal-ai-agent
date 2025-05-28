import React, { memo, useCallback } from "react";
import LLMResponse from "./LLMResponse";
import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";

class ChatErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ChatWindow error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 p-4 text-center">
                    Something went wrong. Please terminate the conversation and try again.
                </div>
            );
        }
        return this.props.children;
    }
}

const safeParse = (str) => {
    try {
        return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (err) {
        console.error("safeParse error:", err, "Original string:", str);
        return str;
    }
};

const Message = memo(({ msg, idx, isLastMessage, onConfirm, onContentChange }) => {
    const { role, content } = msg;
    
    if (role === "user") {
        return <MessageBubble message={{ response: content }} isUser />;
    }
    
    if (role === "assistant") {
        // Try to parse content as JSON for structured responses, fallback to plain text
        const data = safeParse(content);
        return (
            <LLMResponse
                data={data}
                onConfirm={onConfirm}
                isLastMessage={isLastMessage}
                onHeightChange={onContentChange}
            />
        );
    }
    
    // Handle system messages if any
    if (role === "system") {
        return (
            <div className="text-gray-500 text-sm italic text-center py-2">
                {content}
            </div>
        );
    }
    
    return null;
});

Message.displayName = 'Message';

const ChatWindow = memo(({ conversation, loading, onConfirm, onContentChange }) => {
    const validateConversation = useCallback((conv) => {
        if (!Array.isArray(conv)) {
            console.error("ChatWindow expected conversation to be an array, got:", conv);
            return [];
        }
        return conv;
    }, []);

    const filtered = validateConversation(conversation).filter((msg) => {
        const { role } = msg;
        return role === "user" || role === "assistant" || role === "system";
    });

    return (
        <ChatErrorBoundary>
            <div className="flex-grow flex flex-col">
                <div className="flex-grow flex flex-col justify-end overflow-y-auto space-y-3">
                    {filtered.length === 0 && !loading && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <p>Start a conversation by typing a message below.</p>
                        </div>
                    )}
                    {filtered.map((msg, idx) => (
                        <Message
                            key={`${msg.role}-${idx}-${msg.id || idx}-${typeof msg.content === 'string' ? msg.content.substring(0, 50) : 'content'}`}
                            msg={msg}
                            idx={idx}
                            isLastMessage={idx === filtered.length - 1}
                            onConfirm={onConfirm}
                            onContentChange={onContentChange}
                        />
                    ))}
                    {loading && (
                        <div className="pt-2 flex justify-center">
                            <LoadingIndicator />
                        </div>
                    )}
                </div>
            </div>
        </ChatErrorBoundary>
    );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
