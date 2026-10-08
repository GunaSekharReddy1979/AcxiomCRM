import React from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className={`modal-dialog modal-dialog-centered modal-${size}`}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-bold text-dark fs-6">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
