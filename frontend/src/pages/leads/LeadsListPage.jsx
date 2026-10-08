import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConvertLeadModal from '../../components/leads/ConvertLeadModal';
import { formatCurrency } from '../../utils/formatters';
import { validateEmail, validatePhone } from '../../utils/validators';

export default function LeadsListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    leadName: '',
    email: '',
    phone: '',
    companyName: '',
    source: 'Website',
    status: 'New',
    priority: 'Medium',
    expectedValue: 10000,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  // Convert Modal State
  const [convertTarget, setConvertTarget] = useState(null);

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, leadId: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      });
      const res = await api.get(`/leads?${params}`);
      setLeads(res.data.data.leads);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch leads.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      leadName: '',
      email: '',
      phone: '',
      companyName: '',
      source: 'Website',
      status: 'New',
      priority: 'Medium',
      expectedValue: 15000,
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (l) => {
    setIsEditing(true);
    setCurrentId(l.LeadId);
    setFormData({
      leadName: l.LeadName || '',
      email: l.Email || '',
      phone: l.Phone || '',
      companyName: l.CompanyName || '',
      source: l.Source || 'Website',
      status: l.Status || 'New',
      priority: l.Priority || 'Medium',
      expectedValue: l.ExpectedValue || 0,
      notes: l.Notes || ''
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
    if (!formData.leadName.trim()) {
      errors.leadName = 'Lead name is required.';
    } else if (formData.leadName.trim().length > 150) {
      errors.leadName = 'Lead name cannot exceed 150 characters.';
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errors.phone = phoneErr;

    if (!formData.status) {
      errors.status = 'Lead status is mandatory.';
    }

    if (formData.expectedValue === '' || isNaN(parseFloat(formData.expectedValue)) || parseFloat(formData.expectedValue) < 0) {
      errors.expectedValue = 'Expected value must be a valid number greater than or equal to 0.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setModalLoading(true);
      if (isEditing) {
        await api.put(`/leads/${currentId}`, formData);
        showToast('Lead updated successfully.', 'success');
      } else {
        await api.post('/leads', formData);
        showToast('New lead captured successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving lead.';
      showToast(msg, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/leads/${deleteDialog.leadId}`);
      showToast('Lead deleted successfully.', 'success');
      setDeleteDialog({ isOpen: false, leadId: null, name: '' });
      fetchLeads();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete lead.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Lead Management</h4>
          <p className="text-secondary small mb-0">Capture inbound prospects, qualify opportunities, and execute customer conversions.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-funnel"></i>
          <span>Capture Lead</span>
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
                placeholder="Search lead name, company, email..."
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
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
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
            Prospect Pipeline ({total} total {total === 1 ? 'lead' : 'leads'})
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching lead pipeline..." />
          ) : leads.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-funnel fs-1 d-block mb-2 text-secondary"></i>
              <h6>No leads found matching criteria</h6>
              <p className="small mb-3">Begin capturing inbound inquiries or adjust filter parameters.</p>
              <button className="btn btn-sm btn-outline-primary" onClick={openCreateModal}>
                + Capture Lead
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table crm-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Lead Code</th>
                    <th>Lead Name</th>
                    <th>Company</th>
                    <th>Email / Phone</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Expected Value</th>
                    <th>Assigned To</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.LeadId}>
                      <td>
                        <span className="font-monospace small fw-semibold text-primary">{l.LeadCode}</span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{l.LeadName}</div>
                      </td>
                      <td className="text-secondary small">{l.CompanyName || '-'}</td>
                      <td>
                        <div className="small text-dark">{l.Email}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.Phone}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{l.Source || 'Website'}</span>
                      </td>
                      <td>
                        <StatusBadge status={l.Status} />
                      </td>
                      <td>
                        <StatusBadge status={l.Priority} type="priority" />
                      </td>
                      <td className="fw-semibold text-dark">{formatCurrency(l.ExpectedValue)}</td>
                      <td className="small text-muted">{l.assignedUser?.Name || '-'}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {l.Status !== 'Converted' ? (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => setConvertTarget(l)}
                              title="Convert to Customer & Opportunity"
                            >
                              <i className="bi bi-arrow-repeat me-1"></i> Convert
                            </button>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success-subtle py-2 px-2 d-inline-flex align-items-center">
                              <i className="bi bi-check2-circle me-1"></i> Converted
                            </span>
                          )}

                          <button className="btn btn-light" onClick={() => openEditModal(l)} title="Edit Lead">
                            <i className="bi bi-pencil text-secondary"></i>
                          </button>
                          <button
                            className="btn btn-light"
                            onClick={() => setDeleteDialog({ isOpen: true, leadId: l.LeadId, name: l.LeadName })}
                            title="Delete Lead"
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

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Lead' : 'Capture New Lead'} size="lg">
        <form onSubmit={handleSaveLead} noValidate>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Lead Name *</label>
              <input
                type="text"
                name="leadName"
                className={`form-control ${formErrors.leadName ? 'is-invalid' : ''}`}
                placeholder="Full name of prospect"
                value={formData.leadName}
                onChange={handleFormChange}
              />
              {formErrors.leadName && <div className="invalid-feedback">{formErrors.leadName}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Company Name</label>
              <input
                type="text"
                name="companyName"
                className="form-control"
                placeholder="Organization name"
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
                placeholder="prospect@example.com"
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
                placeholder="+91 9820011223"
                value={formData.phone}
                onChange={handleFormChange}
              />
              {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Lead Source</label>
              <select name="source" className="form-select" value={formData.source} onChange={handleFormChange}>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Campaign">Campaign</option>
                <option value="Partner">Partner</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Status *</label>
              <select
                name="status"
                className={`form-select ${formErrors.status ? 'is-invalid' : ''}`}
                value={formData.status}
                onChange={handleFormChange}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
              {formErrors.status && <div className="invalid-feedback">{formErrors.status}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Priority</label>
              <select name="priority" className="form-select" value={formData.priority} onChange={handleFormChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Expected Deal Value ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="expectedValue"
              className={`form-control ${formErrors.expectedValue ? 'is-invalid' : ''}`}
              placeholder="e.g. 50000"
              value={formData.expectedValue}
              onChange={handleFormChange}
            />
            {formErrors.expectedValue && <div className="invalid-feedback">{formErrors.expectedValue}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Notes & Requirements</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              placeholder="Prospect requirements, budget, initial qualification answers..."
              value={formData.notes}
              onChange={handleFormChange}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Capture Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        isOpen={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        lead={convertTarget}
        onConversionSuccess={() => {
          fetchLeads();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, leadId: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Prospect Lead"
        message={`Are you sure you want to delete the lead for "${deleteDialog.name}"? This action cannot be reversed.`}
        confirmText="Delete Lead"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
