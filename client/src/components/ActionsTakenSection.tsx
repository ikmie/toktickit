import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export interface ActionTakenItem {
  id: number;
  ticketId: number;
  actionDateTime: string;
  description: string;
  result: string;
  performedById: number;
  performedBy: {
    id: number;
    name: string;
    email?: string;
    role: string;
  };
  followUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Assignee {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ActionsTakenSectionProps {
  ticketId: number;
  readOnly?: boolean;
  onActionsUpdated?: () => void;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  readOnly = false,
  onActionsUpdated,
}) => {
  const [actions, setActions] = useState<ActionTakenItem[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ActionTakenItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [actionDateTime, setActionDateTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [performedById, setPerformedById] = useState<number | string>('');
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>('');
  const [attachmentNotes, setAttachmentNotes] = useState<string>('');

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('toktickit_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/actions`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to load actions taken');
      }
      const data = await res.json();
      setActions(data.actions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading actions');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchAssignees = useCallback(async () => {
    if (readOnly) return;
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
  }, [readOnly]);

  useEffect(() => {
    fetchActions();
    fetchAssignees();
  }, [fetchActions, fetchAssignees]);

  const openCreateModal = () => {
    setEditingAction(null);
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm for datetime-local
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setActionDateTime(localISOTime);
    setDescription('');
    setResult('');
    setPerformedById('');
    setFollowUpRequired(false);
    setFollowUpNote('');
    setAttachmentNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (action: ActionTakenItem) => {
    setEditingAction(action);
    const date = new Date(action.actionDateTime);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    setActionDateTime(localISOTime);
    setDescription(action.description);
    setResult(action.result);
    setPerformedById(action.performedById);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || '');
    setAttachmentNotes(action.attachmentNotes || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError('Action description is required.');
      return;
    }
    if (!result.trim()) {
      setFormError('Action result is required.');
      return;
    }
    if (followUpRequired && !followUpNote.trim()) {
      setFormError('Follow-up note is required when follow-up is requested.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload: any = {
        description: description.trim(),
        result: result.trim(),
        followUpRequired,
        followUpNote: followUpRequired ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes.trim() ? attachmentNotes.trim() : null,
      };

      if (actionDateTime) {
        payload.actionDateTime = new Date(actionDateTime).toISOString();
      }

      if (performedById) {
        payload.performedById = Number(performedById);
      }

      let res;
      if (editingAction) {
        res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/actions/${editingAction.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to save action taken');
      }

      setShowModal(false);
      await fetchActions();
      if (onActionsUpdated) {
        onActionsUpdated();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error saving action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4" data-testid="actions-taken-section">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
        <div>
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#1A2E22' }}>
            <span>🛠️</span> Actions Taken
            <span className="badge rounded-pill bg-light text-dark border">
              {actions.length}
            </span>
          </h5>
          <small className="text-muted">
            {readOnly
              ? 'Log of technical actions and resolutions performed by IT Staff.'
              : 'Record technical interventions, diagnostic notes, and resolution actions.'}
          </small>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={openCreateModal}
            data-testid="btn-add-action"
            style={{ borderColor: 'var(--primary-green)', color: 'var(--primary-green)' }}
          >
            + Record Action Taken
          </button>
        )}
      </div>

      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-4 text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            Loading actions...
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3 mb-0">{error}</div>
        ) : actions.length === 0 ? (
          <div className="text-center py-4 text-muted" data-testid="empty-actions-message">
            <p className="mb-1">No actions taken have been recorded yet.</p>
            {!readOnly && (
              <small className="text-danger">
                * Note: At least one Action Taken must be recorded before resolving this ticket.
              </small>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="actions-table">
              <thead className="table-light small text-muted">
                <tr>
                  <th style={{ width: '180px' }}>Date / Time</th>
                  <th>Description</th>
                  <th>Result</th>
                  <th style={{ width: '150px' }}>Performed By</th>
                  <th>Follow-Up</th>
                  <th>Attachment Notes</th>
                  {!readOnly && <th style={{ width: '80px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id} data-testid={`action-row-${act.id}`}>
                    <td className="small text-muted">
                      {new Date(act.actionDateTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="fw-medium text-dark">{act.description}</td>
                    <td>{act.result}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {act.performedBy?.name || 'Staff'}
                      </span>
                    </td>
                    <td>
                      {act.followUpRequired ? (
                        <div>
                          <span className="badge bg-warning text-dark mb-1">
                            Follow-Up Req.
                          </span>
                          {act.followUpNote && (
                            <div className="small text-muted">{act.followUpNote}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td className="small text-muted">
                      {act.attachmentNotes || '-'}
                    </td>
                    {!readOnly && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-decoration-none p-0"
                          onClick={() => openEditModal(act)}
                          data-testid={`btn-edit-action-${act.id}`}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          data-testid="action-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSaveAction}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingAction ? 'Edit Action Taken' : 'Record Action Taken'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger mb-3">{formError}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-bold small">
                      Action Date / Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={actionDateTime}
                      onChange={(e) => setActionDateTime(e.target.value)}
                      required
                      data-testid="input-action-datetime"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Performed By</label>
                    <select
                      className="form-select"
                      value={performedById}
                      onChange={(e) => setPerformedById(e.target.value)}
                      data-testid="select-action-performer"
                    >
                      <option value="">Current User (Default)</option>
                      {assignees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">
                      Action Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Describe the action taken (e.g. Diagnosed hardware, updated software...)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      data-testid="input-action-description"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">
                      Result <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Issue resolved, pending parts, configuration applied"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      required
                      data-testid="input-action-result"
                    />
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="followUpSwitch"
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                      data-testid="check-action-followup"
                    />
                    <label className="form-check-label fw-bold small" htmlFor="followUpSwitch">
                      Follow-Up Required?
                    </label>
                  </div>

                  {followUpRequired && (
                    <div className="mb-3">
                      <label className="form-label fw-bold small">
                        Follow-Up Note <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Detail the next step or follow-up task needed..."
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                        required
                        data-testid="input-action-followup-note"
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Attachment Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Refer to error_screenshot.png attached to ticket"
                      value={attachmentNotes}
                      onChange={(e) => setAttachmentNotes(e.target.value)}
                      data-testid="input-action-attachment-notes"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={submitting}
                    data-testid="btn-submit-action"
                    style={{ backgroundColor: 'var(--primary-green)', borderColor: 'var(--primary-green)' }}
                  >
                    {submitting ? 'Saving...' : 'Save Action'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
