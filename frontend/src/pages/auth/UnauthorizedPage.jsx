import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light text-center p-4">
      <div className="card shadow-sm border-0 p-5" style={{ maxWidth: '480px' }}>
        <h3 className="fw-bold text-danger mb-2">403 - Access Denied</h3>
        <p className="text-secondary mb-4">
          Your current role (<strong className="text-dark">{user?.roleName || 'User'}</strong>) cannot access this resource.
        </p>
        <Link to="/dashboard" className="btn btn-primary px-4">Return to Dashboard</Link>
      </div>
    </div>
  );
}
