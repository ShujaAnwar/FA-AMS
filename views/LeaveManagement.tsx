
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole, LeaveBalance, LeaveRequest } from '../types';

const LeaveManagement: React.FC<{ user: User }> = ({ user }) => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<LeaveRequest>>({ type: 'annual' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();

    // Subscribe to leave request changes
    const channel = supabase
      .channel('leave_updates')
      .on('postgres_changes', { event: '*', table: 'leave_requests' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const isEmployee = user.role === UserRole.EMPLOYEE;

      let reqQuery = supabase.from('leave_requests').select('*, employees(name, campus)');
      if (isEmployee) {
        reqQuery = reqQuery.eq('employee_id', user.employee_id);
      } else if (user.role === UserRole.MUDEER) {
        reqQuery = reqQuery.filter('employees.campus', 'eq', user.campus);
      }
      const { data: reqs } = await reqQuery.order('created_at', { ascending: false });
      setRequests(reqs || []);

      let balQuery = supabase.from('employee_leaves').select('*, employees(name, campus)');
      if (isEmployee) {
        balQuery = balQuery.eq('employee_id', user.employee_id);
      } else if (user.role === UserRole.MUDEER) {
        balQuery = balQuery.filter('employees.campus', 'eq', user.campus);
      }
      const { data: bals } = await balQuery;
      setBalances(bals || []);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const balance = balances.find(b => b.employee_id === user.employee_id);
      if (balance) {
        const field = `${newRequest.type}_used` as keyof LeaveBalance;
        const totalField = `${newRequest.type}_total` as keyof LeaveBalance;
        if ((balance[field] as number) >= (balance[totalField] as number)) {
          alert(`You have exhausted your ${newRequest.type} leave balance.`);
          return;
        }
      }

      const payload = {
        ...newRequest,
        employee_id: user.employee_id,
        status: 'pending'
      };
      const { error } = await supabase.from('leave_requests').insert([payload]);
      if (error) throw error;
      
      setShowApplyModal(false);
      fetchData();
    } catch (err: any) {
      alert("Application failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  if (loading && requests.length === 0) return <div className="flex items-center justify-center py-20"><i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Time Off</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Leave & Balance Controller</p>
        </div>
        {user.role === UserRole.EMPLOYEE && (
          <button 
            onClick={() => setShowApplyModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl shadow-blue-100 active:scale-95"
          >
            NEW APPLICATION
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
             <i className="fas fa-chart-pie text-blue-500"></i> ALLOCATIONS
           </h3>
           <div className="grid grid-cols-1 gap-4">
              {balances.map(b => (
                <div key={b.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all hover:shadow-xl hover:-translate-y-1">
                   {user.role !== UserRole.EMPLOYEE && (
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                          {(b as any).employees?.name[0]}
                        </div>
                        <p className="text-[10px] font-black text-blue-600 uppercase">{(b as any).employees?.name}</p>
                     </div>
                   )}
                   <div className="space-y-6">
                      <BalanceBar label="Annual" used={b.annual_used} total={b.annual_total} color="bg-blue-500" />
                      <BalanceBar label="Casual" used={b.casual_used} total={b.casual_total} color="bg-purple-500" />
                      <BalanceBar label="Medical" used={b.medical_used} total={b.medical_total} color="bg-rose-500" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
             <i className="fas fa-stream text-blue-500"></i> RECENT HISTORY
           </h3>
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      <th className="px-8 py-6">Staff Member</th>
                      <th className="px-8 py-6">Category</th>
                      <th className="px-8 py-6">Duration</th>
                      <th className="px-8 py-6">Decision</th>
                      {user.role !== UserRole.EMPLOYEE && <th className="px-8 py-6 text-center">Manage</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-700">{req.employee?.name || 'Self'}</p>
                          <p className="text-[10px] font-black text-slate-300 font-mono tracking-tighter">{req.employee_id}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{req.type}</span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-black text-slate-700">{req.from_date}</p>
                          <p className="text-[10px] font-black text-slate-400">UNTIL {req.to_date}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                            req.status === 'approved' ? 'bg-emerald-500 text-white' : 
                            req.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        {user.role !== UserRole.EMPLOYEE && (
                          <td className="px-8 py-6 text-center">
                            {req.status === 'pending' && (
                              <div className="flex justify-center gap-3">
                                <button onClick={() => updateRequestStatus(req.id, 'approved')} className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all" title="Approve"><i className="fas fa-check"></i></button>
                                <button onClick={() => updateRequestStatus(req.id, 'rejected')} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all" title="Reject"><i className="fas fa-times"></i></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Request Leave</h3>
               <button onClick={() => setShowApplyModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fas fa-times text-xl"></i></button>
             </div>
             <form onSubmit={handleApply} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">START DATE</label>
                    <input required type="date" className="w-full px-5 py-3 border border-slate-100 bg-slate-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold" onChange={e => setNewRequest({...newRequest, from_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">END DATE</label>
                    <input required type="date" className="w-full px-5 py-3 border border-slate-100 bg-slate-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold" onChange={e => setNewRequest({...newRequest, to_date: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LEAVE CATEGORY</label>
                  <select required className="w-full px-5 py-3 border border-slate-100 bg-slate-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold cursor-pointer" value={newRequest.type} onChange={e => setNewRequest({...newRequest, type: e.target.value as any})}>
                    <option value="annual">Annual Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="medical">Medical Leave</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DETAILED REASON</label>
                  <textarea required className="w-full px-5 py-4 border border-slate-100 bg-slate-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold h-32 resize-none transition-all" placeholder="Please explain why you need leave..." onChange={e => setNewRequest({...newRequest, reason: e.target.value})}></textarea>
                </div>
                <div className="pt-4 flex justify-end gap-4">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="px-8 py-3 rounded-2xl border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-10 py-3 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50">
                    {submitting ? 'SENDING...' : 'COMMIT REQUEST'}
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

const BalanceBar: React.FC<{ label: string; used: number; total: number; color: string }> = ({ label, used, total, color }) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-black text-slate-300">{used} / {total} <span className="text-slate-200">DAYS</span></span>
    </div>
    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
      <div className={`h-full ${color} transition-all duration-1000 shadow-lg`} style={{ width: `${(used / total) * 100}%` }}></div>
    </div>
  </div>
);

export default LeaveManagement;
