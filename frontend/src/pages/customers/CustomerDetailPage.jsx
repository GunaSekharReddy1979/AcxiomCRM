import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';
import { validateFollowUpDate } from '../../utils/validators';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick FollowUp Modal
  const [followUpModal, setFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    subject: '',
    followUpDate: '',
    followUpType: 'Call',
    remarks: ''
  });
  const [followUpErr, setFollowUpErr] = useState({});
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Quick Activity Modal
  const [activityModal, setActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activityType: 'Call',
    subject: '',
    description: '',
    status: 'Completed'
  });
  const [activityErr, setActivityErr] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load customer profile.', 'danger');
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/customers');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!followUpForm.subject.trim()) errs.subject = 'Subject is required.';
    const dateErr = validateFollowUpDate(followUpForm.followUpDate);
    if (dateErr) errs.followUpDate = dateErr;

    if (Object.keys(errs).length > 0) {
      setFollowUpErr(errs);
      return;
    }

    try {
      setFollowUpLoading(true);
      await api.post('/followups', {
        ...followUpForm,
        customerId: customer.CustomerId
      });
      showToast('Follow-up scheduled successfully.', 'success');
      setFollowUpModal(false);
      setFollowUpForm({ subject: '', followUpDate: '', followUpType: 'Call', remarks: '' });
      setFollowUpErr({});
      fetchCustomer();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error scheduling follow-up.', 'danger');
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.subject.trim()) {
      setActivityErr('Activity subject is required.');
      return;
    }

    try {
      setActivityLoading(true);
      await api.post('/activities', {
        ...activityForm,
        customerId: customer.CustomerId
      });
      showToast('Activity logged successfully.', 'success');
      setActivityModal(false);
      setActivityForm({ activityType: 'Call', subject: '', description: '', status: 'Completed' });
      setActivityErr('');
      fetchCustomer();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error logging activity.', 'danger');
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading && !customer) {
    return <LoadingSpinner text="Loading customer details and transaction history..." />;
  }

  if (!customer) return null;

  const opportunities = customer.opportunities || [];
  const followUps = customer.followUps || [];
  const activities = customer.activities || [];

  return (
    <div>
      {/* Top Breadcrumb & Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Link to="/customers" className="btn btn-sm btn-light border p-1" title="Back to Customers">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <h4 className="fw-bold text-dark mb-0">{customer.CustomerName}</h4>
            <span className="font-monospace small text-primary badge bg-primary-subtle border border-primary-subtle">
              {customer.CustomerCode}
            </span>
            <StatusBadge status={customer.Status} />
          </div>
          <p className="text-secondary small mb-0">{customer.CompanyName || 'Independent Client'} &bull; Managed by {customer.owner?.Name || 'System'}</p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => setFollowUpModal(true)}>
            <i className="bi bi-calendar-plus me-1"></i> Schedule Follow-Up
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setActivityModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> Log Activity
          </button>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="row g-4 mb-4">
        {/* Left Column: Account Summary */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-0">
              <h6 className="fw-bold text-dark mb-0">Account Information</h6>
            </div>
            <div className="card-body pt-0">
              <ul className="list-group list-group-flush small">
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Email</span>
                  <span className="fw-semibold text-dark">{customer.Email}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Phone</span>
                  <span className="fw-semibold text-dark">{customer.Phone}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Company</span>
                  <span className="fw-semibold text-dark">{customer.CompanyName || '-'}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">City / State</span>
                  <span className="fw-semibold text-dark">{customer.City ? `${customer.City}, ${customer.State || ''}` : '-'}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Address</span>
                  <span className="fw-semibold text-dark text-end">{customer.Address || '-'}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Account Owner</span>
                  <span className="fw-semibold text-dark">{customer.owner?.Name || '-'}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Created Date</span>
                  <span className="fw-semibold text-dark">{formatDate(customer.createdAt)}</span>
                </li>
              </ul>
              {customer.Notes && (
                <div className="mt-3 p-3 bg-light rounded small">
                  <span className="fw-bold d-block text-secondary mb-1">Notes:</span>
                  <div className="text-secondary">{customer.Notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Opportunities & Activities */}
        <div className="col-lg-8">
          {/* Opportunities Section */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0">Deals & Opportunities ({opportunities.length})</h6>
              <Link to="/opportunities" className="small text-primary text-decoration-none fw-semibold">
                + New Deal
              </Link>
            </div>
            <div className="card-body p-0">
              {opportunities.length === 0 ? (
                <div className="p-4 text-center text-muted small">No opportunities linked with this customer yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table crm-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Deal Name</th>
                        <th>Stage</th>
                        <th>Amount</th>
                        <th>Probability</th>
                        <th>Expected Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <tr key={opp.OpportunityId}>
                          <td>
                            <Link to={`/opportunities/${opp.OpportunityId}`} className="fw-semibold text-dark text-decoration-none">
                              {opp.OpportunityName}
                            </Link>
                          </td>
                          <td>
                            <StatusBadge status={opp.Stage} />
                          </td>
                          <td className="fw-semibold text-dark">{formatCurrency(opp.Amount)}</td>
                          <td>{opp.Probability}%</td>
                          <td className="small text-secondary">{formatDate(opp.ExpectedCloseDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Follow-Ups & History */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0">Follow-Ups & Engagement Timeline</h6>
            </div>
            <div className="card-body p-0">
              {followUps.length === 0 && activities.length === 0 ? (
                <div className="p-4 text-center text-muted small">No follow-ups or activities recorded yet.</div>
              ) : (
                <div className="p-3">
                  {/* Follow-ups */}
                  {followUps.map((f) => (
                    <div key={`fu-${f.FollowUpId}`} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                      <div className="rounded-circle bg-primary-subtle text-primary p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                        <i className="bi bi-calendar-check"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold small text-dark">{f.Subject}</span>
                          <StatusBadge status={f.Status} />
                        </div>
                        <div className="text-secondary small mb-1">{f.Remarks || 'No remarks added'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Scheduled for: {formatDateTime(f.FollowUpDate)} &bull; Type: {f.FollowUpType}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Activities */}
                  {activities.map((a) => (
                    <div key={`act-${a.ActivityId}`} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                      <div className="rounded-circle bg-info-subtle text-info p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                        <i className="bi bi-chat-dots"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold small text-dark">{a.Subject}</span>
                          <span className="badge bg-light text-secondary border">{a.ActivityType}</span>
                        </div>
                        <div className="text-secondary small mb-1">{a.Description || 'Activity logged'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Logged on: {formatDateTime(a.ActivityDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Follow-Up Modal */}
      <Modal isOpen={followUpModal} onClose={() => setFollowUpModal(false)} title="Schedule Follow-Up Activity">
        <form onSubmit={handleCreateFollowUp} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Subject / Objective *</label>
            <input
              type="text"
              className={`form-control ${followUpErr.subject ? 'is-invalid' : ''}`}
              placeholder="e.g. Discuss revised proposal terms"
              value={followUpForm.subject}
              onChange={(e) => setFollowUpForm({ ...followUpForm, subject: e.target.value })}
            />
            {followUpErr.subject && <div className="invalid-feedback">{followUpErr.subject}</div>}
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Follow-Up Date & Time *</label>
              <input
                type="datetime-local"
                className={`form-control ${followUpErr.followUpDate ? 'is-invalid' : ''}`}
                value={followUpForm.followUpDate}
                onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })}
              />
              {followUpErr.followUpDate && <div className="invalid-feedback">{followUpErr.followUpDate}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Activity Type</label>
              <select
                className="form-select"
                value={followUpForm.followUpType}
                onChange={(e) => setFollowUpForm({ ...followUpForm, followUpType: e.target.value })}
              >
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Remarks / Meeting Agenda</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Key discussion topics or preparation notes..."
              value={followUpForm.remarks}
              onChange={(e) => setFollowUpForm({ ...followUpForm, remarks: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setFollowUpModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={followUpLoading}>
              {followUpLoading ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Activity Modal */}
      <Modal isOpen={activityModal} onClose={() => setActivityModal(false)} title="Log Customer Activity">
        <form onSubmit={handleCreateActivity} noValidate>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Activity Type</label>
              <select
                className="form-select"
                value={activityForm.activityType}
                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
              >
                <option value="Call">Phone Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">Task Note</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Status</label>
              <select
                className="form-select"
                value={activityForm.status}
                onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
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
              className={`form-control ${activityErr ? 'is-invalid' : ''}`}
              placeholder="e.g. Product review call summary"
              value={activityForm.subject}
              onChange={(e) => {
                setActivityForm({ ...activityForm, subject: e.target.value });
                setActivityErr('');
              }}
            />
            {activityErr && <div className="invalid-feedback">{activityErr}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Detailed Notes</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Client responses, action items agreed, key takeaway..."
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setActivityModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={activityLoading}>
              {activityLoading ? 'Recording...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
