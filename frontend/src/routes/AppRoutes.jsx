import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage';

import DashboardPage from '../pages/dashboard/DashboardPage';
import CustomersListPage from '../pages/customers/CustomersListPage';
import CustomerDetailPage from '../pages/customers/CustomerDetailPage';
import LeadsListPage from '../pages/leads/LeadsListPage';
import OpportunitiesListPage from '../pages/opportunities/OpportunitiesListPage';
import FollowUpsPage from '../pages/followups/FollowUpsPage';
import ActivitiesPage from '../pages/activities/ActivitiesPage';
import ReportsPage from '../pages/reports/ReportsPage';
import UsersPage from '../pages/users/UsersPage';
import AuditLogPage from '../pages/audit/AuditLogPage';
import ProfilePage from '../pages/profile/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/leads" element={<LeadsListPage />} />
          <Route path="/opportunities" element={<OpportunitiesListPage />} />
          <Route path="/followups" element={<FollowUpsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route path="/audit-log" element={<AuditLogPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
