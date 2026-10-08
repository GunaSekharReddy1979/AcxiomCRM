import React, { useState, useEffect } from 'react';
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
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await api.get('/auth/roles');
        if (res.data?.data && Array.isArray(res.data.data)) {
          setRoles(res.data.data);
          if (res.data.data.length > 0) {
            setFormData((prev) => ({ ...prev, roleId: res.data.data[res.data.data.length - 1].RoleId }));
          }
        }
      } catch (e) {
        // Fallback standard roles
        setRoles([
          { RoleId: 3, RoleName: 'Sales Executive' },
          { RoleId: 2, RoleName: 'Manager' },
          { RoleId: 1, RoleName: 'Admin' }
        ]);
      }
    }
    fetchRoles();
  }, []);

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
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-3 mb-3 shadow-sm"
            style={{ width: '56px', height: '56px' }}
          >
            <i className="bi bi-person-plus-fill fs-2 text-info"></i>
          </div>
          <h2 className="fw-bold text-dark tracking-tight mb-1">AcxiomCRM</h2>
          <p className="text-secondary small mb-0">Create your enterprise user profile</p>
        </div>

        <div className="card shadow-sm border-0 p-4 mb-4">
          <h5 className="fw-bold text-dark mb-1">Create CRM Account</h5>
          <p className="text-muted small mb-3">Fill in your corporate details to join the workspace</p>
          {error && <div className="alert alert-danger py-2 px-3 small mb-3">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Corporate Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Role</label>
                <select
                  className="form-select"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.RoleId} value={r.RoleId}>
                      {r.RoleName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">
                Password <span className="text-muted fw-normal">(Min 8 chars, 1 uppercase, 1 digit, 1 special)</span>
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-end-0"
                  placeholder="Set strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  <span>Registering...</span>
                </>
              ) : (
                'Register Profile'
              )}
            </button>
          </form>

          <div className="text-center mt-3 pt-3 border-top">
            <span className="text-muted small">Already registered? </span>
            <Link to="/login" className="small fw-semibold text-primary text-decoration-none">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
