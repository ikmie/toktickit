import React, { useState } from 'react';
import { useRequester } from '../context/RequesterContext';

export const RequesterSelectorModal: React.FC = () => {
  const { requesters, selectedRequester, selectRequester, isModalOpen, closeModal, loading } =
    useRequester();

  const [tempSelectedId, setTempSelectedId] = useState<number>(
    selectedRequester ? selectedRequester.id : 1
  );

  if (!isModalOpen && selectedRequester) {
    return null; // Don't render modal when closed and a requester is selected
  }

  const handleConfirm = () => {
    selectRequester(tempSelectedId);
    closeModal();
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      data-testid="requester-selector-modal"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content surface-card border-0 shadow">
          <div className="modal-body p-4 text-center">
            {/* Header Icon */}
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--pale-green)',
                color: 'var(--primary-green)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="currentColor"
                className="bi bi-person-gear"
                viewBox="0 0 16 16"
              >
                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm.256 7a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C8.977 9.038 8.497 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256z" />
              </svg>
            </div>

            <h2 className="h4 fw-bold mb-2">Select Development Requester</h2>
            <p className="text-muted small mb-4">
              Choose a development requester to simulate the current requester context for Lab 2.
              This is for testing only and is not a login screen.
            </p>

            {loading ? (
              <div className="py-4 text-muted">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Loading development requesters...
              </div>
            ) : (
              <form onSubmit={(e) => e.preventDefault()} className="text-start">
                <div className="mb-3">
                  <label htmlFor="requesterSelect" className="form-label">
                    Development Requester <span className="required-asterisk">*</span>
                  </label>
                  <select
                    id="requesterSelect"
                    className="form-select"
                    value={tempSelectedId}
                    onChange={(e) => setTempSelectedId(parseInt(e.target.value, 10))}
                    data-testid="requester-dropdown"
                  >
                    {requesters.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.name} ({req.department}) - {req.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info Callout */}
                <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-3 small" style={{ backgroundColor: 'var(--pale-green)', borderColor: 'var(--secondary-green)', color: 'var(--primary-green)' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Only active development requesters are shown.
                </div>

                {/* Warning / Lab 3 Callout */}
                <div className="alert alert-light border py-2 px-3 mb-4 small text-muted">
                  <strong>Authentication coming in Lab 3:</strong> In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.
                </div>

                <div className="d-flex justify-content-end gap-2">
                  {selectedRequester && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary-green px-4"
                    onClick={handleConfirm}
                    data-testid="continue-requester-btn"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
