import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import { validateEmail, validatePhone } from '../../utils/validators';

export default function CustomersListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    status: 'Active',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  // Delete / Deactivate dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, customerId: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(cityFilter && { city: cityFilter })
      });
      const res = await api.get(`/customers?${params}`);
      setCustomers(res.data.data.customers);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch customer records.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter, cityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCityFilter('');
    setPage(1);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      companyName: '',
      address: '',
      city: '',
      state: '',
      status: 'Active',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setIsEditing(true);
    setCurrentId(c.CustomerId);
    setFormData({
      customerName: c.CustomerName || '',
      email: c.Email || '',
      phone: c.Phone || '',
      companyName: c.CompanyName || '',
      address: c.Address || '',
      city: c.City || '',
      state: c.State || '',
      status: c.Status || 'Active',
      notes: c.Notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer Name is required.';
    } else if (formData.customerName.trim().length > 150) {
      errors.customerName = 'Customer Name cannot exceed 150 characters.';
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errors.phone = phoneErr;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setModalLoading(true);
      if (isEditing) {
        await api.put(`/customers/${currentId}`, formData);
        showToast('Customer record updated successfully.', 'success');
      } else {
        await api.post('/customers', formData);
        showToast('New customer created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving customer.';
      showToast(msg, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/customers/${deleteDialog.customerId}`);
      showToast('Customer deactivated successfully.', 'success');
      setDeleteDialog({ isOpen: false, customerId: null, name: '' });
      fetchCustomers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate customer.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer Management</h4>
          <p className="text-secondary small mb-0">Master account repository with contact records and transaction history.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-plus-lg"></i>
          <span>Create Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, email, phone, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Filter by City..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary w-100">
              Filter
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleResetFilters} title="Reset">
              <i className="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold small text-dark">
            Accounts Listing ({total} total {total === 1 ? 'customer' : 'customers'})
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching customer records..." />
          ) : customers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-buildings fs-1 d-block mb-2 text-secondary"></i>
              <h6>No customers found matching filter criteria</h6>
              <p className="small mb-3">Adjust your search terms or create a new customer account.</p>
              <button className="btn btn-sm btn-outline-primary" onClick={openCreateModal}>
                + Add Customer
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table crm-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>City / State</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.CustomerId}>
                      <td>
                        <span className="font-monospace small fw-semibold text-primary">{c.CustomerCode}</span>
                      </td>
                      <td>
                        <Link to={`/customers/${c.CustomerId}`} className="fw-semibold text-dark text-decoration-none hover-underline">
                          {c.CustomerName}
                        </Link>
                      </td>
                      <td className="text-secondary small">{c.CompanyName || '-'}</td>
                      <td className="small">{c.Email}</td>
                      <td className="small">{c.Phone}</td>
                      <td className="small text-secondary">{c.City ? `${c.City}${c.State ? `, ${c.State}` : ''}` : '-'}</td>
                      <td>
                        <StatusBadge status={c.Status} />
                      </td>
                      <td className="small text-muted">{c.owner ? c.owner.Name : '-'}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link to={`/customers/${c.CustomerId}`} className="btn btn-light" title="View Profile">
                            <i className="bi bi-eye text-primary"></i>
                          </Link>
                          <button className="btn btn-light" onClick={() => openEditModal(c)} title="Edit Record">
                            <i className="bi bi-pencil text-secondary"></i>
                          </button>
                          <button
                            className="btn btn-light"
                            onClick={() => setDeleteDialog({ isOpen: true, customerId: c.CustomerId, name: c.CustomerName })}
                            title="Deactivate Customer"
                          >
                            <i className="bi bi-trash text-danger"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Customer' : 'Create Customer'} size="lg">
        <form onSubmit={handleSaveCustomer} noValidate>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                className={`form-control ${formErrors.customerName ? 'is-invalid' : ''}`}
                placeholder="Full name or primary contact"
                value={formData.customerName}
                onChange={handleFormChange}
              />
              {formErrors.customerName && <div className="invalid-feedback">{formErrors.customerName}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Company Name</label>
              <input
                type="text"
                name="companyName"
                className="form-control"
                placeholder="Business entity name"
                value={formData.companyName}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Email Address *</label>
              <input
                type="email"
                name="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                placeholder="contact@company.com"
                value={formData.email}
                onChange={handleFormChange}
              />
              {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Phone Number *</label>
              <input
                type="text"
                name="phone"
                className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                placeholder="+91 9123456780"
                value={formData.phone}
                onChange={handleFormChange}
              />
              {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Street Address</label>
            <input
              type="text"
              name="address"
              className="form-control"
              placeholder="Suite, building, street"
              value={formData.address}
              onChange={handleFormChange}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">City</label>
              <input
                type="text"
                name="city"
                className="form-control"
                placeholder="City"
                value={formData.city}
                onChange={handleFormChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">State / Province</label>
              <input
                type="text"
                name="state"
                className="form-control"
                placeholder="State"
                value={formData.state}
                onChange={handleFormChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Account Status</label>
              <select name="status" className="form-select" value={formData.status} onChange={handleFormChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Notes & Account History</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              placeholder="Important notes, customer preferences, SLA terms..."
              value={formData.notes}
              onChange={handleFormChange}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
              {modalLoading ? 'Saving Customer...' : isEditing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, customerId: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Deactivate Customer Account"
        message={`Are you sure you want to deactivate "${deleteDialog.name}"? Historical opportunities and activities will be preserved.`}
        confirmText="Deactivate"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
