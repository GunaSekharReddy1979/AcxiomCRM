import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="crm-main-layout">
      {sidebarOpen && (
        <div
          className="crm-sidebar-backdrop d-lg-none"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="crm-content-area">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="crm-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
