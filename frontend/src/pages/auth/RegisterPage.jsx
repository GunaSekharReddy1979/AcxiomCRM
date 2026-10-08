import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Direct Sales',
    phone: '',
    roleId: 3
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await api.post('/auth/register', {
        ...formData,
        roleId: parseInt(formData.roleId, 10)
      });
      showToast('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light py-5 px-3">
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div className="card shadow-sm border-0 p-4 mb-4">
          <h4 className="fw-bold text-dark mb-3">Create CRM Account</h4>
          {error && <div className="alert alert-danger py-2 px-3 small mb-3">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Full Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Corporate Email</label>
              <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Phone</label>
                <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Role</label>
                <select className="form-select" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                  <option value={3}>Sales Executive</option>
                  <option value={2}>Manager</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password (Min 8 chars, uppercase, digit, special)</label>
              <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? 'Registering...' : 'Register Profile'}
            </button>
          </form>

          <div className="text-center mt-3 pt-3 border-top">
            <span className="text-muted small">Already registered? </span>
            <Link to="/login" className="small fw-semibold text-primary text-decoration-none">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
