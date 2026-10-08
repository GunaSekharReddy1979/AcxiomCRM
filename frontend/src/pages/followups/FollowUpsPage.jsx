import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';
import { validateFollowUpDate } from '../../utils/validators';

export default function FollowUpsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [followUps, setFollowUps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filterMode, setFilterMode] = useState('all'); // all, upcoming, overdue
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Schedule Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: '',
    followUpDate: '',
    followUpType: 'Call',
    customerId: '',
    leadId: '',
    remarks: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);

  // Action Modals: Complete, Reschedule, Cancel
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'complete', 'reschedule', 'cancel'
    followUp: null
  });
  const [actionForm, setActionForm] = useState({ remarks: '', newDate: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(filterMode !== 'all' && { filterMode }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search })
      });
      const res = await api.get(`/followups?${params}`);
      setFollowUps(res.data.data.followUps);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch follow-ups.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/leads?limit=100')
      ]);
      setCustomers(cRes.data.data.customers || []);
      setLeads(lRes.data.data.leads || []);
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [page, filterMode, statusFilter, typeFilter]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFollowUps();
  };

  const openCreateModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    setCreateForm({
      subject: '',
      followUpDate: tomorrow.toISOString().slice(0, 16),
      followUpType: 'Call',
      customerId: '',
      leadId: '',
      remarks: ''
    });
    setCreateErrors({});
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!createForm.subject.trim()) {
      errors.subject = 'Subject is required.';
    }

    const dateErr = validateFollowUpDate(createForm.followUpDate);
    if (dateErr) errors.followUpDate = dateErr;

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    try {
      setCreateLoading(true);
      await api.post('/followups', {
        subject: createForm.subject,
        followUpDate: createForm.followUpDate,
        followUpType: createForm.followUpType,
        customerId: createForm.customerId ? parseInt(createForm.customerId, 10) : null,
        leadId: createForm.leadId ? parseInt(createForm.leadId, 10) : null,
        remarks: createForm.remarks
      });
      showToast('Follow-up scheduled successfully.', 'success');
      setIsCreateOpen(false);
      fetchFollowUps();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule follow-up.', 'danger');
    } finally {
      setCreateLoading(false);
    }
  };

  const openAction = (type, f) => {
    setActionModal({ isOpen: true, type, followUp: f });
    setActionError('');
    if (type === 'reschedule') {
      const future = new Date();
      future.setDate(future.getDate() + 2);
      setActionForm({ remarks: '', newDate: future.toISOString().slice(0, 16) });
    } else {
      setActionForm({ remarks: '', newDate: '' });
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    const id = actionModal.followUp?.FollowUpId;

    try {
      setActionLoading(true);
      if (actionModal.type === 'complete') {
        await api.post(`/followups/${id}/complete`, { remarks: actionForm.remarks });
        showToast('Follow-up marked as Completed.', 'success');
      } else if (actionModal.type === 'reschedule') {
        const dateErr = validateFollowUpDate(actionForm.newDate);
        if (dateErr) {
          setActionError(dateErr);
          setActionLoading(false);
          return;
        }
        await api.post(`/followups/${id}/reschedule`, { newDate: actionForm.newDate, remarks: actionForm.remarks });
        showToast('Follow-up rescheduled successfully.', 'success');
      } else if (actionModal.type === 'cancel') {
        await api.post(`/followups/${id}/cancel`, { remarks: actionForm.remarks });
        showToast('Follow-up cancelled.', 'info');
      }

      setActionModal({ isOpen: false, type: null, followUp: null });
      fetchFollowUps();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action execution failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const now = new Date();

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Follow-Up Management</h4>
          <p className="text-secondary small mb-0">Schedule customer touches, prevent overdue commitments, and record engagement outcomes.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <i className="bi bi-calendar-plus"></i>
          <span>Schedule Follow-Up</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${filterMode === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => { setFilterMode('all'); setPage(1); }}
        >
          All Activities
        </button>
        <button
          className={`btn btn-sm ${filterMode === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => { setFilterMode('upcoming'); setPage(1); }}
        >
          <i className="bi bi-clock-history me-1"></i> Upcoming
        </button>
        <button
          className={`btn btn-sm ${filterMode === 'overdue' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => { setFilterMode('overdue'); setPage(1); }}
        >
          <i className="bi bi-exclamation-circle me-1"></i> Overdue Attention
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search subject or remarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-md-2">
            <select className="form-select form-select-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Email">Email</option>
              <option value="Task">Task</option>
            </select>
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary w-100">
              Filter
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setFilterMode('all'); setPage(1); }}
              title="Reset"
            >
              <i className="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold small text-dark">
            Engagement Schedule ({total} total)
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching schedule..." />
          ) : followUps.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-check fs-1 d-block mb-2 text-secondary"></i>
              <h6>No follow-ups recorded in this category</h6>
              <p className="small mb-3">Schedule a client touchpoint or change your filters.</p>
              <button className="btn btn-sm btn-outline-primary" onClick={openCreateModal}>
                + Schedule Follow-Up
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table crm-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Subject / Target Entity</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Remarks</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((f) => {
                    const isOverdue = f.Status === 'Planned' && new Date(f.FollowUpDate) < now;

                    return (
                      <tr key={f.FollowUpId} className={isOverdue ? 'table-danger-subtle' : ''}>
                        <td>
                          <div className="fw-semibold text-dark">{f.Subject}</div>
                          <div className="text-secondary small">
                            {f.customer ? (
                              <span>
                                <i className="bi bi-buildings me-1 text-primary"></i>Customer: {f.customer.CustomerName}
                              </span>
                            ) : f.lead ? (
                              <span>
                                <i className="bi bi-funnel me-1 text-info"></i>Lead: {f.lead.LeadName}
                              </span>
                            ) : (
                              'Direct follow-up'
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{f.FollowUpType}</span>
                        </td>
                        <td>
                          <div className="small fw-semibold">{formatDateTime(f.FollowUpDate)}</div>
                          {isOverdue && <span className="badge bg-danger text-white py-1">Overdue</span>}
                        </td>
                        <td>
                          <StatusBadge status={f.Status} />
                        </td>
                        <td className="small text-muted">{f.assignedUser?.Name || '-'}</td>
                        <td className="small text-secondary" style={{ maxWidth: '240px' }}>
                          <div className="text-truncate" title={f.Remarks || ''}>
                            {f.Remarks || '-'}
                          </div>
                        </td>
                        <td className="text-end">
                          {f.Status === 'Planned' ? (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success"
                                onClick={() => openAction('complete', f)}
                                title="Mark as Completed"
                              >
                                <i className="bi bi-check-lg"></i> Complete
                              </button>
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => openAction('reschedule', f)}
                                title="Reschedule Date"
                              >
                                <i className="bi bi-calendar-event"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => openAction('cancel', f)}
                                title="Cancel Follow-Up"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Finished</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Schedule Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Schedule New Follow-Up" size="lg">
        <form onSubmit={handleCreateSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Follow-Up Subject *</label>
            <input
              type="text"
              className={`form-control ${createErrors.subject ? 'is-invalid' : ''}`}
              placeholder="e.g. Call to discuss pricing approval"
              value={createForm.subject}
              onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
            />
            {createErrors.subject && <div className="invalid-feedback">{createErrors.subject}</div>}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Follow-Up Date & Time *</label>
              <input
                type="datetime-local"
                className={`form-control ${createErrors.followUpDate ? 'is-invalid' : ''}`}
                value={createForm.followUpDate}
                onChange={(e) => setCreateForm({ ...createForm, followUpDate: e.target.value })}
              />
              {createErrors.followUpDate && <div className="invalid-feedback">{createErrors.followUpDate}</div>}
              <div className="form-text small">Cannot be earlier than today.</div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Interaction Type</label>
              <select
                className="form-select"
                value={createForm.followUpType}
                onChange={(e) => setCreateForm({ ...createForm, followUpType: e.target.value })}
              >
                <option value="Call">Phone Call</option>
                <option value="Meeting">Video / In-Person Meeting</option>
                <option value="Email">Email Follow-Up</option>
                <option value="Task">Action Task</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Linked Customer (Optional)</label>
              <select
                className="form-select"
                value={createForm.customerId}
                onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value, leadId: '' })}
              >
                <option value="">None / Select Customer</option>
                {customers.map((c) => (
                  <option key={c.CustomerId} value={c.CustomerId}>
                    {c.CustomerName} ({c.CustomerCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Linked Lead (Optional)</label>
              <select
                className="form-select"
                value={createForm.leadId}
                onChange={(e) => setCreateForm({ ...createForm, leadId: e.target.value, customerId: '' })}
              >
                <option value="">None / Select Lead</option>
                {leads.map((l) => (
                  <option key={l.LeadId} value={l.LeadId}>
                    {l.LeadName} ({l.LeadCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Remarks & Agenda</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Context or talking points..."
              value={createForm.remarks}
              onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={createLoading}>
              {createLoading ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Dialog (Complete / Reschedule / Cancel) */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: null, followUp: null })}
        title={
          actionModal.type === 'complete'
            ? 'Complete Follow-Up'
            : actionModal.type === 'reschedule'
            ? 'Reschedule Follow-Up Date'
            : 'Cancel Follow-Up'
        }
      >
        <form onSubmit={handleActionSubmit} noValidate>
          <div className="mb-3">
            <strong className="d-block text-dark small mb-1">{actionModal.followUp?.Subject}</strong>
            <span className="text-secondary small">
              Originally scheduled for: {actionModal.followUp?.FollowUpDate && formatDateTime(actionModal.followUp.FollowUpDate)}
            </span>
          </div>

          {actionError && (
            <div className="alert alert-danger py-2 px-3 small mb-3">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {actionError}
            </div>
          )}

          {actionModal.type === 'reschedule' && (
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">New Follow-Up Date & Time *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={actionForm.newDate}
                onChange={(e) => setActionForm({ ...actionForm, newDate: e.target.value })}
                required
              />
              <div className="form-text small">Cannot be earlier than today.</div>
            </div>
          )}

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">
              {actionModal.type === 'complete'
                ? 'Outcome Summary / Notes'
                : actionModal.type === 'reschedule'
                ? 'Reason for Rescheduling'
                : 'Reason for Cancellation'}
            </label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Notes..."
              value={actionForm.remarks}
              onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              onClick={() => setActionModal({ isOpen: false, type: null, followUp: null })}
            >
              Close
            </button>
            <button
              type="submit"
              className={`btn ${
                actionModal.type === 'complete'
                  ? 'btn-success'
                  : actionModal.type === 'reschedule'
                  ? 'btn-primary'
                  : 'btn-danger'
              } px-4`}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
