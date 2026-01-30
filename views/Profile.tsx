
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Employee } from '../types';

const Profile: React.FC<{ user: User }> = ({ user }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    if (!user.employee_id) return;
    const { data } = await supabase.from('employees').select('*').eq('id', user.employee_id).single();
    setEmployee(data);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-10"><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32"></div>
        <div className="px-8 pb-8 -mt-16 text-center">
          <div className="inline-block p-2 bg-white rounded-full shadow-lg">
            <div className="bg-slate-100 w-28 h-28 rounded-full flex items-center justify-center text-blue-600 border-4 border-white">
              <i className="fas fa-user-circle text-6xl"></i>
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-800">{employee?.name}</h2>
          <p className="text-slate-500 font-medium">{employee?.designation}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-left">
            <div className="bg-slate-50 p-4 rounded-xl">
               <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee ID</span>
               <span className="font-mono font-bold text-blue-700">{employee?.id}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
               <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Campus</span>
               <span className="font-bold text-slate-700 capitalize">{employee?.campus}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
               <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</span>
               <span className="font-bold text-slate-700">{employee?.department}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
               <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift</span>
               <span className="font-bold text-slate-700">{employee?.shift_start} - {employee?.shift_end}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
         <h3 className="text-lg font-bold text-slate-800 mb-4">Security Settings</h3>
         <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
           <i className="fas fa-key"></i> Change Password
         </button>
      </div>
    </div>
  );
};

export default Profile;
