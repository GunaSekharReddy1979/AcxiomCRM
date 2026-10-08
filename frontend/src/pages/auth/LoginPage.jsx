import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both work email and password.');
      return;
    }
    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light py-5 px-3">
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 mb-3 shadow-sm"
            style={{ width: '56px', height: '56px' }}
          >
            <i className="bi bi-diagram-3-fill fs-2 text-info"></i>
          </div>
          <h2 className="fw-bold text-dark tracking-tight mb-1">AcxiomCRM</h2>
          <p className="text-secondary small mb-0">Enterprise Customer Relationship Management Platform</p>
        </div>

        <div className="card shadow-sm border-0 p-4 mb-3">
          <div className="mb-3">
            <h5 className="fw-bold text-dark mb-1">Sign In</h5>
            <p className="text-muted small mb-0">Access your CRM workspace with your enterprise credentials</p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0"></i>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Work Email</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-start-0 border-end-0 ps-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-white text-muted border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-3 border-top">
            <span className="text-muted small">Need an account? </span>
            <Link to="/register" className="small fw-semibold text-primary text-decoration-none">
              Register new user
            </Link>
          </div>
        </div>

        {/* Quick Demo Roles Card */}
        <div className="card shadow-sm border-0 p-3 mb-3 bg-white">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Demo Roles
            </span>
            <span className="badge bg-light text-secondary border small">1-Click Fill</span>
          </div>

          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger text-start d-flex justify-content-between align-items-center py-2 px-3"
              onClick={() => handleQuick('admin@acxiomcrm.com', 'Admin@123')}
            >
              <div>
                <span className="fw-bold d-block text-dark" style={{ fontSize: '0.85rem' }}>
                  Alexander Vance
                </span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  admin@acxiomcrm.com • Full Admin Access
                </span>
              </div>
              <span className="badge bg-danger">Admin</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-warning text-dark text-start d-flex justify-content-between align-items-center py-2 px-3"
              onClick={() => handleQuick('manager@acxiomcrm.com', 'Manager@123')}
            >
              <div>
                <span className="fw-bold d-block text-dark" style={{ fontSize: '0.85rem' }}>
                  Sarah Jenkins
                </span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  manager@acxiomcrm.com • Team Reports & Pipeline
                </span>
              </div>
              <span className="badge bg-warning text-dark">Manager</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-info text-dark text-start d-flex justify-content-between align-items-center py-2 px-3"
              onClick={() => handleQuick('sales@acxiomcrm.com', 'Sales@123')}
            >
              <div>
                <span className="fw-bold d-block text-dark" style={{ fontSize: '0.85rem' }}>
                  Marcus Sterling
                </span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  sales@acxiomcrm.com • Scoped Sales Executive
                </span>
              </div>
              <span className="badge bg-info text-dark">Sales Rep</span>
            </button>
          </div>
        </div>

        <div className="text-center text-muted small" style={{ fontSize: '0.75rem' }}>
          Protected by AcxiomCRM RBAC & Enterprise Audit Security
        </div>
      </div>
    </div>
  );
}
