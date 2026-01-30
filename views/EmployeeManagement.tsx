
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole, Employee, Campus } from '../types';

const EmployeeManagement: React.FC<{ user: User }> = ({ user }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    let query = supabase.from('employees').select('*').order('id');
    
    if (user.role === UserRole.MUDEER) {
      query = query.eq('campus', user.campus);
    }

    const { data } = await query;
    setEmployees(data || []);
    setLoading(false);
  }

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampus = filterCampus === 'all' || e.campus === filterCampus;
    return matchesSearch && matchesCampus;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Staff Registry</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Directory of {employees.length} academy members</p>
        </div>
        {user.role === UserRole.ADMIN && (
          <button 
            onClick={() => { setEditingEmp({}); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl shadow-blue-200 active:scale-95"
          >
            ADD NEW STAFF
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="relative">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              placeholder="Search by name or ID (FAMC...)"
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Campus:</label>
            <select 
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 text-xs outline-none cursor-pointer"
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
            >
              <option value="all">All Campuses</option>
              <option value={Campus.MAIN}>Main Academy</option>
              <option value={Campus.JOHAR}>Johar Campus</option>
              <option value={Campus.MASJID}>Masjid Campus</option>
              <option value={Campus.MAKTAB}>Maktab Campus</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Campus</th>
                <th className="px-6 py-4">Shift</th>
                {user.role === UserRole.ADMIN && <th className="px-6 py-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i></td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                       </div>
                       <div>
                          <p className="font-black text-slate-700 text-sm">{emp.name}</p>
                          <p className="text-[10px] font-black text-slate-400 font-mono">{emp.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-600">{emp.designation}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase">{emp.department}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${
                      emp.campus === Campus.MAIN ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      emp.campus === Campus.JOHAR ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      emp.campus === Campus.MASJID ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {emp.campus}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                     <p className="text-xs font-black text-slate-500 font-mono">{emp.shift_start} - {emp.shift_end}</p>
                  </td>
                  {user.role === UserRole.ADMIN && (
                    <td className="px-6 py-5 text-center">
                      <button className="text-slate-300 hover:text-blue-600 transition-colors">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
