import React, { useState, useEffect } from 'react';
import { useRequester } from '../context/RequesterContext';
import { API_BASE_URL } from '../config/api';

interface Category {
  id: number;
  name: string;
}

interface RelatedSystem {
  id: number;
  name: string;
  code: string;
}

interface CreateTicketPageProps {
  onSuccess: (ticketId: number) => void;
  onCancel: () => void;
}

export const CreateTicketPage: React.FC<CreateTicketPageProps> = ({ onSuccess, onCancel }) => {
  const { selectedRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [categoryId, setCategoryId] = useState<string>('');
  const [relatedSystemId, setRelatedSystemId] = useState<string>('');
  const [requestedPriority, setRequestedPriority] = useState<string>('MEDIUM');
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const [loadingRefs, setLoadingRefs] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferenceData = async () => {
      setLoadingRefs(true);
      try {
        const [catRes, sysRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`),
          fetch(`${API_BASE_URL}/api/related-systems`),
        ]);

        if (catRes.ok && sysRes.ok) {
          const catData = await catRes.json();
          const sysData = await sysRes.json();
          setCategories(catData);
          setRelatedSystems(sysData);
          if (catData.length > 0) setCategoryId(catData[0].id.toString());
          if (sysData.length > 0) setRelatedSystemId(sysData[0].id.toString());
        }
      } catch {
        setApiError('Unable to load reference data from server.');
      } finally {
        setLoadingRefs(false);
      }
    };

    fetchReferenceData();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newErrors: Record<string, string> = { ...errors };

      const validFiles: File[] = [];
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

      for (const file of selectedFiles) {
        if (!allowedMimes.includes(file.type)) {
          newErrors.attachment = 'Allowed file types: JPG, PNG, WEBP, PDF.';
          setErrors(newErrors);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          newErrors.attachment = 'File size must not exceed 5 MB.';
          setErrors(newErrors);
          return;
        }
        validFiles.push(file);
      }

      if (attachments.length + validFiles.length > 5) {
        newErrors.attachment = 'Maximum 5 active attachments allowed per ticket.';
        setErrors(newErrors);
        return;
      }

      delete newErrors.attachment;
      setErrors(newErrors);
      setAttachments([...attachments, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryId) newErrors.categoryId = 'Category is required.';
    if (!relatedSystemId) newErrors.relatedSystemId = 'Related System is required.';

    if (!summary.trim()) {
      newErrors.summary = 'Summary is required.';
    } else if (summary.trim().length < 5 || summary.trim().length > 150) {
      newErrors.summary = 'Summary must be between 5 and 150 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.trim().length < 10 || description.trim().length > 2000) {
      newErrors.description = 'Description must be between 10 and 2000 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      // 1. Post Ticket
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': selectedRequester ? selectedRequester.id.toString() : '1',
        },
        body: JSON.stringify({
          categoryId: parseInt(categoryId, 10),
          relatedSystemId: parseInt(relatedSystemId, 10),
          requestedPriority,
          summary: summary.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create ticket.');
      }

      const createdTicket = await response.json();
      const ticketId = createdTicket.id;
      setCreatedTicketNumber(createdTicket.ticketNumber);

      // 2. Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);

          await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments`, {
            method: 'POST',
            headers: {
              'X-Requester-Id': selectedRequester ? selectedRequester.id.toString() : '1',
            },
            body: formData,
          });
        }
      }

      // Success delay display
      setTimeout(() => {
        onSuccess(ticketId);
      }, 1500);
    } catch (err: any) {
      setApiError(err.message || 'An error occurred while creating the ticket. Form values preserved.');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdTicketNumber) {
    return (
      <div className="container py-4">
        <div className="surface-card p-5 text-center mx-auto" style={{ maxWidth: '600px' }}>
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '72px', height: '72px', backgroundColor: '#DCFCE7', color: '#15803D' }}
          >
            <i className="bi bi-check-circle-fill fs-1"></i>
          </div>
          <h2 className="h3 fw-bold text-success mb-2">Ticket Submitted Successfully!</h2>
          <p className="text-muted mb-3">Official Ticket Number:</p>
          <div
            className="p-3 mb-4 rounded border font-monospace fs-4 fw-bold"
            style={{ backgroundColor: 'var(--pale-green)', color: 'var(--primary-green)' }}
            data-testid="success-ticket-number"
          >
            {createdTicketNumber}
          </div>
          <p className="small text-muted mb-4">
            Your support request has been logged under <strong>{selectedRequester?.name}</strong>.
          </p>
          <button
            onClick={() => onSuccess(1)}
            className="btn btn-primary-green px-4"
          >
            View in My Tickets &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <button onClick={onCancel} className="btn btn-link p-0 text-decoration-none text-success">
              My Tickets
            </button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Create Ticket
          </li>
        </ol>
      </nav>

      <div className="surface-card p-4">
        <h1 className="h3 fw-bold mb-4" style={{ color: 'var(--primary-green)' }}>
          Create Support Ticket
        </h1>

        {apiError && (
          <div className="alert alert-danger mb-4" role="alert" data-testid="form-api-error">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {apiError}
          </div>
        )}

        {loadingRefs ? (
          <div className="py-4 text-center text-muted">
            <span className="spinner-border spinner-border-sm me-2"></span>
            Loading categories and systems...
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* System Generated Preview Fields */}
            <div className="row mb-4 p-3 rounded" style={{ backgroundColor: 'var(--field-readonly-bg)' }}>
              <div className="col-md-6 mb-2 mb-md-0">
                <label className="form-label text-muted small mb-1">Ticket Number (Auto-Generated)</label>
                <input
                  type="text"
                  className="form-control field-readonly"
                  value="System Generated (e.g. TKT-2026-000104)"
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small mb-1">Requester Identity</label>
                <input
                  type="text"
                  className="form-control field-readonly"
                  value={`${selectedRequester?.name || 'Selected Requester'} (${selectedRequester?.department || ''})`}
                  disabled
                  data-testid="create-ticket-requester-display"
                />
              </div>
            </div>

            {/* Classification Group */}
            <div className="row mb-3">
              <div className="col-md-6 mb-3 mb-md-0">
                <label htmlFor="categoryId" className="form-label">
                  Category <span className="required-asterisk">*</span>
                </label>
                <select
                  id="categoryId"
                  className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  data-testid="category-select"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <div className="invalid-feedback-msg">{errors.categoryId}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="relatedSystemId" className="form-label">
                  Related System <span className="required-asterisk">*</span>
                </label>
                <select
                  id="relatedSystemId"
                  className={`form-select ${errors.relatedSystemId ? 'is-invalid' : ''}`}
                  value={relatedSystemId}
                  onChange={(e) => setRelatedSystemId(e.target.value)}
                  data-testid="system-select"
                >
                  {relatedSystems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.relatedSystemId && <div className="invalid-feedback-msg">{errors.relatedSystemId}</div>}
              </div>
            </div>

            {/* Requested Priority */}
            <div className="mb-3">
              <label className="form-label d-block">
                Requested Priority <span className="required-asterisk">*</span>
              </label>
              <div className="d-flex flex-wrap gap-3">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <div key={p} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="requestedPriority"
                      id={`priority-${p}`}
                      value={p}
                      checked={requestedPriority === p}
                      onChange={(e) => setRequestedPriority(e.target.value)}
                    />
                    <label className="form-check-label fw-medium" htmlFor={`priority-${p}`}>
                      {p}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Input */}
            <div className="mb-3">
              <label htmlFor="summary" className="form-label">
                Ticket Summary <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                id="summary"
                className={`form-control ${errors.summary ? 'is-invalid' : ''}`}
                placeholder="Brief summary of the issue (e.g. Laptop battery drains quickly)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                data-testid="summary-input"
              />
              {errors.summary && <div className="invalid-feedback-msg" data-testid="summary-error">{errors.summary}</div>}
            </div>

            {/* Description Textarea */}
            <div className="mb-4">
              <label htmlFor="description" className="form-label">
                Description <span className="required-asterisk">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                placeholder="Detailed description of the problem, steps to reproduce, or relevant background..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="description-input"
              ></textarea>
              {errors.description && <div className="invalid-feedback-msg" data-testid="description-error">{errors.description}</div>}
            </div>

            {/* File Attachments */}
            <div className="mb-4 p-3 border rounded">
              <label className="form-label">Attachments (Optional)</label>
              <p className="text-muted small mb-2">
                Allowed formats: JPG, PNG, WEBP, PDF. Max 5 MB per file. Maximum 5 attachments.
              </p>
              <input
                type="file"
                className="form-control mb-2"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileSelect}
                disabled={attachments.length >= 5}
                data-testid="file-attachment-input"
              />
              {errors.attachment && (
                <div className="invalid-feedback-msg mb-2" data-testid="attachment-error">{errors.attachment}</div>
              )}

              {attachments.length > 0 && (
                <ul className="list-group list-group-flush mt-2">
                  {attachments.map((f, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-0">
                      <span className="small text-truncate" style={{ maxWidth: '300px' }}>
                        <i className="bi bi-paperclip me-1"></i> {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2"
                        onClick={() => removeAttachment(idx)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-green px-4"
                disabled={submitting}
                data-testid="submit-ticket-btn"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Submitting Ticket...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
