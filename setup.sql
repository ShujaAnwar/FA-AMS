
    -- Fiqh Academy AMS: Complete Supabase Schema & Data Setup
    -- Run this in your Supabase SQL Editor

    -- 1. EXTENSIONS
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 2. TABLES

    -- Employees table (Core data)
    CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY, -- e.g., 'FAMC1001'
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT 'General',
        campus TEXT NOT NULL CHECK (campus IN ('main', 'johar', 'masjid', 'maktab')),
        status TEXT NOT NULL CHECK (status IN ('full_time', 'part_time')) DEFAULT 'full_time',
        shift_start TIME NOT NULL DEFAULT '08:00:00',
        shift_end TIME NOT NULL DEFAULT '17:00:00',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Users table (Auth linkage and Roles)
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        campus TEXT NOT NULL CHECK (campus IN ('main', 'johar', 'masjid', 'maktab')),
        role TEXT NOT NULL CHECK (role IN ('admin', 'mudeer', 'employee')),
        employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Attendance Records
    CREATE TABLE IF NOT EXISTS attendance_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_in TIME,
        time_out TIME,
        status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'holiday', 'leave')),
        late_hours NUMERIC(5, 2) DEFAULT 0,
        overtime NUMERIC(5, 2) DEFAULT 0,
        on_time BOOLEAN DEFAULT TRUE,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (employee_id, date)
    );

    -- Leave Balances
    CREATE TABLE IF NOT EXISTS employee_leaves (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id TEXT NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
        annual_total INTEGER DEFAULT 20,
        annual_used INTEGER DEFAULT 0,
        casual_total INTEGER DEFAULT 10,
        casual_used INTEGER DEFAULT 0,
        medical_total INTEGER DEFAULT 15,
        medical_used INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Leave Requests
    CREATE TABLE IF NOT EXISTS leave_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('annual', 'casual', 'medical')),
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        reason TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. UPDATED_AT TRIGGER
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_employees_modtime BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    CREATE TRIGGER update_attendance_modtime BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    CREATE TRIGGER update_leaves_modtime BEFORE UPDATE ON employee_leaves FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    CREATE TRIGGER update_leavereq_modtime BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

    -- 4. INSERT EMPLOYEES

    -- Main Campus (9 Employees)
    INSERT INTO employees (id, name, designation, department, campus, status, shift_start, shift_end) VALUES
    ('FAMC1001', 'Maulana Syed Osama Ali', 'Mudeer', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1002', 'Maulana Abrar Hussain', 'Mudeer', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1003', 'Maulana Abid Ali', 'Mudeer', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1004', 'Maulana Maaz bin Tajammul', 'Mudeer', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1005', 'Sufi Jamil-ur-Rahman Abbasi', 'Mudeer', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1006', 'Maulana Hammad Ahmed Turk', 'Naib Mudeer', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1007', 'Shuja Anwar Ahmed Hashmi', 'Accountant', 'Finance', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1008', 'Maulana Muhammad Iqbal', 'Muavin', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00'),
    ('FAMC1009', 'Mufti Syed Ahmed Ali', 'Co-ordinator Wifaq', 'Administration', 'main', 'full_time', '08:00:00', '17:00:00');

    -- Johar Campus (22 Employees)
    INSERT INTO employees (id, name, designation, department, campus, status, shift_start, shift_end) VALUES
    ('FAJC2001', 'Ansar Ahmed', 'Mutamad', 'Administration', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2002', 'Muhammad Usman Khan', 'Naib Mudeer', 'Administration', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2003', 'Maulana Muhammad Umar', 'Masool', 'Administration', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2004', 'Maulana Hosh Muhammad Pasha', 'Ustaad', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2005', 'Maulana Muhammad Faraz', 'Ustaad', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2006', 'Maulana Abdul Qadir Hashim', 'Ustaad', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2007', 'Mufti Dr. Hayat Muhammad', 'Ustaad', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2008', 'Muhammad Haris Ali', 'Muavin', 'Administration', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2009', 'Qari Faysal Nadeem', 'Muallim Hifz', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2010', 'Qari Rehmanullah', 'Muallim Hifz', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2011', 'Qari Naseerullah', 'Muallim Hifz', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2012', 'Qaria Zauja Absar Khan', 'Muallimah Nazra', 'Education', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2013', 'Abdullah Iftikhar', 'Designer', 'IT', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2014', 'Malik Aqib Farooq', 'Designer', 'IT', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2015', 'Abdul Qadeer', 'Muavin-e-Intezami Umoor', 'Administration', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2016', 'Abu Bakar', 'Security Guard', 'Security', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2017', 'Irfan Ullah', 'Khadim', 'General Services', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2018', 'Zakir Imran', 'Driver', 'Transport', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2019', 'Hidayat Ullah', 'Khadim', 'General Services', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2020', 'Muhammad Yahya', 'Khadim', 'General Services', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2021', 'Izaz Ullah', 'I.T Assistant', 'IT', 'johar', 'full_time', '08:00:00', '17:00:00'),
    ('FAJC2022', 'Muhammad Nadeem', 'Librarian', 'Library', 'johar', 'full_time', '08:00:00', '17:00:00');

    -- Masjid Campus (24 Employees)
    INSERT INTO employees (id, name, designation, department, campus, status, shift_start, shift_end) VALUES
    ('FAMS3001', 'Abrar Hussain', 'Director', 'Administration', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3002', 'Muhammad Shoaib', 'Mufti', 'Religious Affairs', 'masjid', 'full_time', '07:45:00', '16:45:00'),
    ('FAMS3003', 'Abdul Ghafoor Siddique', 'Imam e Masjid Shafeeq ur Rahman', 'Religious Affairs', 'masjid', 'full_time', '06:00:00', '17:00:00'),
    ('FAMS3004', 'Shahid Khan', 'Ustaad', 'Education', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3005', 'Muhammad Haroon', 'Muavin-e-Fatawa Yasaloonak', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3006', 'Mubashir Umer', 'Muavin-e-Fatawa Yasaloonak', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '22:30:00'),
    ('FAMS3007', 'Ijaz Ahmed', 'Naib Imam-e-Masjid Shafeeq ur Rahman', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3008', 'Shaheer Afzal', 'Rafeeq Darul Ifta', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3009', 'AbduSaboor', 'Rafeeq Darul Ifta', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3010', 'Umair Aman', 'Muavin e Intezami Umoor', 'Administration', 'masjid', 'full_time', '08:00:00', '20:00:00'),
    ('FAMS3011', 'Wali Maaz', 'Khadim - e - Masjid Shafeeq ur Rahman', 'General Services', 'masjid', 'full_time', '05:00:00', '21:00:00'),
    ('FAMS3012', 'Shahid Ali', 'Khadim - e - Masjid Shafeeq ur Rahman', 'General Services', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3013', 'Saddam Hussain', 'Khadim - e - Masjid Shafeeq ur Rahman', 'General Services', 'masjid', 'full_time', '08:00:00', '21:00:00'),
    ('FAMS3014', 'Shahid Sangrasi', 'Khadim - e - Masjid Shafeeq ur Rahman', 'General Services', 'masjid', 'full_time', '07:00:00', '21:00:00'),
    ('FAMS3015', 'Abdullah Iftikhar', 'Designer', 'IT', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3016', 'Bint e Jameel', 'Muallima', 'Education', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3017', 'Umme Yahya', 'Muallima', 'Education', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3018', 'Shahbaz Ali', 'Ustaad', 'Education', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3019', 'Muhammad Usman Habib', 'Muin Mufti', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3020', 'Ahsan Ullah Shaiq', 'Raees Darul Ifta Fatawa Yasaloonak / Ustaad', 'Religious Affairs', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3021', 'Muhammad bin Ismail', 'Ustaad', 'Education', 'masjid', 'full_time', '08:00:00', '17:00:00'),
    ('FAMS3022', 'Ameer Muavia', 'Muawin Madarsa', 'Education', 'masjid', 'full_time', '08:00:00', '20:00:00'),
    ('FAMS3023', 'Ghulam Abbas', 'Khadim - e - Masjid Shafeeq ur Rahman', 'General Services', 'masjid', 'full_time', '08:00:00', '20:00:00'),
    ('FAMS3024', 'Mumtaz', 'Khadim - e - Masjid Shafeeq ur Rahman', 'General Services', 'masjid', 'full_time', '08:00:00', '20:00:00');

    -- Maktab Campus (10 Employees)
    INSERT INTO employees (id, name, designation, department, campus, status, shift_start, shift_end) VALUES
    ('FAMT4001', 'Muhammad Raid', 'Masool Intizami Umoor', 'Administration', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4002', 'Daniyal Tasleem', 'Office Assistant', 'Administration', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4003', 'Qari Muhammad Tahir Sami', 'Muallim', 'Education', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4004', 'Qari Ammar Ansari', 'Muallim', 'Education', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4005', 'Qari Muhammad Idrees', 'Muallim', 'Education', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4006', 'Umm-e-Ahsan', 'Muallimah', 'Education', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4007', 'Umme Hatim', 'Muallimah', 'Education', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4008', 'Afzal Khan', 'Cook', 'Kitchen', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4009', 'Ubaid Ullah', 'Khadim', 'General Services', 'maktab', 'full_time', '08:00:00', '17:00:00'),
    ('FAMT4010', 'Qasim Sangrasi', 'Security Guard', 'Security', 'maktab', 'full_time', '08:00:00', '17:00:00');

    -- 5. INITIALIZE LEAVE BALANCES
    INSERT INTO employee_leaves (employee_id, annual_total, casual_total, medical_total)
    SELECT id, 20, 10, 15 FROM employees
    ON CONFLICT (employee_id) DO NOTHING;

    -- 6. ROW LEVEL SECURITY (RLS) policies
    ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
    ALTER TABLE employee_leaves ENABLE ROW LEVEL SECURITY;
    ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

    -- Basic policies for public access (Since we are in "No Login" mode but using Supabase Client)
    -- In a real production app, these would be tighter (checking auth.uid())
    CREATE POLICY "Public Read Access" ON employees FOR SELECT USING (true);
    CREATE POLICY "Public Attendance Access" ON attendance_records FOR ALL USING (true);
    CREATE POLICY "Public Leave Access" ON employee_leaves FOR SELECT USING (true);
    CREATE POLICY "Public Leave Request Access" ON leave_requests FOR ALL USING (true);
    CREATE POLICY "Public Users Access" ON users FOR SELECT USING (true);
