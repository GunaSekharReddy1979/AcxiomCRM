import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'table'
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    activityType: 'Call',
    subject: '',
    description: '',
    status: 'Completed',
    customerId: '',
    leadId: ''
  });
  const [formErr, setFormErr] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      const res = await api.get(`/activities?${params}`);
      setActivities(res.data.data.activities);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch activities.', 'danger');
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
    fetchActivities();
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const openCreateModal = () => {
    setFormData({
      activityType: 'Call',
      subject: '',
      description: '',
      status: 'Completed',
      customerId: '',
      leadId: ''
    });
    setFormErr('');
    setIsModalOpen(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setFormErr('Activity subject is required.');
      return;
    }

    try {
      setModalLoading(true);
      await api.post('/activities', {
        activityType: formData.activityType,
        subject: formData.subject,
        description: formData.description,
        status: formData.status,
        customerId: formData.customerId ? parseInt(formData.customerId, 10) : null,
        leadId: formData.leadId ? parseInt(formData.leadId, 10) : null
      });

      showToast('Activity recorded successfully.', 'success');
      setIsModalOpen(false);
      fetchActivities();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to record activity.');
    } finally {
      setModalLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call':
        return 'bi-telephone-fill text-success';
      case 'Meeting':
        return 'bi-people-fill text-primary';
      case 'Email':
        return 'bi-envelope-fill text-info';
      case 'Task':
        return 'bi-check2-square text-warning';
      default:
        return 'bi-circle-fill text-secondary';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Activity Tracking</h4>
          <p className="text-secondary small mb-0">Record and review customer and prospect touchpoints across phone calls, meetings, emails, and tasks.</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('timeline')}
            >
              <i className="bi bi-list-nested me-1"></i> Timeline
            </button>
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('table')}
            >
              <i className="bi bi-table me-1"></i> Table View
            </button>
          </div>
          <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={openCreateModal}>
            <i className="bi bi-plus-lg"></i>
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Activity Types</option>
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Email">Email</option>
              <option value="Task">Task</option>
            </select>
          </div>

          <div className="col-md-5">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => { setTypeFilter(''); setStatusFilter(''); setPage(1); }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner text="Fetching recorded touchpoints..." />
      ) : activities.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center text-muted">
          <i className="bi bi-clock-history fs-1 d-block mb-2 text-secondary"></i>
          <h6>No sales activities logged</h6>
          <p className="small mb-3">Record client touchpoints, sales meetings, or outbound email summaries.</p>
          <button className="btn btn-sm btn-outline-primary d-inline-block mx-auto" onClick={openCreateModal}>
            + Log Activity
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="card shadow-sm border-0 p-4">
          <div className="position-relative">
            {activities.map((a, idx) => (
              <div key={a.ActivityId} className="d-flex mb-4 pb-2 position-relative">
                {/* Timeline vertical bar */}
                {idx !== activities.length - 1 && (
                  <div
                    className="position-absolute bg-light border-start border-2"
                    style={{ left: '19px', top: '38px', bottom: '-16px', zIndex: 1 }}
                  ></div>
                )}
                <div
                  className="rounded-circle bg-white shadow-sm border border-2 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{ width: '40px', height: '40px', zIndex: 2 }}
                >
                  <i className={`bi ${getTypeIcon(a.ActivityType)} fs-5`}></i>
                </div>
                <div className="flex-grow-1 card p-3 border-0 bg-light">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-1">
                    <h6 className="fw-bold text-dark mb-0">{a.Subject}</h6>
                    <span className="small text-muted">{formatDateTime(a.ActivityDate)}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-white text-dark border small">{a.ActivityType}</span>
                    <StatusBadge status={a.Status} />
                    <span className="small text-secondary">
                      &bull; By {a.assignedUser?.Name || 'User'}
                    </span>
                    {a.customer && (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        Customer: {a.customer.CustomerName}
                      </span>
                    )}
                    {a.lead && (
                      <span className="badge bg-info-subtle text-info border border-info-subtle">
                        Lead: {a.lead.LeadName}
                      </span>
                    )}
                  </div>
                  {a.Description && <p className="text-secondary small mb-0">{a.Description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table crm-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Entity</th>
                  <th>Status</th>
                  <th>Rep</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.ActivityId}>
                    <td>
                      <div className="fw-semibold text-dark">{a.Subject}</div>
                      {a.Description && (
                        <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                          {a.Description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{a.ActivityType}</span>
                    </td>
                    <td className="small text-secondary">
                      {a.customer ? `Customer: ${a.customer.CustomerName}` : a.lead ? `Lead: ${a.lead.LeadName}` : '-'}
                    </td>
                    <td>
                      <StatusBadge status={a.Status} />
                    </td>
                    <td className="small text-muted">{a.assignedUser?.Name || '-'}</td>
                    <td className="small text-nowrap">{formatDateTime(a.ActivityDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="small text-muted">Page {page} of {totalPages}</span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Customer / Lead Activity" size="lg">
        <form onSubmit={handleSaveActivity} noValidate>
          {formErr && <div className="alert alert-danger py-2 px-3 small mb-3">{formErr}</div>}

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Activity Type *</label>
              <select
                className="form-select"
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
              >
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Subject *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Discussed cloud pricing tiers"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Related Customer (Optional)</label>
              <select
                className="form-select"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value, leadId: '' })}
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
              <label className="form-label small fw-semibold text-secondary">Related Lead (Optional)</label>
              <select
                className="form-select"
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value, customerId: '' })}
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
            <label className="form-label small fw-semibold text-secondary">Description & Notes</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Meeting minutes, email contents, action items..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Record Activity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
