import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const PendingApprovals = ({ sessionId, onApprovalChange }) => {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (sessionId) {
            fetchPendingApprovals();
            // Poll for updates every 2 seconds
            const interval = setInterval(fetchPendingApprovals, 2000);
            return () => clearInterval(interval);
        }
    }, [sessionId]);

    const fetchPendingApprovals = async () => {
        try {
            const response = await apiService.getPendingApprovals(sessionId);
            if (response.success && response.data) {
                setPendingApprovals(response.data.pendingApprovals || []);
            }
        } catch (err) {
            console.error('Error fetching pending approvals:', err);
            setError(err.message);
        }
    };

    const handleApproval = async (toolCallId, approved) => {
        setLoading(true);
        try {
            await apiService.approveToolExecution(toolCallId, approved, sessionId);
            // Remove the approved tool from the list
            setPendingApprovals(prev => prev.filter(tool => tool.id !== toolCallId));
            if (onApprovalChange) {
                onApprovalChange(toolCallId, approved);
            }
        } catch (err) {
            console.error('Error approving tool:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (pendingApprovals.length === 0) {
        return null;
    }

    return (
        <div className="pending-approvals">
            <div className="approval-header">
                <h3>⏳ Pending Approvals</h3>
                <p>The assistant is requesting permission to perform the following actions:</p>
            </div>
            
            {pendingApprovals.map((tool) => (
                <div key={tool.id} className="approval-card">
                    <div className="tool-info">
                        <h4>{tool.name}</h4>
                        <div className="tool-parameters">
                            <pre>{JSON.stringify(tool.parameters, null, 2)}</pre>
                        </div>
                    </div>
                    
                    <div className="approval-actions">
                        <button
                            className="approve-btn"
                            onClick={() => handleApproval(tool.id, true)}
                            disabled={loading}
                        >
                            ✅ Approve
                        </button>
                        <button
                            className="deny-btn"
                            onClick={() => handleApproval(tool.id, false)}
                            disabled={loading}
                        >
                            ❌ Deny
                        </button>
                    </div>
                </div>
            ))}
            
            {error && (
                <div className="approval-error">
                    <p>Error: {error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
        </div>
    );
};

export default PendingApprovals; 