import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light text-center p-4">
      <div className="card shadow-sm border-0 p-5" style={{ maxWidth: '480px' }}>
        <h1 className="display-1 fw-bold text-primary mb-2">404</h1>
        <h4 className="fw-bold text-dark mb-2">Page Not Found</h4>
        <p className="text-secondary small mb-4">The requested CRM URL does not exist.</p>
        <Link to="/dashboard" className="btn btn-primary px-4">Return to Dashboard</Link>
      </div>
    </div>
  );
}
