
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './views/Login';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import EmployeeManagement from './views/EmployeeManagement';
import AttendanceEntry from './views/AttendanceEntry';
import LeaveManagement from './views/LeaveManagement';
import Reports from './views/Reports';
import Profile from './views/Profile';
import { User, UserRole, Campus } from './types';

const App: React.FC = () => {
  // Mocking an admin user for immediate development access
  const [user, setUser] = useState<User | null>({
    id: '00000000-0000-0000-0000-000000000000',
    username: 'admin',
    name: 'Admin Developer',
    campus: Campus.MAIN,
    role: UserRole.ADMIN,
    employee_id: 'FAMC1001'
  });
  const [loading, setLoading] = useState(false); // Set to false since we aren't waiting for auth
  const [activeTab, setActiveTab] = useState('dashboard');

  // Logic to check actual Supabase session is bypassed for "No Login" mode
  /*
  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth session', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile && !error) {
      setUser(profile);
      if (profile.role === UserRole.EMPLOYEE) {
        setActiveTab('attendance');
      }
    }
  }
  */

  const handleLogout = async () => {
    // For now, we just clear the mock user
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-shield-alt text-blue-600"></i>
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Initializing Dev Session...</p>
      </div>
    );
  }

  // If user is null (e.g. after "Logout"), show a simple button to restore session instead of login form
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center">
          <h2 className="text-2xl font-black mb-6">Session Ended</h2>
          <button 
            onClick={() => setUser({
              id: '00000000-0000-0000-0000-000000000000',
              username: 'admin',
              name: 'Admin Developer',
              campus: Campus.MAIN,
              role: UserRole.ADMIN,
              employee_id: 'FAMC1001'
            })}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200"
          >
            Restart Dev Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'employees' && <EmployeeManagement user={user} />}
        {activeTab === 'attendance' && <AttendanceEntry user={user} />}
        {activeTab === 'leaves' && <LeaveManagement user={user} />}
        {activeTab === 'reports' && <Reports user={user} />}
        {activeTab === 'profile' && <Profile user={user} />}
      </div>
    </Layout>
  );
};

export default App;
