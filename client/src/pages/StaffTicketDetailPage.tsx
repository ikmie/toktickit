import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

interface AttachmentItem {
  id: number;
  originalName: string;
  mimeType: string;
  fileSize: number;
  isRemoved: boolean;
  removedAt: string | null;
  removedReason: string | null;
  uploadedAt: string;
}

interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
}

interface InternalNoteItem {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
}

interface Assignee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface StaffTicketDetail {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  problemResolvedIndicated?: boolean;
  ticketDate: string;
  updatedAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string; code: string };
  requester: { id: number; name: string; email: string; department: string };
  owner: { id: number; name: string; email: string; role: string } | null;
  attachments: AttachmentItem[];
  comments: CommentItem[];
  notes: InternalNoteItem[];
}

interface StaffTicketDetailPageProps {
  ticketId: number;
  onBack: () => void;
}

const PERMITTED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  CANCELLED: ['REOPENED'],
};

export const StaffTicketDetailPage: React.FC<StaffTicketDetailPageProps> = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState<StaffTicketDetail | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Operational controls state
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Comments state
  const [commentText, setCommentText] = useState<string>('');
  const [postingComment, setPostingComment] = useState<boolean>(false);

  // Notes state
  const [noteText, setNoteText] = useState<string>('');
  const [postingNote, setPostingNote] = useState<boolean>(false);

  // Tab state: 'comments' | 'notes' | 'details'
  const [activeTab, setActiveTab] = useState<'comments' | 'notes' | 'details'>('comments');

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('toktickit_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/tickets/${ticketId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to load ticket (status ${res.status})`);
      }
      const data: StaffTicketDetail = await res.json();
      setTicket(data);
      setSelectedOwnerId(data.owner ? data.owner.id.toString() : '');
      setSelectedPriority(data.itPriority);
      setSelectedStatus('');
      setResolutionSummary('');
    } catch (err: any) {
      setError(err.message || 'Error loading ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchAssignees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/assignees`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignees(data);
      }
    } catch (err) {
      console.error('Error fetching assignees:', err);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchAssignees();
  }, [fetchTicket]);

  const handleClaim = async () => {
    setActionSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/tickets/${ticketId}/claim`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setActionSuccess('Ticket claimed successfully!');
        fetchTicket();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to claim ticket');
      }
    } catch (err) {
      alert('Error claiming ticket');
    }
  };

  const handleReassign = async () => {
    setActionSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: selectedOwnerId ? parseInt(selectedOwnerId, 10) : null,
        }),
      });
      if (res.ok) {
        setActionSuccess('Ticket assignment updated successfully!');
        fetchTicket();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to reassign ticket');
      }
    } catch (err) {
      alert('Error assigning ticket');
    }
  };

  const handlePriorityUpdate = async () => {
    setActionSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itPriority: selectedPriority }),
      });
      if (res.ok) {
        setActionSuccess(`IT Priority updated to ${selectedPriority}!`);
        fetchTicket();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update IT Priority');
      }
    } catch (err) {
      alert('Error updating IT Priority');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    setUpdatingStatus(true);
    setActionSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          resolutionSummary: resolutionSummary.trim() || undefined,
        }),
      });
      if (res.ok) {
        setActionSuccess(`Status transitioned to ${selectedStatus}!`);
        setSelectedStatus('');
        setResolutionSummary('');
        fetchTicket();
      } else {
        const err = await res.json();
        alert(err.message || 'Status transition rejected.');
      }
    } catch (err) {
      alert('Error updating ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        fetchTicket();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to post comment');
      }
    } catch (err) {
      alert('Error posting comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setPostingNote(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      if (res.ok) {
        setNoteText('');
        fetchTicket();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to post internal note');
      }
    } catch (err) {
      alert('Error posting internal note');
    } finally {
      setPostingNote(false);
    }
  };

  const allowedTransitions = ticket ? PERMITTED_TRANSITIONS[ticket.currentStatus] || [] : [];

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="text-muted mt-2">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Ticket could not be found'}
        </div>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          &larr; Back to Ticket Queue
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Back Button & Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={onBack}
          data-testid="staff-back-to-queue-btn"
        >
          &larr; Back to Queue
        </button>
        <div className="text-muted small">
          Last Updated: {new Date(ticket.updatedAt).toLocaleString()}
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {actionSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionSuccess(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Requester Indicated Resolution Alert (FR-07 / FR-10) */}
      {ticket.problemResolvedIndicated && (
        <div
          className="alert alert-warning border-2 d-flex align-items-center gap-3 mb-4 shadow-sm"
          role="alert"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
          data-testid="requester-resolved-banner"
        >
          <div className="fs-3 text-warning">&#x2714;</div>
          <div>
            <div className="fw-bold text-warning-emphasis">
              Requester Indicated: Problem Appears Resolved
            </div>
            <div className="small text-secondary">
              The requester ({ticket.requester.name}) marked that this issue appears fixed. Please
              verify resolution with them and transition the status to RESOLVED or CLOSED when confirmed.
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Summary Card */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-light text-dark border fs-6">{ticket.ticketNumber}</span>
                <span className="badge bg-secondary-subtle text-secondary">{ticket.category.name}</span>
                {ticket.relatedSystem && (
                  <span className="badge bg-light text-secondary border">
                    {ticket.relatedSystem.name} ({ticket.relatedSystem.code})
                  </span>
                )}
              </div>
              <h2 className="h4 fw-bold text-dark mb-1" data-testid="staff-ticket-summary">
                {ticket.summary}
              </h2>
              <div className="text-muted small">
                Submitted on {new Date(ticket.ticketDate).toLocaleDateString()} by{' '}
                <strong className="text-dark">{ticket.requester.name}</strong> ({ticket.requester.department} &bull; {ticket.requester.email})
              </div>
            </div>

            {/* Badges */}
            <div className="d-flex flex-column align-items-end gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Status:</span>
                <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill" data-testid="staff-current-status-badge">
                  {ticket.currentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">IT Priority:</span>
                <span className="badge bg-warning text-dark fs-6 px-3 py-1 rounded-pill" data-testid="staff-it-priority-badge">
                  {ticket.itPriority}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Assignee:</span>
                <span className="badge bg-info text-dark px-3 py-1 rounded-pill" data-testid="staff-owner-badge">
                  {ticket.owner ? ticket.owner.name : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-3 text-muted" />

          {/* Description */}
          <div>
            <h6 className="fw-bold text-secondary small text-uppercase mb-2">Description</h6>
            <div
              className="p-3 bg-light rounded text-dark"
              style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
              data-testid="staff-ticket-description"
            >
              {ticket.description}
            </div>
          </div>
        </div>
      </div>

      {/* IT Operational Controls Toolbar (FR-08, FR-09, FR-11) */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', borderLeft: '5px solid #006B3C' }}>
        <div className="card-header bg-white py-3 border-0">
          <h5 className="h6 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <span>&#9881;</span> IT Operational Controls & Triage
          </h5>
        </div>
        <div className="card-body pt-0 pb-4">
          <div className="row g-3">
            {/* Quick Claim / Reassign */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold text-secondary">Assignee Ownership</label>
              <div className="input-group">
                <select
                  className="form-select"
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  data-testid="staff-assignee-select"
                >
                  <option value="">-- Unassigned --</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleReassign}
                  data-testid="staff-reassign-btn"
                >
                  Set
                </button>
              </div>
              {!ticket.owner && (
                <button
                  className="btn btn-sm btn-success w-100 mt-2 d-flex align-items-center justify-content-center gap-1"
                  onClick={handleClaim}
                  data-testid="staff-claim-btn"
                >
                  &#x2714; Claim Ticket to Self
                </button>
              )}
            </div>

            {/* IT Priority Override */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold text-secondary">IT Priority</label>
              <div className="input-group">
                <select
                  className="form-select"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  data-testid="staff-priority-select"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
                <button
                  className="btn btn-outline-primary"
                  onClick={handlePriorityUpdate}
                  data-testid="staff-priority-update-btn"
                >
                  Update
                </button>
              </div>
              <div className="small text-muted mt-1">
                Requested by user: <strong>{ticket.requestedPriority}</strong>
              </div>
            </div>

            {/* Status Transition (BR-14) */}
            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold text-secondary">
                Lifecycle Transition (Current: {ticket.currentStatus})
              </label>
              {allowedTransitions.length === 0 ? (
                <div className="text-muted small p-2 bg-light rounded">
                  No further transitions allowed from {ticket.currentStatus}.
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      data-testid="staff-status-select"
                    >
                      <option value="">-- Choose Next Status --</option>
                      {allowedTransitions.map((st) => (
                        <option key={st} value={st}>
                          &rarr; {st.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      disabled={!selectedStatus || updatingStatus}
                      onClick={handleStatusUpdate}
                      data-testid="staff-status-update-btn"
                    >
                      {updatingStatus ? 'Updating...' : 'Advance Status'}
                    </button>
                  </div>

                  {selectedStatus === 'RESOLVED' && (
                    <div className="mt-2">
                      <textarea
                        className="form-control form-control-sm"
                        placeholder="Resolution summary / actions taken (optional)..."
                        rows={2}
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        data-testid="staff-resolution-summary"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Public Comments vs Internal Notes vs Attachments */}
      <ul className="nav nav-pills mb-3 gap-2" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link px-3 py-2 ${activeTab === 'comments' ? 'active bg-success' : 'bg-white text-dark border'}`}
            onClick={() => setActiveTab('comments')}
            data-testid="tab-comments-btn"
          >
            Public Comments ({ticket.comments?.length || 0})
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link px-3 py-2 ${
              activeTab === 'notes'
                ? 'active'
                : 'bg-white text-dark border'
            }`}
            style={activeTab === 'notes' ? { backgroundColor: '#B45309', color: '#FFF' } : {}}
            onClick={() => setActiveTab('notes')}
            data-testid="tab-notes-btn"
          >
            &#128274; Internal Notes ({ticket.notes?.length || 0})
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link px-3 py-2 ${activeTab === 'details' ? 'active bg-secondary' : 'bg-white text-dark border'}`}
            onClick={() => setActiveTab('details')}
            data-testid="tab-details-btn"
          >
            Attachments & History ({ticket.attachments?.length || 0})
          </button>
        </li>
      </ul>

      {/* Tab: Public Comments */}
      {activeTab === 'comments' && (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white py-3 border-0">
            <h5 className="h6 fw-bold mb-0 text-dark">
              Public Discussion (Visible to Requester and IT Staff)
            </h5>
          </div>
          <div className="card-body pt-0">
            {ticket.comments && ticket.comments.length > 0 ? (
              <div className="d-flex flex-column gap-3 mb-4">
                {ticket.comments.map((c) => {
                  const isStaffAuthor = ['IT_STAFF', 'ADMIN'].includes(c.author?.role);
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded border"
                      style={{
                        backgroundColor: isStaffAuthor ? '#F0FDF4' : '#F9FAFB',
                        borderColor: isStaffAuthor ? '#BBF7D0' : '#E5E7EB',
                      }}
                      data-testid={`comment-item-${c.id}`}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                          <span>{c.author?.name}</span>
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: isStaffAuthor ? '#DCFCE7' : '#E0E7FF',
                              color: isStaffAuthor ? '#166534' : '#3730A3',
                              fontSize: '0.7rem',
                            }}
                          >
                            {c.author?.role}
                          </span>
                        </div>
                        <span className="text-muted small">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                        {c.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted fst-italic py-3">No public comments yet.</p>
            )}

            {/* Post Comment Form */}
            <form onSubmit={handlePostComment}>
              <label className="form-label fw-semibold small text-secondary">
                Post Public Response to Requester
              </label>
              <textarea
                className="form-control mb-2"
                rows={3}
                placeholder="Type your public response here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                data-testid="staff-new-comment-input"
              />
              <button
                type="submit"
                className="btn btn-success"
                disabled={!commentText.trim() || postingComment}
                data-testid="staff-post-comment-btn"
              >
                {postingComment ? 'Posting...' : 'Post Public Comment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Internal Notes (Critical visual requirement: Distinct #FFFBEB Amber Background) */}
      {activeTab === 'notes' && (
        <div
          className="card shadow-sm border-2 mb-4"
          style={{
            borderRadius: '12px',
            backgroundColor: '#FFFBEB',
            borderColor: '#FDE68A',
          }}
          data-testid="staff-internal-notes-card"
        >
          <div
            className="card-header py-3 border-bottom d-flex align-items-center justify-content-between"
            style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}
          >
            <h5 className="h6 fw-bold mb-0 text-amber-900 d-flex align-items-center gap-2" style={{ color: '#78350F' }}>
              <span>&#128274;</span> CONFIDENTIAL &bull; Internal IT Notes (Hidden from Requesters)
            </h5>
            <span
              className="badge rounded-pill"
              style={{ backgroundColor: '#F59E0B', color: '#FFF' }}
            >
              Staff Only
            </span>
          </div>
          <div className="card-body">
            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="d-flex flex-column gap-3 mb-4">
                {ticket.notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded border shadow-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#FCD34D' }}
                    data-testid={`note-item-${n.id}`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="fw-bold text-dark d-flex align-items-center gap-2">
                        <span>{n.author?.name}</span>
                        <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill small">
                          {n.author?.role}
                        </span>
                      </div>
                      <span className="text-muted small">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                      {n.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted fst-italic py-2">
                No internal notes recorded. Record diagnostic logs, vendor escalation notes, or triage notes here.
              </p>
            )}

            {/* Post Internal Note Form */}
            <form onSubmit={handlePostNote}>
              <label className="form-label fw-bold small" style={{ color: '#78350F' }}>
                Add New Confidential Internal Note
              </label>
              <textarea
                className="form-control mb-2"
                rows={3}
                placeholder="Log internal diagnostics, vendor RMA numbers, or private team updates..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ borderColor: '#FCD34D' }}
                data-testid="staff-new-note-input"
              />
              <button
                type="submit"
                className="btn btn-warning fw-bold text-dark"
                disabled={!noteText.trim() || postingNote}
                data-testid="staff-post-note-btn"
              >
                {postingNote ? 'Saving Note...' : 'Save Internal Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Attachments & Additional Info */}
      {activeTab === 'details' && (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white py-3 border-0">
            <h5 className="h6 fw-bold mb-0 text-dark">Ticket Attachments</h5>
          </div>
          <div className="card-body pt-0">
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="list-group list-group-flush">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="list-group-item d-flex align-items-center justify-content-between px-0 py-3"
                  >
                    <div>
                      <div className="fw-semibold text-dark">
                        {att.originalName} {att.isRemoved && <span className="badge bg-danger">Removed</span>}
                      </div>
                      <div className="small text-muted">
                        {(att.fileSize / 1024).toFixed(1)} KB &bull; Uploaded on{' '}
                        {new Date(att.uploadedAt).toLocaleDateString()}
                      </div>
                      {att.isRemoved && att.removedReason && (
                        <div className="small text-danger mt-1">Reason: {att.removedReason}</div>
                      )}
                    </div>
                    {!att.isRemoved && (
                      <a
                        href={`${API_BASE_URL}/api/tickets/${ticket.id}/attachments/${att.id}/content`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary"
                        download
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted fst-italic py-2">No attachments on this ticket.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
