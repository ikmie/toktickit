import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  department: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserManagementPageProps {
  onBack?: () => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ onBack }) => {
  const { user: currentAuthUser } = useAuth();

  // Non-Admin Forbidden Access Safe Failure Screen (Rubric Part 8 & BR-16)
  if (currentAuthUser && currentAuthUser.role !== 'ADMIN') {
    return (
      <div className="container py-5" data-testid="forbidden-access-container">
        <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: '640px', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-header py-4 text-center text-white" style={{ backgroundColor: '#991B1B' }}>
            <div className="display-4 mb-2">🛡️</div>
            <h2 className="h4 fw-bold mb-1">403 Forbidden &bull; Access Denied</h2>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill mt-1">
              Administrator Privileges Required
            </span>
          </div>
          <div className="card-body p-4 text-center">
            <div className="alert alert-danger d-flex align-items-center justify-content-center gap-2 mb-3" role="alert">
              <span className="fw-semibold">Safe Failure Feedback:</span> Non-administrators cannot access User Management.
            </div>
            <p className="text-secondary mb-3">
              Your account (<strong>{currentAuthUser.email}</strong>) is currently signed in with the role{' '}
              <span className="badge bg-secondary">{currentAuthUser.role}</span>.
            </p>
            <div className="bg-light p-3 rounded-3 text-start mb-4 border">
              <div className="fw-bold text-dark small mb-1">Access Control Policies (BR-01, BR-16):</div>
              <ul className="small text-muted mb-0 ps-3">
                <li>User management and governance operations are restricted exclusively to active Administrators.</li>
                <li>Direct REST API queries to <code>/api/admin/users</code> reject non-administrative tokens with <code>403 Forbidden</code>.</li>
                <li>No sensitive user records, password hashes, or directory contents are disclosed to unauthorized clients.</li>
              </ul>
            </div>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-success px-4"
                onClick={() => {
                  if (onBack) onBack();
                  window.location.hash = '';
                }}
              >
                &larr; Return to Dashboard
              </button>
            </div>
          </div>
          <div className="card-footer bg-light py-2 text-center text-muted small border-top">
            Safe Failure Feedback &bull; TokTickIT RBAC Guard
          </div>
        </div>
      </div>
    );
  }

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [targetUser, setTargetUser] = useState<ManagedUser | null>(null);

  // Create User Form State
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createDepartment, setCreateDepartment] = useState('');
  const [createRole, setCreateRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMIN'>('REQUESTER');
  const [createPassword, setCreatePassword] = useState('Initial@Pass2026!');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMIN'>('REQUESTER');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Form State
  const [resetPasswordVal, setResetPasswordVal] = useState('Reset@Pass2026!');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('toktickit_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '10');

      const res = await fetch(`${API_BASE_URL}/api/admin/users?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to load users (status ${res.status})`);
      }

      const json = await res.json();
      setUsers(json.data || []);
      setPagination(
        json.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          department: createDepartment,
          role: createRole,
          password: createPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.message || 'Failed to create user');
        return;
      }

      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreateDepartment('');
      setCreateRole('REQUESTER');
      setCreatePassword('Initial@Pass2026!');
      setFeedbackSuccess(`User ${data.user.name} created successfully!`);
      fetchUsers();
    } catch (err) {
      setCreateError('Network error creating user');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setTargetUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDepartment(user.department);
    setEditRole(user.role);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setEditError(null);
    setSavingEdit(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          department: editDepartment,
          role: editRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.message || 'Failed to update user');
        return;
      }

      setShowEditModal(false);
      setFeedbackSuccess(`User ${data.user.name} updated successfully!`);
      fetchUsers();
    } catch (err) {
      setEditError('Network error updating user');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    const nextStatus = !user.isActive;
    const actionName = nextStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${actionName} account for ${user.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || `Failed to ${actionName} user.`);
        return;
      }

      setFeedbackSuccess(data.message);
      fetchUsers();
    } catch (err) {
      alert(`Network error toggling status.`);
    }
  };

  const handleOpenReset = (user: ManagedUser) => {
    setTargetUser(user);
    setResetPasswordVal('Reset@Pass2026!');
    setResetError(null);
    setShowResetModal(true);
  };

  const handleSaveReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setResetError(null);
    setResetting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${targetUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPasswordVal }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.message || 'Failed to reset password');
        return;
      }

      setShowResetModal(false);
      setFeedbackSuccess(
        `Password reset successfully for ${targetUser.name}. User will be prompted to set a new password on next login.`
      );
      fetchUsers();
    } catch (err) {
      setResetError('Network error resetting password');
    } finally {
      setResetting(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#DDD6FE', color: '#5B21B6', border: '1px solid #C4B5FD' };
      case 'IT_STAFF':
        return { backgroundColor: '#BFDBFE', color: '#1E40AF', border: '1px solid #93C5FD' };
      case 'REQUESTER':
      default:
        return { backgroundColor: '#A7F3D0', color: '#065F46', border: '1px solid #6EE7B7' };
    }
  };

  return (
    <div className="container py-4">
      {/* Header & Create Action */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <span style={{ color: '#006B3C' }}>User Management</span> &bull; Administration
          </h1>
          <p className="text-muted small mb-0">
            Create users, manage roles, toggle active status, and reset temporary passwords.
          </p>
        </div>
        <button
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={() => {
            setCreateError(null);
            setShowCreateModal(true);
          }}
          data-testid="create-user-modal-trigger"
        >
          <span>&#43;</span> Create New User
        </button>
      </div>

      {feedbackSuccess && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          {feedbackSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setFeedbackSuccess(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">&#128269;</span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by Name, Email, or Department..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="user-search-input"
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Role Filter */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="user-role-filter"
              >
                <option value="">All Roles</option>
                <option value="REQUESTER">Requester</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="user-status-filter"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="col-12 col-md-1 text-end">
              <button
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={() => fetchUsers()}
                title="Refresh user list"
              >
                &#x21bb;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
            <p className="text-muted mt-2">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted fw-normal">No users found</h5>
            <p className="text-muted small">Try adjusting your search criteria or resetting filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="admin-users-table">
              <thead style={{ backgroundColor: '#F8FAF9', borderBottom: '2px solid #E2E8F0' }}>
                <tr>
                  <th scope="col" className="ps-3 py-3 text-secondary small fw-bold text-uppercase">
                    Name & Email
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Department
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Role
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Status
                  </th>
                  <th scope="col" className="py-3 text-secondary small fw-bold text-uppercase">
                    Flags
                  </th>
                  <th scope="col" className="pe-3 py-3 text-end text-secondary small fw-bold text-uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentAuthUser?.id === u.id;
                  return (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      <td className="ps-3">
                        <div className="fw-bold text-dark">{u.name}</div>
                        <div className="text-muted small">{u.email}</div>
                      </td>

                      <td>
                        <span className="text-dark small">{u.department}</span>
                      </td>

                      <td>
                        <span
                          className="badge px-2 py-1 rounded-pill small"
                          style={getRoleBadgeStyle(u.role)}
                          data-testid={`user-role-badge-${u.id}`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td>
                        {u.isActive ? (
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1"
                            data-testid={`user-status-badge-${u.id}`}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1"
                            data-testid={`user-status-badge-${u.id}`}
                          >
                            Inactive
                          </span>
                        )}
                      </td>

                      <td>
                        {u.mustChangePassword && (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill small">
                            Must Change Pwd
                          </span>
                        )}
                      </td>

                      <td className="pe-3 text-end text-nowrap">
                        {/* Edit Button */}
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User Details"
                          data-testid={`edit-user-btn-${u.id}`}
                        >
                          Edit
                        </button>

                        {/* Reset Password Button */}
                        <button
                          className="btn btn-sm btn-outline-warning me-1"
                          onClick={() => handleOpenReset(u)}
                          title="Reset Temporary Password"
                          data-testid={`reset-pwd-btn-${u.id}`}
                        >
                          Reset Pwd
                        </button>

                        {/* Toggle Status Button (BR-17: Disabled for self) */}
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          disabled={isSelf && u.isActive}
                          onClick={() => handleToggleStatus(u)}
                          title={
                            isSelf && u.isActive
                              ? 'Administrators cannot deactivate their own active account.'
                              : u.isActive
                              ? 'Deactivate User'
                              : 'Activate User'
                          }
                          data-testid={`toggle-status-btn-${u.id}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="card-footer bg-white border-top d-flex align-items-center justify-content-between p-3">
          <span className="text-muted small">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} users total)
          </span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  &laquo; Prev
                </button>
              </li>
              <li className={`page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Create New User Account</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  {createError && <div className="alert alert-danger py-2">{createError}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Somchai Prasert"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      required
                      data-testid="create-user-name"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. somchai.p@kmutt.ac.th"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      required
                      data-testid="create-user-email"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Computer Engineering"
                      value={createDepartment}
                      onChange={(e) => setCreateDepartment(e.target.value)}
                      required
                      data-testid="create-user-dept"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">User Role</label>
                    <select
                      className="form-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as any)}
                      data-testid="create-user-role"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Temporary Initial Password</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      required
                      data-testid="create-user-password"
                    />
                    <div className="form-text small">
                      Must be 8+ chars with upper, lower, number, and special character. User will be
                      forced to change password upon first login.
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={creating}
                    data-testid="create-user-submit-btn"
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && targetUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Edit User Details &bull; {targetUser.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  {editError && <div className="alert alert-danger py-2">{editError}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      data-testid="edit-user-name"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      data-testid="edit-user-email"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      required
                      data-testid="edit-user-dept"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">User Role</label>
                    <select
                      className="form-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      data-testid="edit-user-role"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingEdit}
                    data-testid="edit-user-save-btn"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && targetUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Reset Password &bull; {targetUser.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveReset}>
                <div className="modal-body">
                  {resetError && <div className="alert alert-danger py-2">{resetError}</div>}

                  <p className="small text-muted mb-3">
                    Set a new temporary password for <strong>{targetUser.name}</strong> (
                    {targetUser.email}). On next login, the user will be forced to change it.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">New Temporary Password</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      required
                      data-testid="reset-pwd-input"
                    />
                    <div className="form-text small">
                      Requires at least 8 characters with upper, lower, number, and symbol.
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowResetModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold text-dark"
                    disabled={resetting}
                    data-testid="reset-pwd-submit-btn"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Password Reset'}
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
