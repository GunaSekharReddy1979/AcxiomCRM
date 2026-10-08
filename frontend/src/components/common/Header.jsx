import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const getRoleBadgeClass = () => {
    switch (user?.roleName) {
      case 'Admin': return 'badge-role-admin';
      case 'Manager': return 'badge-role-manager';
      default: return 'badge-role-sales';
    }
  };

  return (
    <header className="crm-header">
      <div className="d-flex align-items-center" style={{ width: '380px' }}>
        <form onSubmit={handleSearchSubmit} className="w-100 position-relative">
          <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
          <input
            type="text"
            className="form-control form-control-sm ps-5 bg-light border-0"
            placeholder="Global search leads, customers, deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ borderRadius: '20px', height: '36px' }}
          />
        </form>
      </div>

      <div className="d-flex align-items-center gap-3">
        <button onClick={() => navigate('/leads')} className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1">
          <i className="bi bi-plus-lg"></i>
          <span>Add Lead</span>
        </button>

        <div className="position-relative">
          <button type="button" className="btn btn-light rounded-circle p-2 position-relative" onClick={() => setShowNotifications(!showNotifications)} style={{ width: '38px', height: '38px' }}>
            <i className="bi bi-bell text-secondary"></i>
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '8px', height: '8px' }}></span>
          </button>
          {showNotifications && (
            <div className="position-absolute end-0 mt-2 card shadow-lg p-2" style={{ width: '280px', zIndex: 1050 }}>
              <div className="card-header bg-transparent border-0 px-2 py-1 fw-bold small">System Status</div>
              <div className="p-2 small text-muted">All CRM microservices operational. Server-side RBAC enforced.</div>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 ps-2 border-start">
          <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="d-none d-md-block text-start">
            <div className="fw-bold text-dark small">{user?.name}</div>
            <span className={`badge badge-role ${getRoleBadgeClass()}`}>{user?.roleName}</span>
          </div>
          <button onClick={logout} className="btn btn-sm btn-light text-secondary ms-2 p-1" title="Logout">
            <i className="bi bi-box-arrow-right fs-6"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
