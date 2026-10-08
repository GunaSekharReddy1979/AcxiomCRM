import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.roleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
