import React, { useState, useEffect } from 'react';
import { useRequester } from '../context/RequesterContext';

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

interface TicketDetail {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  ticketDate: string;
  updatedAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string; code: string };
  requester: { id: number; name: string; email: string; department: string };
  attachments: AttachmentItem[];
}

interface TicketDetailPageProps {
  ticketId: number;
  onBack: () => void;
}

export const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ ticketId, onBack }) => {
  const { selectedRequester } = useRequester();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Soft remove modal state
  const [removeAttachmentId, setRemoveAttachmentId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  // Add attachment modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const fetchTicketDetail = async () => {
    if (!selectedRequester) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
        headers: {
          'X-Requester-Id': selectedRequester.id.toString(),
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access Denied: You do not have permission to view this ticket.');
        }
        throw new Error('Failed to load ticket details.');
      }

      const data = await response.json();
      setTicket(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading ticket detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId, selectedRequester]);

  const handleDownload = (attachmentId: number) => {
    if (!selectedRequester) return;
    window.open(
      `http://localhost:5000/api/attachments/${attachmentId}/download?requesterId=${selectedRequester.id}`,
      '_blank'
    );
  };

  const handleConfirmSoftRemove = async () => {
    if (!removeAttachmentId || !selectedRequester) return;

    if (!removalReason.trim()) {
      setRemovalError('A non-empty removal reason is required.');
      return;
    }

    setRemoving(true);
    setRemovalError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/attachments/${removeAttachmentId}/soft-remove`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Requester-Id': selectedRequester.id.toString(),
          },
          body: JSON.stringify({ reason: removalReason.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to soft-remove attachment.');
      }

      // Refresh ticket detail
      setRemoveAttachmentId(null);
      setRemovalReason('');
      await fetchTicketDetail();
    } catch (err: any) {
      setRemovalError(err.message);
    } finally {
      setRemoving(false);
    }
  };

  const handleUploadNewAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedRequester) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(uploadFile.type)) {
      setUploadError('Allowed file types: JPG, PNG, WEBP, PDF.');
      return;
    }

    if (uploadFile.size > 5 * 1024 * 1024) {
      setUploadError('File size must not exceed 5 MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticketId}/attachments`,
        {
          method: 'POST',
          headers: {
            'X-Requester-Id': selectedRequester.id.toString(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to upload attachment.');
      }

      setShowAddModal(false);
      setUploadFile(null);
      await fetchTicketDetail();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'LOW':
        return 'badge-priority-low';
      case 'MEDIUM':
        return 'badge-priority-medium';
      case 'HIGH':
        return 'badge-priority-high';
      case 'URGENT':
        return 'badge-priority-urgent';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'NEW':
        return 'badge-status-new';
      case 'OPEN':
        return 'badge-status-open';
      case 'IN_PROGRESS':
        return 'badge-status-in-progress';
      case 'PENDING':
        return 'badge-status-pending';
      case 'RESOLVED':
        return 'badge-status-resolved';
      case 'CLOSED':
        return 'badge-status-closed';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="surface-card p-5 text-center text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Loading ticket detail...
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger p-4 shadow-sm" role="alert" data-testid="detail-access-error">
          <h4 className="alert-heading fw-bold mb-2">
            <i className="bi bi-shield-lock-fill me-2"></i> Ticket Access Error
          </h4>
          <p className="mb-3">{error || 'Ticket not found.'}</p>
          <button onClick={onBack} className="btn btn-outline-danger btn-sm">
            &larr; Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter((a) => !a.isRemoved);
  const removedAttachments = ticket.attachments.filter((a) => a.isRemoved);

  return (
    <div className="container py-4">
      {/* Breadcrumb & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item">
              <button onClick={onBack} className="btn btn-link p-0 text-decoration-none text-success">
                My Tickets
              </button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Ticket Details
            </li>
          </ol>
        </nav>
        <button onClick={onBack} className="btn btn-outline-secondary btn-sm" data-testid="back-to-tickets-btn">
          &larr; Back to My Tickets
        </button>
      </div>

      {/* Ticket Header Surface */}
      <div className="surface-card p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 border-bottom pb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="font-monospace h4 fw-bold mb-0" style={{ color: 'var(--primary-green)' }}>
                {ticket.ticketNumber}
              </span>
              <span className={`badge ${getStatusBadgeClass(ticket.currentStatus)}`}>
                {ticket.currentStatus}
              </span>
            </div>
            <p className="text-muted small mb-0">
              Submitted on{' '}
              {new Date(ticket.ticketDate).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="d-flex gap-2 mt-2 mt-sm-0">
            <span className={`badge ${getPriorityBadgeClass(ticket.requestedPriority)} px-3 py-2 fs-6`}>
              Req. Priority: {ticket.requestedPriority}
            </span>
            <span className={`badge ${getPriorityBadgeClass(ticket.itPriority)} px-3 py-2 fs-6`}>
              IT Priority: {ticket.itPriority}
            </span>
          </div>
        </div>

        {/* Read Only Ticket Fields */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label text-muted small mb-1">Requester Name</label>
            <input
              type="text"
              className="form-control field-readonly"
              value={`${ticket.requester.name} (${ticket.requester.department})`}
              disabled
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted small mb-1">Category</label>
            <input
              type="text"
              className="form-control field-readonly"
              value={ticket.category.name}
              disabled
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted small mb-1">Related System</label>
            <input
              type="text"
              className="form-control field-readonly"
              value={ticket.relatedSystem.name}
              disabled
            />
          </div>

          <div className="col-12">
            <label className="form-label text-muted small mb-1">Summary</label>
            <input
              type="text"
              className="form-control field-readonly fw-semibold"
              value={ticket.summary}
              disabled
            />
          </div>

          <div className="col-12">
            <label className="form-label text-muted small mb-1">Description</label>
            <textarea
              className="form-control field-readonly"
              rows={4}
              value={ticket.description}
              disabled
            ></textarea>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="border-top pt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0" style={{ color: 'var(--primary-green)' }}>
              Supporting Attachments ({activeAttachments.length}/5 Active)
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-outline-green btn-sm"
              disabled={activeAttachments.length >= 5}
              data-testid="add-attachment-btn"
            >
              <i className="bi bi-paperclip me-1"></i> Add Attachment
            </button>
          </div>

          {ticket.attachments.length === 0 ? (
            <div className="p-3 text-center text-muted bg-light rounded small">
              No supporting attachments uploaded for this ticket.
            </div>
          ) : (
            <ul className="list-group list-group-flush" data-testid="attachments-list">
              {ticket.attachments.map((att) => (
                <li
                  key={att.id}
                  className="list-group-item d-flex flex-wrap justify-content-between align-items-center py-3 px-0 border-bottom"
                >
                  <div className="d-flex align-items-center gap-2 mb-2 mb-sm-0">
                    <i
                      className={`bi fs-4 ${
                        att.isRemoved
                          ? 'bi-file-earmark-x text-secondary'
                          : 'bi-file-earmark-arrow-down text-success'
                      }`}
                    ></i>
                    <div>
                      <div className="fw-medium text-dark">
                        {att.originalName}{' '}
                        {att.isRemoved && (
                          <span className="badge bg-secondary ms-2" data-testid="removed-badge">
                            Removed
                          </span>
                        )}
                      </div>
                      <div className="small text-muted">
                        {(att.fileSize / 1024).toFixed(1)} KB &bull; Uploaded{' '}
                        {new Date(att.uploadedAt).toLocaleDateString()}
                      </div>
                      {att.isRemoved && att.removedReason && (
                        <div className="small text-danger mt-1" data-testid="removal-reason-display">
                          <strong>Removal Reason:</strong> {att.removedReason} (
                          {new Date(att.removedAt!).toLocaleString()})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2">
                    {!att.isRemoved ? (
                      <>
                        <button
                          onClick={() => handleDownload(att.id)}
                          className="btn btn-sm btn-outline-green"
                          data-testid="download-attachment-btn"
                        >
                          <i className="bi bi-download me-1"></i> Download
                        </button>
                        <button
                          onClick={() => {
                            setRemoveAttachmentId(att.id);
                            setRemovalReason('');
                            setRemovalError(null);
                          }}
                          className="btn btn-sm btn-outline-danger"
                          data-testid="soft-remove-btn"
                        >
                          Soft Remove
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-light border text-muted" disabled>
                        Download Blocked
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Soft Remove Reason Modal */}
      {removeAttachmentId && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          data-testid="soft-remove-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content surface-card border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">Confirm Soft Removal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRemoveAttachmentId(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Attachment metadata will remain visible, but the file content will no longer be previewed or downloadable.
                </p>

                {removalError && (
                  <div className="alert alert-danger py-2 small mb-3">{removalError}</div>
                )}

                <div className="mb-3">
                  <label htmlFor="removalReason" className="form-label">
                    Removal Reason <span className="required-asterisk">*</span>
                  </label>
                  <textarea
                    id="removalReason"
                    rows={3}
                    className="form-control"
                    placeholder="Enter mandatory reason for removing this attachment..."
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    data-testid="removal-reason-input"
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => setRemoveAttachmentId(null)}
                    disabled={removing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-destructive btn-sm px-3"
                    onClick={handleConfirmSoftRemove}
                    disabled={removing}
                    data-testid="confirm-soft-remove-btn"
                  >
                    {removing ? 'Removing...' : 'Confirm Soft Remove'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Attachment Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content surface-card border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--primary-green)' }}>
                  Add Attachment
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                {uploadError && <div className="alert alert-danger py-2 small mb-3">{uploadError}</div>}

                <form onSubmit={handleUploadNewAttachment}>
                  <div className="mb-3">
                    <label className="form-label">Select File</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <div className="form-text small text-muted">
                      Allowed: JPG, PNG, WEBP, PDF up to 5 MB.
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3"
                      onClick={() => setShowAddModal(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-green btn-sm px-3"
                      disabled={uploading || !uploadFile}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
