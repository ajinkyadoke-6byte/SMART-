-- Smart Attendance & Learning Companion (AttendIt)
-- PostgreSQL / Supabase Database Schema

-- 1. Users & Roles (Teachers, Students, Admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teachers Profile
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  faculty_code VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) DEFAULT 'Assistant Professor'
);

-- 3. Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  total_students INT DEFAULT 0,
  default_room VARCHAR(50)
);

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  credits INT DEFAULT 3,
  department VARCHAR(100) NOT NULL
);

-- 5. Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teachers(id),
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50)
);

-- 6. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roll_no VARCHAR(50) UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id),
  overall_attendance_pct NUMERIC(5,2) DEFAULT 100.00
);

-- 7. Attendance Sessions (Active or Historic)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code VARCHAR(50) UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id) NOT NULL,
  subject_id UUID REFERENCES subjects(id) NOT NULL,
  teacher_id UUID REFERENCES teachers(id) NOT NULL,
  room VARCHAR(50),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  qr_secret VARCHAR(255) NOT NULL,
  rotation_seconds INT DEFAULT 15
);

-- 8. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'flagged', 'absent')),
  verification_method VARCHAR(50) DEFAULT 'qr_ble',
  flag_reason TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);
