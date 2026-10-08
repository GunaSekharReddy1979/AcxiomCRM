import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (e_val, p_val) => {
    setEmail(e_val);
    setPassword(p_val);
    setErrorMessage('');
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light py-5 px-3">
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 mb-3 shadow-sm" style={{ width: '52px', height: '52px' }}>
            <i className="bi bi-diagram-3-fill fs-3 text-info"></i>
          </div>
          <h2 className="fw-bold text-dark tracking-tight mb-1">AcxiomCRM</h2>
          <p className="text-secondary small">Enterprise Customer Relationship Management Platform</p>
        </div>

        <div className="card shadow-sm border-0 p-4 mb-4">
          <h5 className="fw-bold text-dark mb-3">Sign in to your account</h5>
          {errorMessage && <div className="alert alert-danger py-2 px-3 small mb-3">{errorMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Work Email</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-3 pt-3 border-top">
            <span className="text-muted small">Need an account? </span>
            <Link to="/register" className="small fw-semibold text-primary text-decoration-none">Register new user</Link>
          </div>
        </div>

        <div className="card shadow-sm border-0 p-3 bg-white">
          <div className="text-uppercase text-secondary fw-bold small mb-2 text-center" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-person-badge me-1"></i> Quick Demo Roles
          </div>
          <div className="d-grid gap-2">
            <button type="button" className="btn btn-sm btn-outline-danger text-start d-flex justify-content-between align-items-center py-2" onClick={() => handleQuick('admin@acxiomcrm.com', 'Admin@123')}>
              <div><span className="fw-bold d-block">Admin (Alexander Vance)</span><span className="small text-muted">Full administrative access</span></div>
              <span className="badge bg-danger">Admin</span>
            </button>
            <button type="button" className="btn btn-sm btn-outline-warning text-dark text-start d-flex justify-content-between align-items-center py-2" onClick={() => handleQuick('manager@acxiomcrm.com', 'Manager@123')}>
              <div><span className="fw-bold d-block">Manager (Sarah Jenkins)</span><span className="small text-muted">Team supervision & reports</span></div>
              <span className="badge bg-warning text-dark">Manager</span>
            </button>
            <button type="button" className="btn btn-sm btn-outline-info text-dark text-start d-flex justify-content-between align-items-center py-2" onClick={() => handleQuick('sales@acxiomcrm.com', 'Sales@123')}>
              <div><span className="fw-bold d-block">Sales Executive (Marcus Sterling)</span><span className="small text-muted">Territory assigned scope</span></div>
              <span className="badge bg-info text-dark">Sales Rep</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
