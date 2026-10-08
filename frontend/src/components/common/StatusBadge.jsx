import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge bg-light text-secondary">-</span>;

  let bgClass = 'bg-light text-secondary';
  switch (status.toLowerCase()) {
    case 'active':
    case 'won':
    case 'converted':
    case 'completed':
      bgClass = 'bg-success-subtle text-success border border-success-subtle';
      break;
    case 'qualified':
    case 'negotiation':
    case 'in progress':
      bgClass = 'bg-primary-subtle text-primary border border-primary-subtle';
      break;
    case 'contacted':
    case 'proposal':
    case 'planned':
    case 'medium':
      bgClass = 'bg-info-subtle text-info border border-info-subtle';
      break;
    case 'new':
      bgClass = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      break;
    case 'high':
    case 'lost':
    case 'inactive':
    case 'unqualified':
    case 'cancelled':
    case 'missed':
      bgClass = 'bg-danger-subtle text-danger border border-danger-subtle';
      break;
    default:
      bgClass = 'bg-light text-dark';
  }

  return (
    <span className={`badge rounded-pill fw-semibold px-2 py-1 ${bgClass}`} style={{ fontSize: '0.75rem' }}>
      {status}
    </span>
  );
}
