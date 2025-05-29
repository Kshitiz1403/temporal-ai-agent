const API_BASE_URL = 'http://localhost:3000/api/agent';

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.message || 'An error occurred',
            response.status
        );
    }
    return response.json();
}

export const apiService = {
    // Current session ID - in a real app, this would be managed differently
    currentSessionId: null,

    async startConversation(config = {}) {
        try {


            const requestConfig = {};

            const res = await fetch(`${API_BASE_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestConfig)
            });

            const result = await handleResponse(res);

            // The backend returns { success: true, data: { sessionId, workflowId } }
            if (result.success && result.data && result.data.sessionId) {
                this.currentSessionId = result.data.sessionId;
                return result;
            } else {
                throw new ApiError('Invalid response format from server', 500);
            }
        } catch (error) {
            throw new ApiError(
                'Failed to start conversation',
                error.status || 500
            );
        }
    },

    async getConversationHistory(sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}`);

            if (res.status === 404) {
                // Return empty conversation data for 404s instead of throwing
                return {
                    success: true,
                    data: {
                        id: id,
                        messages: [],
                        status: 'active',
                        goals: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                };
            }

            const result = await handleResponse(res);

            // Ensure the result has the expected structure
            if (result.success && result.data) {
                return result;
            } else {
                // Return default structure if malformed response
                return {
                    success: true,
                    data: {
                        id: id,
                        messages: [],
                        status: 'active',
                        goals: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            if (error.status === 404) {
                // Return empty conversation data for 404s
                return {
                    success: true,
                    data: {
                        id: id,
                        messages: [],
                        status: 'active',
                        goals: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                };
            }
            throw new ApiError(
                'Failed to fetch conversation history',
                error.status || 500
            );
        }
    },

    async sendMessage(message, sessionId = null) {
        if (!message?.trim()) {
            throw new ApiError('Message cannot be empty', 400);
        }

        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to send message',
                error.status || 500
            );
        }
    },

    async getStatus(sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}/status`);
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to get status',
                error.status || 500
            );
        }
    },

    async getPendingApprovals(sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}/pending-approvals`);
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to get pending approvals',
                error.status || 500
            );
        }
    },

    async approveToolExecution(toolCallId, approved, sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ toolCallId, approved })
            });
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to approve tool execution',
                error.status || 500
            );
        }
    },

    async updateGoals(goals, sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}/goals`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ goals })
            });
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to update goals',
                error.status || 500
            );
        }
    },

    async terminateConversation(reason = 'User terminated', sessionId = null) {
        const id = sessionId || this.currentSessionId;
        if (!id) {
            throw new ApiError('No active session', 400);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });
            const result = await handleResponse(res);
            this.currentSessionId = null;
            return result;
        } catch (error) {
            throw new ApiError(
                'Failed to terminate conversation',
                error.status || 500
            );
        }
    },

    async listActiveConversations() {
        try {
            const res = await fetch(`${API_BASE_URL}/conversations`);
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to list conversations',
                error.status || 500
            );
        }
    },

    async healthCheck() {
        try {
            const res = await fetch(`${API_BASE_URL}/health`);
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Health check failed',
                error.status || 500
            );
        }
    },

    // Legacy methods for backward compatibility with original frontend
    async startWorkflow() {
        return this.startConversation();
    },

    async confirm(toolCallId = 'default', approved = true) {
        return this.approveToolExecution(toolCallId, approved);
    },

    // Clear current session
    clearSession() {
        this.currentSessionId = null;
    }
}; 