
export enum UserRole {
  ADMIN = 'admin',
  MUDEER = 'mudeer',
  EMPLOYEE = 'employee'
}

export enum Campus {
  MAIN = 'main',
  JOHAR = 'johar',
  MASJID = 'masjid',
  MAKTAB = 'maktab'
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  HOLIDAY = 'holiday',
  LEAVE = 'leave'
}

export interface User {
  id: string;
  username: string;
  name: string;
  campus: Campus;
  role: UserRole;
  employee_id?: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  campus: Campus;
  status: 'full_time' | 'part_time';
  shift_start: string;
  shift_end: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: AttendanceStatus;
  late_hours: number;
  overtime: number;
  on_time: boolean;
  remarks: string;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  annual_total: number;
  annual_used: number;
  casual_total: number;
  casual_used: number;
  medical_total: number;
  medical_used: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  type: 'annual' | 'casual' | 'medical';
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employee?: { name: string };
}
