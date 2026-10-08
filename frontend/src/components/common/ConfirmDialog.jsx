import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-2">
        <i className={`bi ${confirmVariant === 'danger' ? 'bi-exclamation-triangle text-danger' : 'bi-question-circle text-primary'} display-5 mb-3 d-block`}></i>
        <p className="text-secondary mb-4">{message}</p>
        <div className="d-flex justify-content-center gap-2">
          <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className={`btn btn-${confirmVariant} px-4`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
