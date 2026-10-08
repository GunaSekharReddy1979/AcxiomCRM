import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import KpiCard from '../../components/common/KpiCard';
import LeadStatusChart from '../../components/charts/LeadStatusChart';
import PipelineChart from '../../components/charts/PipelineChart';
import MonthlySalesChart from '../../components/charts/MonthlySalesChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [data, setData] = useState(null);

  const fetchDashboard = async (filter) => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard?dateFilter=${filter}`);
      setData(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load dashboard.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(dateFilter);
  }, [dateFilter]);

  if (loading && !data) {
    return <LoadingSpinner text="Aggregating sales pipeline analytics..." />;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const upcomingFollowUps = data?.upcomingFollowUps || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold text-dark mb-0">Sales Dashboard</h4>
            <span className="badge bg-light text-secondary border">Scope: {user?.roleName}</span>
          </div>
          <p className="text-secondary small mb-0">Real-time overview of leads, accounts, and deal pipeline.</p>
        </div>

        <div className="btn-group btn-group-sm bg-white shadow-sm p-1 rounded-3 border" role="group">
          {['all', 'today', 'this_week', 'this_month'].map((f) => (
            <button
              key={f}
              type="button"
              className={`btn btn-sm ${dateFilter === f ? 'btn-primary' : 'btn-light border-0 text-secondary'}`}
              onClick={() => setDateFilter(f)}
            >
              {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'this_week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><KpiCard title="Total Customers" value={kpis.totalCustomers ?? 0} icon="bi-buildings" color="primary" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Total Leads" value={kpis.totalLeads ?? 0} icon="bi-funnel" color="info" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Open Leads" value={kpis.openLeads ?? 0} icon="bi-hourglass-split" color="warning" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Total Deals" value={kpis.totalOpportunities ?? 0} icon="bi-briefcase" color="purple" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Open Deals" value={kpis.openOpportunities ?? 0} icon="bi-activity" color="indigo" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Won Deals" value={kpis.wonOpportunities ?? 0} icon="bi-check-circle-fill" color="success" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Lost Deals" value={kpis.lostOpportunities ?? 0} icon="bi-x-circle-fill" color="danger" /></div>
        <div className="col-6 col-md-3"><KpiCard title="Pipeline Value" value={formatCurrency(kpis.totalPipelineValue || 0)} icon="bi-currency-dollar" color="success" subtext={`Weighted: ${formatCurrency(kpis.weightedPipelineValue || 0)}`} /></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0">Opportunity Pipeline Stages</h6>
              <Link to="/opportunities" className="small text-primary text-decoration-none fw-semibold">View Deals</Link>
            </div>
            <div className="card-body pt-1"><PipelineChart chartData={charts.pipelineStage} /></div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0">Lead Status</h6>
              <Link to="/leads" className="small text-primary text-decoration-none fw-semibold">Manage Leads</Link>
            </div>
            <div className="card-body pt-1 d-flex align-items-center justify-content-center"><LeadStatusChart chartData={charts.leadStatus} /></div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-0 py-3"><h6 className="fw-bold text-dark mb-0">Monthly Sales Revenue (Closed Won)</h6></div>
        <div className="card-body pt-1"><MonthlySalesChart chartData={charts.monthlySales} /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0"><i className="bi bi-calendar-event text-primary me-2"></i>Upcoming Follow-Ups</h6>
              <Link to="/followups" className="small text-primary text-decoration-none fw-semibold">View All</Link>
            </div>
            <div className="card-body p-0">
              {upcomingFollowUps.length === 0 ? (
                <div className="p-4 text-center text-muted small">No upcoming follow-ups scheduled.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table crm-table align-middle mb-0">
                    <thead><tr><th>Subject</th><th>Type</th><th>Date</th></tr></thead>
                    <tbody>
                      {upcomingFollowUps.map((f) => (
                        <tr key={f.FollowUpId}>
                          <td><div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }}>{f.Subject}</div></td>
                          <td><span className="badge bg-light text-dark border">{f.FollowUpType}</span></td>
                          <td className="small text-nowrap">{formatDateTime(f.FollowUpDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history text-info me-2"></i>Recent Activities</h6>
              <Link to="/activities" className="small text-primary text-decoration-none fw-semibold">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentActivities.length === 0 ? (
                <div className="p-4 text-center text-muted small">No recent activities logged yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table crm-table align-middle mb-0">
                    <thead><tr><th>Subject</th><th>Type</th><th>Date</th></tr></thead>
                    <tbody>
                      {recentActivities.map((a) => (
                        <tr key={a.ActivityId}>
                          <td><div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }}>{a.Subject}</div></td>
                          <td><span className="badge bg-light text-dark border">{a.ActivityType}</span></td>
                          <td className="small text-nowrap">{formatDateTime(a.ActivityDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
