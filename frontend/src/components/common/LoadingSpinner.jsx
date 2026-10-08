import React from 'react';

export default function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-muted">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="small fw-semibold">{text}</span>
    </div>
  );
}
