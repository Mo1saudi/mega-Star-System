import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileNav } from './components/MobileNav';

import { DashboardPage } from './pages/DashboardPage';
import { PilgrimsPage } from './pages/PilgrimsPage';
import { FamilyLinksPage } from './pages/FamilyLinksPage';
import { RoomingPage } from './pages/RoomingPage';
import { TripsTransportsPage } from './pages/TripsTransportsPage';
import { StaffPage } from './pages/StaffPage';
import { FinancePage } from './pages/FinancePage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AccountingClosingPage } from './pages/AccountingClosingPage';
import { SettingsPage } from './pages/SettingsPage';

import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { activePage, theme, undo, redo } = useStore();

  // Keyboard shortcuts listener for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'pilgrims':
        return <PilgrimsPage />;
      case 'family-groups':
        return <FamilyLinksPage />;
      case 'rooming':
        return <RoomingPage />;
      case 'trips-transports':
        return <TripsTransportsPage />;
      case 'staff':
        return <StaffPage />;
      case 'finance':
        return <FinancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'accounting-closing':
        return <AccountingClosingPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-tajawal antialiased selection:bg-amber-500 selection:text-slate-950 ${theme}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <Sidebar />

        {/* Main Workspace View */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Topbar />
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderCurrentPage()}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav />

      {/* RTL Sonner Notifications */}
      <Toaster 
        position="top-center" 
        dir="rtl" 
        richColors 
        closeButton 
        toastOptions={{
          style: {
            fontFamily: 'Cairo, Tajawal, sans-serif',
            borderRadius: '16px'
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
