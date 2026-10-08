import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '680px' }}>
      <h4 className="fw-bold text-dark mb-1">User Profile</h4>
      <p className="text-secondary small mb-4">Account identity and role authorization scope.</p>

      <div className="card shadow-sm border-0 p-4 mb-4">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fs-3 fw-bold" style={{ width: '56px', height: '56px' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h5 className="fw-bold text-dark mb-0">{user?.name}</h5>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{user?.roleName}</span>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="small text-muted d-block">Corporate Email</label>
            <div className="fw-semibold text-dark">{user?.email}</div>
          </div>
          <div className="col-md-6">
            <label className="small text-muted d-block">Department</label>
            <div className="fw-semibold text-dark">{user?.department || 'Sales'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
