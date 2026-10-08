import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export default function ReportsPage() {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = '';
      if (activeTab === 'customer') url = `/reports/customer?status=${statusFilter}&city=${cityFilter}`;
      else if (activeTab === 'lead') url = `/reports/lead?status=${statusFilter}`;
      else if (activeTab === 'followup') url = `/reports/followup?status=${statusFilter}`;
      else if (activeTab === 'opportunity') url = `/reports/opportunity?status=${statusFilter}`;
      else if (activeTab === 'pipeline') url = `/reports/pipeline`;
      else if (activeTab === 'conversion') url = `/reports/conversion`;
      else if (activeTab === 'user-activity') url = `/reports/user-activity`;
      else if (activeTab === 'audit') url = `/reports/audit`;

      const res = await api.get(url);
      setData(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load report data.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, statusFilter, cityFilter]);

  const exportToCSV = (filename, rows) => {
    if (!rows || rows.length === 0) {
      showToast('No data available to export.', 'warning');
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = typeof cell === 'object' ? JSON.stringify(cell).replace(/"/g, '""') : cell.toString().replace(/"/g, '""');
              return `"${cell}"`;
            })
            .join(separator)
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV exported successfully.', 'success');
  };

  return (
    <div>
      {/* Page Title */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">CRM Analytics & Reports</h4>
          <p className="text-secondary small mb-0">Role-governed operational summaries, conversion analytics, and audit extracts.</p>
        </div>
        <button
          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
          onClick={() => {
            const raw = Array.isArray(data) ? data : data?.opportunities || data?.auditLogs || [];
            exportToCSV(`acxiomcrm_${activeTab}_report`, raw);
          }}
        >
          <i className="bi bi-file-earmark-excel"></i>
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills bg-white p-2 rounded-3 shadow-sm border mb-4 flex-wrap">
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'pipeline' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <i className="bi bi-funnel-fill me-1"></i> Pipeline Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'conversion' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('conversion')}
          >
            <i className="bi bi-graph-up-arrow me-1"></i> Conversion Rates
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'customer' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('customer')}
          >
            <i className="bi bi-buildings me-1"></i> Customer Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'lead' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('lead')}
          >
            <i className="bi bi-person-lines-fill me-1"></i> Lead Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'opportunity' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('opportunity')}
          >
            <i className="bi bi-briefcase me-1"></i> Opportunity Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'followup' ? 'active' : 'text-secondary'}`}
            onClick={() => setActiveTab('followup')}
          >
            <i className="bi bi-calendar-check me-1"></i> Follow-Up Report
          </button>
        </li>

        {(hasRole('Admin') || hasRole('Manager')) && (
          <>
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'user-activity' ? 'active' : 'text-secondary'}`}
                onClick={() => setActiveTab('user-activity')}
              >
                <i className="bi bi-people me-1"></i> User Activity
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-2 px-3 small fw-semibold ${activeTab === 'audit' ? 'active' : 'text-secondary'}`}
                onClick={() => setActiveTab('audit')}
              >
                <i className="bi bi-shield-check me-1"></i> Audit Report
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Report Content */}
      {loading ? (
        <LoadingSpinner text="Computing analytics report..." />
      ) : (
        <div>
          {/* TAB 1: Pipeline Report */}
          {activeTab === 'pipeline' && data && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-lg-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-white py-3 border-0">
                      <h6 className="fw-bold text-dark mb-0">Stage-Wise Pipeline Breakdown</h6>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table crm-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Stage</th>
                              <th>Open Deals</th>
                              <th>Total Amount</th>
                              <th>Weighted Pipeline</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(data.stageSummary || {}).map(([stage, sum]) => (
                              <tr key={stage}>
                                <td>
                                  <StatusBadge status={stage} />
                                </td>
                                <td>{sum.count}</td>
                                <td className="fw-semibold text-dark">{formatCurrency(sum.totalAmount)}</td>
                                <td className="fw-bold text-primary">{formatCurrency(sum.weightedAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-white py-3 border-0">
                      <h6 className="fw-bold text-dark mb-0">Owner-Wise Pipeline Performance</h6>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table crm-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Sales Rep</th>
                              <th>Deals</th>
                              <th>Pipeline Amount</th>
                              <th>Weighted Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(data.ownerSummary || {}).map(([owner, sum]) => (
                              <tr key={owner}>
                                <td className="fw-semibold text-dark">{owner}</td>
                                <td>{sum.count}</td>
                                <td className="fw-semibold">{formatCurrency(sum.totalAmount)}</td>
                                <td className="fw-bold text-primary">{formatCurrency(sum.weightedAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Conversion Report */}
          {activeTab === 'conversion' && data && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 p-4">
                  <h6 className="fw-bold text-dark mb-3">Lead Qualification & Conversion</h6>
                  <div className="display-5 fw-bold text-success mb-2">{data.leads?.conversionRate}%</div>
                  <p className="text-secondary small mb-4">Total lead-to-customer conversion efficiency</p>
                  <ul className="list-group list-group-flush small">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Total Leads Captured</span>
                      <span className="fw-bold text-dark">{data.leads?.total}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Converted into Customers</span>
                      <span className="fw-bold text-success">{data.leads?.converted}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Currently Open / In Progress</span>
                      <span className="fw-bold text-primary">{data.leads?.open}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Marked as Lost / Unqualified</span>
                      <span className="fw-bold text-danger">{data.leads?.lost}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card shadow-sm border-0 p-4">
                  <h6 className="fw-bold text-dark mb-3">Opportunity Win / Loss Ratio</h6>
                  <div className="display-5 fw-bold text-primary mb-2">{data.opportunities?.winRate}%</div>
                  <p className="text-secondary small mb-4">Deal closing success rate</p>
                  <ul className="list-group list-group-flush small">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Total Pipeline Deals</span>
                      <span className="fw-bold text-dark">{data.opportunities?.total}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Closed Won Deals</span>
                      <span className="fw-bold text-success">{data.opportunities?.won}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Active Pipeline Deals</span>
                      <span className="fw-bold text-primary">{data.opportunities?.open}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Closed Lost Deals</span>
                      <span className="fw-bold text-danger">{data.opportunities?.lost}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Customer Report */}
          {activeTab === 'customer' && Array.isArray(data) && (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table crm-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((c) => (
                      <tr key={c.CustomerId}>
                        <td className="font-monospace small text-primary">{c.CustomerCode}</td>
                        <td className="fw-semibold text-dark">{c.CustomerName}</td>
                        <td className="small">{c.Email}</td>
                        <td className="small">{c.Phone}</td>
                        <td>
                          <StatusBadge status={c.Status} />
                        </td>
                        <td className="small text-muted">{c.owner?.Name || '-'}</td>
                        <td className="small">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Lead Report */}
          {activeTab === 'lead' && Array.isArray(data) && (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table crm-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Lead Code</th>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Expected Value</th>
                      <th>Assigned Rep</th>
                      <th>Conversion Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((l) => (
                      <tr key={l.LeadId}>
                        <td className="font-monospace small text-primary">{l.LeadCode}</td>
                        <td className="fw-semibold text-dark">{l.LeadName}</td>
                        <td className="small text-secondary">{l.CompanyName || '-'}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{l.Source}</span>
                        </td>
                        <td>
                          <StatusBadge status={l.Status} />
                        </td>
                        <td className="fw-semibold text-dark">{formatCurrency(l.ExpectedValue)}</td>
                        <td className="small text-muted">{l.assignedUser?.Name || '-'}</td>
                        <td className="small text-success">{l.convertedCustomer?.CustomerName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Opportunity Report */}
          {activeTab === 'opportunity' && Array.isArray(data) && (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table crm-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Opportunity Name</th>
                      <th>Customer</th>
                      <th>Stage</th>
                      <th>Deal Amount</th>
                      <th>Probability</th>
                      <th>Weighted Value</th>
                      <th>Expected Close Date</th>
                      <th>Assigned Rep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((o) => (
                      <tr key={o.OpportunityId}>
                        <td className="fw-semibold text-dark">{o.OpportunityName}</td>
                        <td className="small text-secondary">{o.customer?.CustomerName || '-'}</td>
                        <td>
                          <StatusBadge status={o.Stage} />
                        </td>
                        <td className="fw-bold text-dark">{formatCurrency(o.Amount)}</td>
                        <td>{o.Probability}%</td>
                        <td className="badge bg-light text-dark border mt-2">{formatCurrency(o.weightedValue)}</td>
                        <td className="small">{formatDate(o.ExpectedCloseDate)}</td>
                        <td className="small text-muted">{o.assignedUser?.Name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Follow-Up Report */}
          {activeTab === 'followup' && Array.isArray(data) && (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table crm-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Follow-Up Date</th>
                      <th>Overdue Alert</th>
                      <th>Target Entity</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((f) => (
                      <tr key={f.FollowUpId}>
                        <td className="fw-semibold text-dark">{f.Subject}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{f.FollowUpType}</span>
                        </td>
                        <td>
                          <StatusBadge status={f.Status} />
                        </td>
                        <td className="small">{formatDateTime(f.FollowUpDate)}</td>
                        <td>
                          {f.isOverdue ? (
                            <span className="badge bg-danger">Overdue</span>
                          ) : (
                            <span className="badge bg-light text-muted">On Track</span>
                          )}
                        </td>
                        <td className="small text-secondary">
                          {f.customer ? f.customer.CustomerName : f.lead ? f.lead.LeadName : '-'}
                        </td>
                        <td className="small text-muted">{f.assignedUser?.Name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: User Activity Report (Admin/Manager) */}
          {activeTab === 'user-activity' && Array.isArray(data) && (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table crm-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Leads Managed</th>
                      <th>Deals Managed</th>
                      <th>Deals Won</th>
                      <th>Scheduled Follow-Ups</th>
                      <th>Recorded Activities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((u) => (
                      <tr key={u.userId}>
                        <td>
                          <div className="fw-semibold text-dark">{u.name}</div>
                          <div className="text-muted small">{u.email}</div>
                        </td>
                        <td className="small">{u.department || 'Sales'}</td>
                        <td>
                          <span className={`badge ${u.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="fw-semibold">{u.leadCount}</td>
                        <td className="fw-semibold">{u.opportunityCount}</td>
                        <td className="fw-bold text-success">{u.wonDealsCount}</td>
                        <td>{u.followUpCount}</td>
                        <td>{u.activityCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: Audit Report */}
          {activeTab === 'audit' && data?.auditLogs && (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table crm-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>User</th>
                      <th>Record ID</th>
                      <th>IP Address</th>
                      <th>Payload Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.auditLogs.map((log) => (
                      <tr key={log.AuditLogId}>
                        <td className="small text-nowrap">{formatDateTime(log.CreatedDate)}</td>
                        <td>
                          <span className="badge bg-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                            {log.Action}
                          </span>
                        </td>
                        <td className="small fw-semibold">{log.EntityName}</td>
                        <td className="small text-muted">{log.user ? log.user.Name : 'System / Anonymous'}</td>
                        <td className="small font-monospace">{log.RecordId || '-'}</td>
                        <td className="small font-monospace text-muted">{log.IpAddress || '127.0.0.1'}</td>
                        <td className="small text-truncate text-secondary" style={{ maxWidth: '300px' }}>
                          {log.NewValue || log.OldValue || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
