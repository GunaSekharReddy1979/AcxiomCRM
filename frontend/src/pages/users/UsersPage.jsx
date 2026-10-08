import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import { validateEmail } from '../../utils/validators';

export default function UsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: 3,
    department: 'Direct Sales',
    phone: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(roleFilter && { roleId: roleFilter })
      });
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch users.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: 3,
      department: 'Direct Sales',
      phone: '',
      isActive: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setIsEditing(true);
    setCurrentId(u.UserId);
    setFormData({
      name: u.Name || '',
      email: u.Email || '',
      password: '',
      roleId: u.RoleId || 3,
      department: u.Department || 'Direct Sales',
      phone: u.Phone || '',
      isActive: u.IsActive
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      const res = await api.post(`/users/${targetUser.UserId}/toggle-status`);
      showToast(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status.', 'danger');
    }
  };

  const handleUnlockUser = async (targetUser) => {
    try {
      const res = await api.post(`/users/${targetUser.UserId}/unlock`);
      showToast(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unlock user account.', 'danger');
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    if (!isEditing) {
      if (!formData.password) {
        errors.password = 'Password is required for new accounts.';
      } else if (formData.password.length < 8) {
        errors.password = 'Minimum 8 characters required.';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
        errors.password = 'Must contain uppercase, lowercase, digit, and special char (@$!%*?&).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setModalLoading(true);
      if (isEditing) {
        await api.put(`/users/${currentId}`, {
          name: formData.name,
          roleId: parseInt(formData.roleId, 10),
          department: formData.department,
          phone: formData.phone,
          isActive: formData.isActive,
          ...(formData.password && { password: formData.password })
        });
        showToast('User profile updated successfully.', 'success');
      } else {
        await api.post('/users', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: parseInt(formData.roleId, 10),
          department: formData.department,
          phone: formData.phone
        });
        showToast('New user registered into system.', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing user save.', 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold text-dark mb-0">User & Role Administration</h4>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              <i className="bi bi-shield-lock me-1"></i> Admin Authorization
            </span>
          </div>
          <p className="text-secondary small mb-0">Manage employee accounts, role assignments, password policies, and security lockouts.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-person-plus-fill"></i>
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search name, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="1">Admin</option>
              <option value="2">Manager</option>
              <option value="3">Sales Executive</option>
            </select>
          </div>

          <div className="col-md-2">
            <button type="submit" className="btn btn-sm btn-primary w-100">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Loading users & security credentials..." />
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h6>No user accounts found matching filters</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table crm-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name / Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Account Status</th>
                    <th>Security / Lockout Status</th>
                    <th>Member Since</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.UserId === user?.userId;

                    return (
                      <tr key={u.UserId}>
                        <td className="font-monospace small">{u.UserId}</td>
                        <td>
                          <div className="fw-semibold text-dark">{u.Name}</div>
                          <div className="text-muted small">{u.Email}</div>
                        </td>
                        <td>
                          <span
                            className={`badge badge-role ${
                              u.role?.RoleName === 'Admin'
                                ? 'badge-role-admin'
                                : u.role?.RoleName === 'Manager'
                                ? 'badge-role-manager'
                                : 'badge-role-sales'
                            }`}
                          >
                            {u.role?.RoleName}
                          </span>
                        </td>
                        <td className="small text-secondary">{u.Department || '-'}</td>
                        <td>
                          <span className={`badge ${u.IsActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {u.IsActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          {u.isLocked ? (
                            <div className="d-flex align-items-center gap-1">
                              <span className="badge bg-danger">Locked Out</span>
                              <button
                                className="btn btn-xs btn-outline-danger p-0 px-1 small"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => handleUnlockUser(u)}
                                title="Unlock Account"
                              >
                                Unlock
                              </button>
                            </div>
                          ) : (
                            <span className="badge bg-light text-secondary border">Normal ({u.FailedLoginCount || 0} failed)</span>
                          )}
                        </td>
                        <td className="small">{formatDate(u.CreatedDate)}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-light" onClick={() => openEditModal(u)} title="Edit User">
                              <i className="bi bi-pencil text-secondary"></i>
                            </button>
                            {!isSelf && (
                              <button
                                className={`btn btn-light ${u.IsActive ? 'text-danger' : 'text-success'}`}
                                onClick={() => handleToggleStatus(u)}
                                title={u.IsActive ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <i className={`bi ${u.IsActive ? 'bi-person-slash' : 'bi-person-check'}`}></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit User' : 'Add Employee Account'}>
        <form onSubmit={handleSaveUser} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Full Name *</label>
            <input
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Corporate Email *</label>
            <input
              type="email"
              className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
              value={formData.email}
              disabled={isEditing}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Role Assignment *</label>
              <select
                className="form-select"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              >
                <option value={3}>Sales Executive</option>
                <option value={2}>Manager</option>
                <option value={1}>Admin</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Department</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Phone Number</label>
            <input
              type="text"
              className="form-control"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">
              {isEditing ? 'Change Password (Leave blank to keep existing)' : 'Initial Password *'}
            </label>
            <input
              type="password"
              className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
              placeholder={isEditing ? '••••••••' : 'Min 8 chars with uppercase, digit, special'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
