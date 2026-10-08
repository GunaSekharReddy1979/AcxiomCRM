import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, hasRole, logout } = useAuth();

  return (
    <aside className="crm-sidebar">
      <div className="crm-sidebar-brand">
        <i className="bi bi-diagram-3-fill"></i>
        <span>ACXIOM<span className="text-primary fw-light">CRM</span></span>
      </div>

      <div className="crm-sidebar-nav">
        <div className="crm-sidebar-section-title">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-grid-1x2"></i>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-buildings"></i>
          <span>Customers</span>
        </NavLink>
        <NavLink to="/leads" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-funnel"></i>
          <span>Leads</span>
        </NavLink>
        <NavLink to="/opportunities" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-briefcase"></i>
          <span>Opportunities</span>
        </NavLink>
        <NavLink to="/followups" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-calendar-check"></i>
          <span>Follow-Ups</span>
        </NavLink>
        <NavLink to="/activities" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-clock-history"></i>
          <span>Activities</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-bar-chart-line"></i>
          <span>Reports</span>
        </NavLink>

        {(hasRole('Admin') || hasRole('Manager')) && (
          <>
            <div className="crm-sidebar-section-title mt-3">Administration</div>
            {hasRole('Admin') && (
              <NavLink to="/users" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people"></i>
                <span>Users & Roles</span>
              </NavLink>
            )}
            <NavLink to="/audit-log" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
              <i className="bi bi-shield-check"></i>
              <span>Audit Log</span>
            </NavLink>
          </>
        )}

        <div className="crm-sidebar-section-title mt-3">Account</div>
        <NavLink to="/profile" className={({ isActive }) => `crm-nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-person-circle"></i>
          <span>Profile</span>
        </NavLink>
        <button onClick={logout} className="crm-nav-link btn btn-link text-start w-100 border-0" style={{ background: 'none' }}>
          <i className="bi bi-box-arrow-right text-danger"></i>
          <span className="text-danger">Logout</span>
        </button>
      </div>

      <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center">
        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2 fw-bold" style={{ width: '36px', height: '36px' }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="overflow-hidden">
          <div className="text-white small fw-bold text-truncate">{user?.name}</div>
          <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{user?.roleName}</div>
        </div>
      </div>
    </aside>
  );
}
