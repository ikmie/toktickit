import React, { useState, useEffect } from 'react';
import { useRequester } from '../context/RequesterContext';
import { API_BASE_URL } from '../config/api';

interface TicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  category: string;
  categoryId: number;
  relatedSystem: string;
  relatedSystemId: number;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  ticketDate: string;
  updatedAt: string;
  attachmentCount: number;
}

interface MyTicketsPageProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateTicket: () => void;
  initialStatus?: string;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({ onSelectTicket, onCreateTicket, initialStatus }) => {
  const { selectedRequester } = useRequester();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [status, setStatus] = useState<string>(initialStatus || '');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load Categories for Filter Dropdown
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // Fetch Tickets when filters / requester / page change
  const fetchTickets = async () => {
    if (!selectedRequester) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryId) params.append('categoryId', categoryId);
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', '5');

      const response = await fetch(`${API_BASE_URL}/api/tickets?${params.toString()}`, {
        headers: {
          'X-Requester-Id': selectedRequester.id.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const resData = await response.json();
      setTickets(resData.data);
      setTotal(resData.pagination.total);
      setTotalPages(resData.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedRequester, search, categoryId, priority, status, page]);

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setPriority('');
    setStatus('');
    setPage(1);
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

  const hasFiltersActive = search !== '' || categoryId !== '' || priority !== '' || status !== '';

  return (
    <div className="container py-4">
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--primary-green)' }}>
            My Tickets
          </h1>
          <p className="text-muted small mb-0">
            View and track support tickets submitted by <strong>{selectedRequester?.name}</strong>.
          </p>
        </div>
        <button
          onClick={onCreateTicket}
          className="btn btn-primary-green d-flex align-items-center gap-2"
          data-testid="create-ticket-btn"
        >
          <i className="bi bi-plus-lg"></i> Create Ticket
        </button>
      </div>

      {/* Filter Surface */}
      <div className="surface-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          {/* Search Input */}
          <div className="col-lg-3 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search ticket no. or summary..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select form-select-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              data-testid="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Requested Priority Filter */}
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select form-select-sm"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              data-testid="priority-filter"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              data-testid="status-filter"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="col-lg-3 col-md-12 text-lg-end">
            {hasFiltersActive && (
              <button
                onClick={handleClearFilters}
                className="btn btn-sm btn-outline-secondary px-3"
                data-testid="clear-filters-btn"
              >
                <i className="bi bi-x-circle me-1"></i> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="surface-card p-5 text-center text-muted" data-testid="tickets-loading">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Loading tickets...
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        /* Empty State */
        <div className="surface-card p-5 text-center" data-testid="empty-tickets-state">
          <div className="text-muted mb-3 fs-1">
            <i className="bi bi-inbox"></i>
          </div>
          {hasFiltersActive ? (
            <>
              <h2 className="h5 fw-bold mb-2">No Matching Tickets Found</h2>
              <p className="text-muted small mb-3">
                No tickets match your search or filter criteria. Try clearing your filters.
              </p>
              <button onClick={handleClearFilters} className="btn btn-outline-green btn-sm">
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h2 className="h5 fw-bold mb-2">No Tickets Created Yet</h2>
              <p className="text-muted small mb-3">
                You haven't submitted any IT support requests under {selectedRequester?.name}.
              </p>
              <button onClick={onCreateTicket} className="btn btn-primary-green btn-sm">
                Create First Ticket &rarr;
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Responsive Table View */}
          <div className="surface-card overflow-hidden mb-3 responsive-ticket-table">
            <table className="table table-hover align-middle mb-0" data-testid="tickets-table">
              <thead className="table-light small text-muted">
                <tr>
                  <th scope="col">Ticket No.</th>
                  <th scope="col">Created Date</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Category</th>
                  <th scope="col">Req. Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => onSelectTicket(t.id)}>
                    <td className="fw-semibold text-success font-monospace small">{t.ticketNumber}</td>
                    <td className="small text-muted">
                      {new Date(t.ticketDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '280px' }}>
                        {t.summary}
                      </div>
                    </td>
                    <td className="small">{t.category}</td>
                    <td>
                      <span className={`badge px-2 py-1 ${getPriorityBadgeClass(t.requestedPriority)}`}>
                        {t.requestedPriority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge px-2 py-1 ${getStatusBadgeClass(t.currentStatus)}`}>
                        {t.currentStatus}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        className="btn btn-sm btn-outline-green"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="responsive-ticket-cards mb-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="surface-card p-3"
                onClick={() => onSelectTicket(t.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="font-monospace fw-bold text-success small">{t.ticketNumber}</span>
                  <span className={`badge ${getStatusBadgeClass(t.currentStatus)}`}>
                    {t.currentStatus}
                  </span>
                </div>
                <h2 className="h6 fw-bold mb-2 text-dark">{t.summary}</h2>
                <div className="d-flex justify-content-between align-items-center text-muted small mt-2">
                  <span>{t.category}</span>
                  <span className={`badge ${getPriorityBadgeClass(t.requestedPriority)}`}>
                    {t.requestedPriority}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 small text-muted">
            <span>
              Showing {(page - 1) * 5 + 1} to {Math.min(page * 5, total)} of {total} tickets
            </span>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                &laquo; Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  className={`btn btn-sm ${pNum === page ? 'btn-primary-green' : 'btn-outline-secondary'}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
