
import React from 'react';
import { User, UserRole, Campus } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, activeTab, setActiveTab, children }) => {
  const isAdminOrMudeer = user.role === UserRole.ADMIN || user.role === UserRole.MUDEER;
  const isEmployee = user.role === UserRole.EMPLOYEE;

  const campusColors: Record<Campus, string> = {
    [Campus.MAIN]: 'bg-blue-600',
    [Campus.JOHAR]: 'bg-purple-600',
    [Campus.MASJID]: 'bg-red-600',
    [Campus.MAKTAB]: 'bg-orange-600'
  };

  const getCampusName = (c: Campus) => {
    switch(c) {
      case Campus.MAIN: return 'Main Campus';
      case Campus.JOHAR: return 'Johar Campus';
      case Campus.MASJID: return 'Masjid Campus';
      case Campus.MAKTAB: return 'Maktab Campus';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg text-blue-700 shadow-sm">
              <i className="fas fa-user-clock text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Fiqh Academy AMS</h1>
              <p className="text-xs text-blue-100 opacity-80 uppercase tracking-widest">Supabase Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold opacity-70">Logged in as</p>
              <p className="text-sm font-bold">{user.name}</p>
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${campusColors[user.campus]}`}>
              {getCampusName(user.campus)}
            </div>
            <button 
              onClick={onLogout}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 flex overflow-x-auto no-scrollbar scroll-smooth">
          {isAdminOrMudeer && (
            <>
              <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-chart-pie" label="Dashboard" />
              <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon="fa-calendar-check" label="Attendance" />
              <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')} icon="fa-users" label="Employees" />
              <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon="fa-calendar-times" label="Leaves" />
              <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="fa-file-alt" label="Reports" />
            </>
          )}
          {isEmployee && (
            <>
              <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon="fa-fingerprint" label="Mark Attendance" />
              <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon="fa-calendar-times" label="My Leaves" />
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="fa-user-circle" label="My Profile" />
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 bg-slate-50">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-sm">
        <p>Fiqh Academy AMS &copy; {new Date().getFullYear()} | All Rights Reserved</p>
      </footer>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
      active ? 'border-white text-white' : 'border-transparent text-blue-100 hover:text-white hover:bg-white/10'
    }`}
  >
    <i className={`fas ${icon}`}></i>
    {label}
  </button>
);

export default Layout;
