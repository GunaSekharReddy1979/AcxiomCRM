import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatDateTime } from '../../utils/formatters';

export default function AuditLogPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(moduleFilter && { module: moduleFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const res = await api.get(`/audit-logs?${params}`);
      setLogs(res.data.data.auditLogs);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch audit records.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter, actionFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setModuleFilter('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatPayload = (str) => {
    if (!str) return 'None';
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return str;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold text-dark mb-0">System & Security Audit Log</h4>
            <span className="badge bg-secondary-subtle text-secondary border">
              <i className="bi bi-shield-check me-1"></i> Append-Only Traceability
            </span>
          </div>
          <p className="text-secondary small mb-0">Immutable compliance ledger capturing logins, entity mutations, workflow transitions, and security events.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <form onSubmit={handleFilterSubmit} className="row g-2 align-items-center">
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Entities / Modules</option>
              <option value="Auth">Auth & Security</option>
              <option value="Customer">Customer</option>
              <option value="Lead">Lead</option>
              <option value="Opportunity">Opportunity</option>
              <option value="FollowUp">Follow-Up</option>
              <option value="Activity">Activity</option>
              <option value="User">User Administration</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="LOCKOUT">LOCKOUT</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="ROLE_CHANGE">ROLE_CHANGE</option>
              <option value="LEAD_CONVERSION">LEAD_CONVERSION</option>
            </select>
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From Date"
            />
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To Date"
            />
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary w-100">
              Filter
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleReset} title="Reset">
              <i className="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </form>
      </div>

      {/* Log Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold small text-dark">
            Audit Records ({total} logged events)
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Retrieving audit records..." />
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h6>No audit events match specified parameters</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table crm-table align-middle mb-0 font-monospace small">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>User</th>
                    <th>Target ID</th>
                    <th>IP Address</th>
                    <th className="text-end">Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    let actionBadge = 'bg-secondary';
                    if (log.Action.includes('LOGIN')) actionBadge = log.Action === 'LOGIN' ? 'bg-success' : 'bg-danger';
                    else if (log.Action.includes('LOCKOUT')) actionBadge = 'bg-danger';
                    else if (log.Action === 'CREATE') actionBadge = 'bg-primary';
                    else if (log.Action === 'UPDATE' || log.Action === 'ROLE_CHANGE') actionBadge = 'bg-warning text-dark';
                    else if (log.Action === 'DELETE') actionBadge = 'bg-danger';
                    else if (log.Action === 'LEAD_CONVERSION') actionBadge = 'bg-info text-dark';

                    return (
                      <tr key={log.AuditLogId}>
                        <td className="text-nowrap">{formatDateTime(log.CreatedDate)}</td>
                        <td>
                          <span className={`badge ${actionBadge}`}>{log.Action}</span>
                        </td>
                        <td className="fw-semibold">{log.EntityName}</td>
                        <td className="text-dark">{log.user ? log.user.Name : 'System / Unauth'}</td>
                        <td>{log.RecordId ? `#${log.RecordId}` : '-'}</td>
                        <td className="text-muted">{log.IpAddress || '127.0.0.1'}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-xs btn-outline-primary py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => setSelectedLog(log)}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted font-sans">
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

      {/* Payload Inspector Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Event Payload Details" size="lg">
        {selectedLog && (
          <div>
            <div className="row g-2 mb-3 small bg-light p-3 rounded">
              <div className="col-sm-6">
                <strong>Event ID:</strong> {selectedLog.AuditLogId}
              </div>
              <div className="col-sm-6">
                <strong>Action:</strong> <span className="badge bg-dark">{selectedLog.Action}</span>
              </div>
              <div className="col-sm-6">
                <strong>Entity:</strong> {selectedLog.EntityName}
              </div>
              <div className="col-sm-6">
                <strong>Target Record ID:</strong> {selectedLog.RecordId || 'N/A'}
              </div>
              <div className="col-sm-6">
                <strong>User:</strong> {selectedLog.user ? `${selectedLog.user.Name} (${selectedLog.user.Email})` : 'System'}
              </div>
              <div className="col-sm-6">
                <strong>IP Address:</strong> {selectedLog.IpAddress}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="fw-bold small text-secondary mb-1">Previous State (OldValue):</label>
                <pre className="p-3 bg-light border rounded small overflow-auto" style={{ maxHeight: '250px' }}>
                  {formatPayload(selectedLog.OldValue)}
                </pre>
              </div>
              <div className="col-md-6">
                <label className="fw-bold small text-secondary mb-1">New State (NewValue):</label>
                <pre className="p-3 bg-light border rounded small overflow-auto" style={{ maxHeight: '250px' }}>
                  {formatPayload(selectedLog.NewValue)}
                </pre>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3 border-top pt-3">
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
