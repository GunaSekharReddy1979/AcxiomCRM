import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

export default function AppLayout() {
  return (
    <div className="crm-main-layout">
      <Sidebar />
      <div className="crm-content-area">
        <Header />
        <main className="crm-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
