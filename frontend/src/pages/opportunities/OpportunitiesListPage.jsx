import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { validateOpportunityAmount, validateProbability, validateExpectedCloseDate } from '../../utils/validators';

export default function OpportunitiesListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    opportunityName: '',
    customerId: '',
    amount: '',
    stage: 'Qualification',
    probability: 20,
    expectedCloseDate: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, oppId: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(stageFilter && { stage: stageFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      const res = await api.get(`/opportunities?${params}`);
      setOpportunities(res.data.data.opportunities);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch opportunities.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers?limit=100');
      setCustomers(res.data.data.customers || []);
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchCustomersList();
  }, [page, stageFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOpportunities();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStageFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setFormData({
      opportunityName: '',
      customerId: customers.length > 0 ? customers[0].CustomerId : '',
      amount: 25000,
      stage: 'Qualification',
      probability: 25,
      expectedCloseDate: futureDate.toISOString().split('T')[0],
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (opp) => {
    setIsEditing(true);
    setCurrentId(opp.OpportunityId);
    setFormData({
      opportunityName: opp.OpportunityName || '',
      customerId: opp.CustomerId || '',
      amount: opp.Amount || '',
      stage: opp.Stage || 'Qualification',
      probability: opp.Probability !== undefined ? opp.Probability : 20,
      expectedCloseDate: opp.ExpectedCloseDate ? opp.ExpectedCloseDate.split('T')[0] : '',
      notes: opp.Notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto adjust probability on stage change if sensible
      if (name === 'stage') {
        if (value === 'Qualification') updated.probability = 20;
        else if (value === 'Proposal') updated.probability = 50;
        else if (value === 'Negotiation') updated.probability = 75;
        else if (value === 'Won') updated.probability = 100;
        else if (value === 'Lost') updated.probability = 0;
      }
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.opportunityName.trim()) {
      errors.opportunityName = 'Opportunity Name is required.';
    }

    const amountErr = validateOpportunityAmount(formData.amount);
    if (amountErr) errors.amount = amountErr;

    const probErr = validateProbability(formData.probability);
    if (probErr) errors.probability = probErr;

    const dateErr = validateExpectedCloseDate(formData.expectedCloseDate, formData.stage);
    if (dateErr) errors.expectedCloseDate = dateErr;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOpportunity = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setModalLoading(true);
      const payload = {
        ...formData,
        customerId: formData.customerId ? parseInt(formData.customerId, 10) : null,
        amount: parseFloat(formData.amount),
        probability: parseInt(formData.probability, 10)
      };

      if (isEditing) {
        await api.put(`/opportunities/${currentId}`, payload);
        showToast('Opportunity updated successfully.', 'success');
      } else {
        await api.post('/opportunities', payload);
        showToast('New opportunity added to pipeline.', 'success');
      }
      setIsModalOpen(false);
      fetchOpportunities();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving opportunity.';
      showToast(msg, 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/opportunities/${deleteDialog.oppId}`);
      showToast('Opportunity removed from pipeline.', 'success');
      setDeleteDialog({ isOpen: false, oppId: null, name: '' });
      fetchOpportunities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete opportunity.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  // Derived weighted value helper for modal preview
  const liveWeighted = formData.amount && !isNaN(formData.amount) && !isNaN(formData.probability)
    ? Math.round((parseFloat(formData.amount) * parseInt(formData.probability, 10)) / 100 * 100) / 100
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Opportunity Pipeline</h4>
          <p className="text-secondary small mb-0">Track enterprise sales stages, deal valuations, and probability-weighted pipeline forecasts.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-briefcase"></i>
          <span>Add Opportunity</span>
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
                placeholder="Search deal name, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Pipeline Stages</option>
              <option value="Qualification">Qualification</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
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
              <option value="Open">Open Deals</option>
              <option value="Won">Closed Won</option>
              <option value="Lost">Closed Lost</option>
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

      {/* Opportunities Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold small text-dark">
            Sales Pipeline ({total} total {total === 1 ? 'deal' : 'deals'})
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching deal pipeline records..." />
          ) : opportunities.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-briefcase fs-1 d-block mb-2 text-secondary"></i>
              <h6>No opportunities currently in this view</h6>
              <p className="small mb-3">Add a new prospective deal or modify filtering options.</p>
              <button className="btn btn-sm btn-outline-primary" onClick={openCreateModal}>
                + Add Opportunity
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table crm-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Opportunity Name</th>
                    <th>Customer Account</th>
                    <th>Deal Amount</th>
                    <th>Probability</th>
                    <th>Weighted Value</th>
                    <th>Stage</th>
                    <th>Status</th>
                    <th>Expected Close</th>
                    <th>Assigned To</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr key={opp.OpportunityId}>
                      <td>
                        <div className="fw-semibold text-dark">{opp.OpportunityName}</div>
                      </td>
                      <td>
                        <span className="small text-secondary">{opp.customer?.CustomerName || 'Unassigned Customer'}</span>
                      </td>
                      <td className="fw-bold text-dark">{formatCurrency(opp.Amount)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', width: '50px' }}>
                            <div
                              className={`progress-bar ${opp.Probability >= 70 ? 'bg-success' : opp.Probability >= 40 ? 'bg-primary' : 'bg-warning'}`}
                              role="progressbar"
                              style={{ width: `${opp.Probability}%` }}
                            ></div>
                          </div>
                          <span className="small text-muted">{opp.Probability}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">
                          {formatCurrency(opp.weightedValue || 0)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={opp.Stage} />
                      </td>
                      <td>
                        <StatusBadge status={opp.Status} />
                      </td>
                      <td className="small text-secondary">{formatDate(opp.ExpectedCloseDate)}</td>
                      <td className="small text-muted">{opp.assignedUser?.Name || '-'}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-light" onClick={() => openEditModal(opp)} title="Edit Deal">
                            <i className="bi bi-pencil text-secondary"></i>
                          </button>
                          <button
                            className="btn btn-light"
                            onClick={() => setDeleteDialog({ isOpen: true, oppId: opp.OpportunityId, name: opp.OpportunityName })}
                            title="Delete Deal"
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Deal' : 'Add Opportunity'} size="lg">
        <form onSubmit={handleSaveOpportunity} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Opportunity Name *</label>
            <input
              type="text"
              name="opportunityName"
              className={`form-control ${formErrors.opportunityName ? 'is-invalid' : ''}`}
              placeholder="e.g. Acme Corp Enterprise Modernization"
              value={formData.opportunityName}
              onChange={handleFormChange}
            />
            {formErrors.opportunityName && <div className="invalid-feedback">{formErrors.opportunityName}</div>}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Associated Customer Account</label>
              <select name="customerId" className="form-select" value={formData.customerId} onChange={handleFormChange}>
                <option value="">Select Customer (Optional)</option>
                {customers.map((c) => (
                  <option key={c.CustomerId} value={c.CustomerId}>
                    {c.CustomerName} ({c.CustomerCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Pipeline Stage *</label>
              <select name="stage" className="form-select" value={formData.stage} onChange={handleFormChange}>
                <option value="Qualification">Qualification</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won (Closed Won)</option>
                <option value="Lost">Lost (Closed Lost)</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Opportunity Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                name="amount"
                className={`form-control ${formErrors.amount ? 'is-invalid' : ''}`}
                placeholder="Must be > 0"
                value={formData.amount}
                onChange={handleFormChange}
              />
              {formErrors.amount && <div className="invalid-feedback">{formErrors.amount}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Probability (0 - 100%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                name="probability"
                className={`form-control ${formErrors.probability ? 'is-invalid' : ''}`}
                value={formData.probability}
                onChange={handleFormChange}
              />
              {formErrors.probability && <div className="invalid-feedback">{formErrors.probability}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Expected Close Date *</label>
              <input
                type="date"
                name="expectedCloseDate"
                className={`form-control ${formErrors.expectedCloseDate ? 'is-invalid' : ''}`}
                value={formData.expectedCloseDate}
                onChange={handleFormChange}
              />
              {formErrors.expectedCloseDate && <div className="invalid-feedback">{formErrors.expectedCloseDate}</div>}
            </div>
          </div>

          {/* Weighted Pipeline Indicator Box */}
          <div className="p-3 bg-light rounded mb-3 d-flex justify-content-between align-items-center">
            <div>
              <span className="small text-muted d-block">Formula: Amount &times; Probability / 100</span>
              <strong className="text-dark small">Derived Weighted Pipeline Forecast:</strong>
            </div>
            <div className="fs-5 fw-bold text-primary">{formatCurrency(liveWeighted)}</div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Deal Notes & Scope</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              placeholder="Commercial terms, competitor landscape, next steps..."
              value={formData.notes}
              onChange={handleFormChange}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : isEditing ? 'Save Deal' : 'Add Opportunity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, oppId: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Opportunity"
        message={`Are you sure you want to remove "${deleteDialog.name}" from the active sales pipeline?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
