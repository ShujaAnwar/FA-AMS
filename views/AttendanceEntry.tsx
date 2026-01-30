
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole, Employee, AttendanceRecord, AttendanceStatus } from '../types';

const AttendanceEntry: React.FC<{ user: User }> = ({ user }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [saving, setSaving] = useState(false);

  const isEmployee = user.role === UserRole.EMPLOYEE;
  const isMudeerOrAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MUDEER;

  useEffect(() => {
    fetchData();
  }, [date]);

  async function fetchData() {
    setLoading(true);
    try {
      let empQuery = supabase.from('employees').select('*');
      if (user.role === UserRole.MUDEER) {
        empQuery = empQuery.eq('campus', user.campus);
      } else if (user.role === UserRole.EMPLOYEE) {
        empQuery = empQuery.eq('id', user.employee_id);
      }
      const { data: emps } = await empQuery;
      setEmployees(emps || []);

      const { data: existingRecords } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', date);

      const recordMap: Record<string, Partial<AttendanceRecord>> = {};
      existingRecords?.forEach(r => {
        recordMap[r.employee_id] = r;
      });
      setRecords(recordMap);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateRecord = async (empId: string, field: string, value: any) => {
    const current = records[empId] || { employee_id: empId, date: date, status: AttendanceStatus.PRESENT };
    const updated = { ...current, [field]: value };
    
    // Auto-calculate logic
    if (field === 'time_in' || field === 'time_out') {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
        const shiftStart = emp.shift_start;
        const shiftEnd = emp.shift_end;
        
        if (updated.time_in) {
          const start = new Date(`${date}T${shiftStart}`);
          const actual = new Date(`${date}T${updated.time_in}`);
          if (actual > start) {
            updated.late_hours = parseFloat(((actual.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));
            updated.status = AttendanceStatus.LATE;
            updated.on_time = false;
          } else {
            updated.late_hours = 0;
            updated.status = AttendanceStatus.PRESENT;
            updated.on_time = true;
          }
        }
        
        if (updated.time_out) {
           const end = new Date(`${date}T${shiftEnd}`);
           const actual = new Date(`${date}T${updated.time_out}`);
           if (actual > end) {
             updated.overtime = parseFloat(((actual.getTime() - end.getTime()) / (1000 * 60 * 60)).toFixed(2));
           } else {
             updated.overtime = 0;
           }
        }
      }
    }

    setRecords(prev => ({ ...prev, [empId]: updated }));
  };

  const saveBatch = async () => {
    setSaving(true);
    const payloads = Object.values(records).map(r => ({
      employee_id: r.employee_id,
      date: date,
      time_in: r.time_in || null,
      time_out: r.time_out || null,
      status: r.status || AttendanceStatus.PRESENT,
      late_hours: r.late_hours || 0,
      overtime: r.overtime || 0,
      on_time: r.on_time ?? true,
      remarks: r.remarks || ''
    }));

    const { error } = await supabase.from('attendance_records').upsert(payloads, { onConflict: 'employee_id, date' });
    if (error) alert(error.message);
    setSaving(false);
    fetchData();
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-300 font-black uppercase text-[10px] tracking-widest">Querying Logs...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Clock Terminal</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Status management for {date}</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            className="bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-slate-700" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          {isMudeerOrAdmin && (
            <button 
              onClick={saveBatch} 
              disabled={saving}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'COMMIT LOGS'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-6">Staff Member</th>
                <th className="px-8 py-6">Clock In</th>
                <th className="px-8 py-6">Clock Out</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Audit Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.map(emp => {
                const rec = records[emp.id] || {};
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="font-black text-slate-700 text-sm">{emp.name}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{emp.id} • {emp.campus}</p>
                    </td>
                    <td className="px-8 py-6">
                       <input 
                        type="time" 
                        className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none"
                        value={rec.time_in || ''}
                        onChange={(e) => handleUpdateRecord(emp.id, 'time_in', e.target.value)}
                        disabled={isEmployee && !!rec.time_in && !isMudeerOrAdmin}
                       />
                       {isEmployee && !rec.time_in && (
                         <button onClick={() => { handleUpdateRecord(emp.id, 'time_in', new Date().toTimeString().slice(0, 5)); saveBatch(); }} className="ml-2 bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase">NOW</button>
                       )}
                    </td>
                    <td className="px-8 py-6">
                       <input 
                        type="time" 
                        className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none"
                        value={rec.time_out || ''}
                        onChange={(e) => handleUpdateRecord(emp.id, 'time_out', e.target.value)}
                        disabled={isEmployee && !!rec.time_out && !isMudeerOrAdmin}
                       />
                       {isEmployee && !!rec.time_in && !rec.time_out && (
                         <button onClick={() => { handleUpdateRecord(emp.id, 'time_out', new Date().toTimeString().slice(0, 5)); saveBatch(); }} className="ml-2 bg-rose-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase">NOW</button>
                       )}
                    </td>
                    <td className="px-8 py-6">
                       <select 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-700"
                        value={rec.status || AttendanceStatus.PRESENT}
                        onChange={(e) => handleUpdateRecord(emp.id, 'status', e.target.value)}
                       >
                         {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          {rec.late_hours ? <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full self-start">LATE {rec.late_hours}H</span> : null}
                          {rec.overtime ? <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full self-start">OT {rec.overtime}H</span> : null}
                          {!rec.late_hours && !rec.overtime && <span className="text-[9px] font-black text-slate-300 uppercase">Clear</span>}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceEntry;
