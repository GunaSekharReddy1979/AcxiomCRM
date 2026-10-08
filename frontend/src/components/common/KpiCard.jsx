import React from 'react';

export default function KpiCard({ title, value, icon, color = 'primary', subtext = null }) {
  const colorMap = {
    primary: { bg: '#eff6ff', text: '#2563eb' },
    success: { bg: '#ecfdf5', text: '#059669' },
    warning: { bg: '#fffbeb', text: '#d97706' },
    danger: { bg: '#fef2f2', text: '#dc2626' },
    info: { bg: '#f0f9ff', text: '#0284c7' },
    indigo: { bg: '#eef2ff', text: '#4f46e5' },
    purple: { bg: '#faf5ff', text: '#9333ea' }
  };
  const theme = colorMap[color] || colorMap.primary;

  return (
    <div className="card h-100 shadow-sm border-0 p-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-secondary small fw-semibold text-uppercase">{title}</span>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{ width: '40px', height: '40px', backgroundColor: theme.bg, color: theme.text }}
        >
          <i className={`bi ${icon} fs-5`}></i>
        </div>
      </div>
      <div className="fs-3 fw-bold text-dark mb-1">{value}</div>
      {subtext && <div className="text-muted small">{subtext}</div>}
    </div>
  );
}
