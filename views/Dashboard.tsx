
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole, Campus, AttendanceStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchDashboardStats();

    const channel = supabase
      .channel('attendance_live')
      .on('postgres_changes', { event: '*', table: 'attendance_records' }, () => {
        setIsLive(true);
        fetchDashboardStats();
        setTimeout(() => setIsLive(false), 2000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [date]);

  async function fetchDashboardStats() {
    try {
      // Fetch all employees to get capacity
      const { data: allEmps } = await supabase.from('employees').select('id, campus');
      
      // Fetch attendance for selected date
      let query = supabase
        .from('attendance_records')
        .select('status, employees!inner(campus)')
        .eq('date', date);

      if (user.role === UserRole.MUDEER) {
        query = query.eq('employees.campus', user.campus);
      }

      const { data: records } = await query;

      const campusMap: Record<string, any> = {
        [Campus.MAIN]: { name: 'Main', present: 0, late: 0, absent: 0, total: 0 },
        [Campus.JOHAR]: { name: 'Johar', present: 0, late: 0, absent: 0, total: 0 },
        [Campus.MASJID]: { name: 'Masjid', present: 0, late: 0, absent: 0, total: 0 },
        [Campus.MAKTAB]: { name: 'Maktab', present: 0, late: 0, absent: 0, total: 0 },
      };

      allEmps?.forEach(e => {
        if (campusMap[e.campus]) campusMap[e.campus].total++;
      });

      records?.forEach((r: any) => {
        const c = r.employees.campus;
        if (campusMap[c]) {
          if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE) campusMap[c].present++;
          if (r.status === AttendanceStatus.LATE) campusMap[c].late++;
          if (r.status === AttendanceStatus.ABSENT) campusMap[c].absent++;
        }
      });

      // Calculate absent based on total capacity if no record exists
      Object.keys(campusMap).forEach(key => {
        const c = campusMap[key];
        const accounted = records?.filter((r: any) => r.employees.campus === key).length || 0;
        c.absent += (c.total - accounted);
      });

      setStats(Object.values(campusMap));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const globalTotal = stats.reduce((acc, s) => acc + s.total, 0);
  const globalPresent = stats.reduce((acc, s) => acc + s.present, 0);
  const globalLate = stats.reduce((acc, s) => acc + s.late, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Academy Pulse
            {isLive && <span className="h-3 w-3 bg-green-500 rounded-full animate-ping"></span>}
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Real-time attendance intelligence</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex items-center gap-3">
          <i className="fas fa-calendar-day text-blue-500 ml-2"></i>
          <input 
            type="date" 
            className="bg-transparent border-none outline-none font-black text-slate-700 px-2" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Staff" value={globalTotal} icon="fa-users" color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Present Today" value={globalPresent} icon="fa-check-circle" color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Late Entries" value={globalLate} icon="fa-clock" color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Efficiency" value={`${Math.round((globalPresent / (globalTotal || 1)) * 100)}%`} icon="fa-bolt" color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tight">Campus Distribution</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Legend iconType="circle" />
                <Bar dataKey="present" fill="#3B82F6" radius={[10, 10, 0, 0]} name="Present" />
                <Bar dataKey="late" fill="#F59E0B" radius={[10, 10, 0, 0]} name="Late" />
                <Bar dataKey="absent" fill="#EF4444" radius={[10, 10, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative">
           <h3 className="text-xl font-black text-slate-800 self-start mb-8 tracking-tight">Overall Status</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[
                     { name: 'On Time', value: globalPresent - globalLate },
                     { name: 'Late', value: globalLate },
                     { name: 'Absent', value: globalTotal - globalPresent }
                   ]}
                   cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value"
                 >
                   <Cell fill="#10B981" />
                   <Cell fill="#F59E0B" />
                   <Cell fill="#EF4444" />
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4">
              <p className="text-4xl font-black text-slate-800">{Math.round((globalPresent / (globalTotal || 1)) * 100)}%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presence</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, icon: string, color: string, bg: string }> = ({ label, value, icon, color, bg }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
    <div className={`${bg} ${color} w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-transform group-hover:scale-110`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default Dashboard;
