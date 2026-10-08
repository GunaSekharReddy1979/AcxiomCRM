import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { validateOpportunityAmount } from '../../utils/validators';

export default function ConvertLeadModal({ isOpen, onClose, lead, onConversionSuccess }) {
  if (!lead) return null;

  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [formData, setFormData] = useState({
    customerName: lead.LeadName || '',
    companyName: lead.CompanyName || '',
    address: '',
    city: '',
    state: '',
    opportunityName: `${lead.LeadName} - Deal`,
    opportunityAmount: lead.ExpectedValue || 50000,
    stage: 'Qualification',
    probability: 35,
    expectedCloseDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })()
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required.';
    if (createOpportunity) {
      if (!formData.opportunityName.trim()) newErrors.opportunityName = 'Opportunity name is required.';
      const amountErr = validateOpportunityAmount(formData.opportunityAmount);
      if (amountErr) newErrors.opportunityAmount = amountErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/leads/${lead.LeadId}/convert`, {
        customerName: formData.customerName,
        companyName: formData.companyName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        createOpportunity,
        opportunityName: formData.opportunityName,
        opportunityAmount: formData.opportunityAmount,
        stage: formData.stage,
        probability: formData.probability,
        expectedCloseDate: formData.expectedCloseDate
      });

      showToast('Lead successfully qualified and converted!', 'success');
      onConversionSuccess(res.data.data);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to convert lead.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Convert Lead: ${lead.LeadName}`} size="lg">
      <form onSubmit={handleConvert} noValidate>
        <div className="alert alert-info py-2 px-3 small mb-3">
          Promote this lead to a registered Customer Account and active pipeline Deal.
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label small fw-semibold text-secondary">Account Name *</label>
            <input type="text" name="customerName" className="form-control" value={formData.customerName} onChange={handleChange} />
            {errors.customerName && <div className="text-danger small">{errors.customerName}</div>}
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold text-secondary">Company Name</label>
            <input type="text" name="companyName" className="form-control" value={formData.companyName} onChange={handleChange} />
          </div>
        </div>

        <div className="form-check form-switch mb-3 p-3 bg-light rounded">
          <input className="form-check-input ms-0 me-2" type="checkbox" id="cOpp" checked={createOpportunity} onChange={(e) => setCreateOpportunity(e.target.checked)} />
          <label className="form-check-label fw-bold small" htmlFor="cOpp">Create active Sales Opportunity Deal</label>
        </div>

        {createOpportunity && (
          <div className="p-3 border rounded mb-3">
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Opportunity Name *</label>
              <input type="text" name="opportunityName" className="form-control" value={formData.opportunityName} onChange={handleChange} />
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Amount ($) *</label>
                <input type="number" step="0.01" min="1" name="opportunityAmount" className="form-control" value={formData.opportunityAmount} onChange={handleChange} />
                {errors.opportunityAmount && <div className="text-danger small">{errors.opportunityAmount}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Probability (%)</label>
                <input type="number" min="0" max="100" name="probability" className="form-control" value={formData.probability} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary">Close Date</label>
                <input type="date" name="expectedCloseDate" className="form-control" value={formData.expectedCloseDate} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-success px-4" disabled={loading}>
            {loading ? 'Converting...' : 'Convert Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
