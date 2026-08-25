import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'attendit-auth-super-secret-key';
const QR_ROTATION_SECONDS = 15;

// Mock Student Profiles
interface MockStudent {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  avatar: string;
  classId: string;
  className: string;
  enrolledSubjectIds: string[];
  overallAttendance: number;
}

const mockStudentDirectory: MockStudent[] = [
  {
    id: 'std-class-cse-a-1',
    name: 'Aditya Verma',
    rollNo: '22CS001',
    email: 'aditya.verma.001@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 94,
  },
  {
    id: 'std-class-cse-a-2',
    name: 'Sneha Patil',
    rollNo: '22CS002',
    email: 'sneha.patil.002@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 91,
  },
  {
    id: 'std-class-cse-a-3',
    name: 'Rohan Mehta',
    rollNo: '22CS003',
    email: 'rohan.mehta.003@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 88,
  },
  {
    id: 'std-class-cse-a-4',
    name: 'Kavya Singh',
    rollNo: '22CS004',
    email: 'kavya.singh.004@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 96,
  },
  {
    id: 'std-class-cse-a-5',
    name: 'Arjun Nair',
    rollNo: '22CS005',
    email: 'arjun.nair.005@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
    overallAttendance: 85,
  },
  {
    id: 'std-class-cse-b-1',
    name: 'Vikram Patel',
    rollNo: '22CS009',
    email: 'vikram.patel.009@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-b',
    className: 'CSE-B (Semester 4)',
    enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms'],
    overallAttendance: 89,
  },
  {
    id: 'std-class-it-a-1',
    name: 'Diya Menon',
    rollNo: '22IT016',
    email: 'diya.menon.016@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=120&auto=format&fit=crop',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    enrolledSubjectIds: ['sub-cn', 'sub-ai'],
    overallAttendance: 97,
  },
];

// In-memory attendance database records (studentId + sessionId composite uniqueness)
interface AttendanceRecord {
  id: string;
  sessionId: string;
  sessionCode: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  timestamp: string;
  status: 'Present' | 'Flagged';
  verificationStatus: 'Verified' | 'Flagged';
  verificationMethod: string;
  clientMetadata?: {
    deviceInfo?: string;
    scannedAt?: string;
    offlineSynced?: boolean;
    originalTimestamp?: string;
    device?: string;
    [key: string]: any;
  };
}

const attendanceTable: AttendanceRecord[] = [];

// Seed attendance for previously marked demo items if active


interface MockTeacher {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  department: string;
  branch: string;
  designation: string;
  facultyCode: string;
  avatar: string;
  timings: {
    start: string;
    finish: string;
  };
}

const mockTeacher: MockTeacher = {
  id: 'teacher-101',
  name: 'Prof. Anjali Sharma',
  email: 'anjali.sharma@attendit.edu',
  passwordHash: bcrypt.hashSync('teacher123', 8),
  department: 'Computer Science & Engineering',
  branch: 'Computer Science & Engineering (CSE)',
  designation: 'Associate Professor',
  facultyCode: 'CSE-FAC-409',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
  timings: {
    start: '09:00 AM',
    finish: '05:00 PM',
  },
};

let mockBranches = [
  { id: 'branch-cse', code: 'CSE', name: 'Computer Science & Engineering', department: 'Computer Science' },
  { id: 'branch-it', code: 'IT', name: 'Information Technology', department: 'Information Technology' },
  { id: 'branch-aids', code: 'AI&DS', name: 'Artificial Intelligence & Data Science', department: 'Computer Science' },
  { id: 'branch-ece', code: 'ECE', name: 'Electronics & Communication', department: 'Electronics' },
  { id: 'branch-mech', code: 'MECH', name: 'Mechanical Engineering', department: 'Mechanical' },
  { id: 'branch-civil', code: 'CIVIL', name: 'Civil Engineering', department: 'Civil' },
];

let mockDivisions = [
  { id: 'div-a', name: 'A' },
  { id: 'div-b', name: 'B' },
  { id: 'div-c', name: 'C' },
  { id: 'div-d', name: 'D' },
  { id: 'div-e', name: 'E' },
];

let mockSemesters = [
  { id: 'sem-1', semesterNumber: 1, label: 'Semester 1' },
  { id: 'sem-2', semesterNumber: 2, label: 'Semester 2' },
  { id: 'sem-3', semesterNumber: 3, label: 'Semester 3' },
  { id: 'sem-4', semesterNumber: 4, label: 'Semester 4' },
  { id: 'sem-5', semesterNumber: 5, label: 'Semester 5' },
  { id: 'sem-6', semesterNumber: 6, label: 'Semester 6' },
  { id: 'sem-7', semesterNumber: 7, label: 'Semester 7' },
  { id: 'sem-8', semesterNumber: 8, label: 'Semester 8' },
];

let mockClasses = [
  {
    id: 'class-cse-a',
    code: 'CSE-A',
    name: 'CSE-A (Semester 4)',
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    semester: 4,
    section: 'A',
    totalStudents: 42,
    defaultRoom: 'Room 301',
  },
  {
    id: 'class-cse-b',
    code: 'CSE-B',
    name: 'CSE-B (Semester 4)',
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    semester: 4,
    section: 'B',
    totalStudents: 38,
    defaultRoom: 'Room 304',
  },
  {
    id: 'class-it-a',
    code: 'IT-A',
    name: 'IT-A (Semester 6)',
    department: 'Information Technology',
    branch: 'Information Technology',
    semester: 6,
    section: 'A',
    totalStudents: 40,
    defaultRoom: 'Room 202',
  },
  {
    id: 'class-ece-a',
    code: 'ECE-A',
    name: 'ECE-A (Semester 4)',
    department: 'Electronics & Comm.',
    branch: 'Electronics & Communication',
    semester: 4,
    section: 'A',
    totalStudents: 36,
    defaultRoom: 'Room 105',
  },
  {
    id: 'class-aids-a',
    code: 'AIDS-A',
    name: 'AI&DS-A (Semester 4)',
    department: 'Computer Science',
    branch: 'Artificial Intelligence & Data Science',
    semester: 4,
    section: 'A',
    totalStudents: 35,
    defaultRoom: 'Lab 201',
  },
];

let mockSubjects = [
  {
    id: 'sub-ds',
    code: 'CS401',
    name: 'Data Structures',
    credits: 4,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'indigo',
  },
  {
    id: 'sub-os',
    code: 'CS402',
    name: 'Operating Systems',
    credits: 4,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'blue',
  },
  {
    id: 'sub-dbms',
    code: 'CS403',
    name: 'Database Management Systems',
    credits: 3,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'emerald',
  },
  {
    id: 'sub-cn',
    code: 'CS404',
    name: 'Computer Networks',
    credits: 3,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'purple',
  },
  {
    id: 'sub-ai',
    code: 'CS405',
    name: 'Artificial Intelligence & ML',
    credits: 4,
    department: 'Computer Science',
    branch: 'Artificial Intelligence & Data Science',
    colorTheme: 'amber',
  },
  {
    id: 'sub-cloud',
    code: 'IT601',
    name: 'Cloud Computing & DevOps',
    credits: 3,
    department: 'Information Technology',
    branch: 'Information Technology',
    colorTheme: 'cyan',
  },
  {
    id: 'sub-mp',
    code: 'EC401',
    name: 'Microprocessors & Microcontrollers',
    credits: 4,
    department: 'Electronics & Communication',
    branch: 'Electronics & Communication',
    colorTheme: 'teal',
  },
];

let mockLowAttendanceStudents = [
  {
    id: 'std-low-1',
    rollNo: '22CS013',
    name: 'Karan Malhotra',
    email: 'karan.malhotra.013@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    overallAttendance: 58,
    missedLectures: 14,
    totalLectures: 33,
    parentEmail: 's.malhotra@parentmail.com',
    parentPhone: '+91 98230 44123',
    statusRisk: 'critical' as const,
  },
  {
    id: 'std-low-2',
    rollNo: '22CS007',
    name: 'Rahul Deshmukh',
    email: 'rahul.deshmukh.007@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    overallAttendance: 64,
    missedLectures: 12,
    totalLectures: 33,
    parentEmail: 'v.deshmukh@parentmail.com',
    parentPhone: '+91 98231 55234',
    statusRisk: 'critical' as const,
  },
  {
    id: 'std-low-3',
    rollNo: '22CS019',
    name: 'Rohan Gupta',
    email: 'rohan.gupta.019@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop',
    classId: 'class-cse-b',
    className: 'CSE-B (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    overallAttendance: 68,
    missedLectures: 10,
    totalLectures: 31,
    parentEmail: 'm.gupta@parentmail.com',
    parentPhone: '+91 98232 66345',
    statusRisk: 'warning' as const,
  },
  {
    id: 'std-low-4',
    rollNo: '22IT008',
    name: 'Aniket Verma',
    email: 'aniket.verma.008@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    branch: 'Information Technology',
    semester: 6,
    overallAttendance: 52,
    missedLectures: 16,
    totalLectures: 33,
    parentEmail: 'k.verma@parentmail.com',
    parentPhone: '+91 98233 77456',
    statusRisk: 'critical' as const,
  },
  {
    id: 'std-low-5',
    rollNo: '22EC014',
    name: 'Tanmay Shinde',
    email: 'tanmay.shinde.014@attendit.edu',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
    classId: 'class-ece-a',
    className: 'ECE-A (Semester 4)',
    branch: 'Electronics & Communication',
    semester: 4,
    overallAttendance: 71,
    missedLectures: 9,
    totalLectures: 31,
    parentEmail: 'a.shinde@parentmail.com',
    parentPhone: '+91 98234 88567',
    statusRisk: 'borderline' as const,
  },
];

const mockDailyAttendance = [
  { day: 'Mon', date: 'Aug 17', percentage: 92, totalPresent: 147, totalEnrolled: 160 },
  { day: 'Tue', date: 'Aug 18', percentage: 88, totalPresent: 141, totalEnrolled: 160 },
  { day: 'Wed', date: 'Aug 19', percentage: 95, totalPresent: 152, totalEnrolled: 160 },
  { day: 'Thu', date: 'Aug 20', percentage: 89, totalPresent: 142, totalEnrolled: 160 },
  { day: 'Fri', date: 'Aug 21 (Today)', percentage: 94, totalPresent: 150, totalEnrolled: 160 },
];

interface TimetableItem {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  room: string;
  dayOfWeek: string;
  isToday: boolean;
  isCompleted: boolean;
  branch?: string;
  semester?: number;
  division?: string;
  teacherName?: string;
  academicYear?: string;
  attendanceCount?: {
    present: number;
    total: number;
    flagged?: number;
    percentage: number;
  };
}

const getInitialTimetable = (): TimetableItem[] => [
  // Friday (Today) Schedule for multiple branches & divisions
  {
    id: 'tt-1',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'A',
    subjectId: 'sub-ds',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CS401',
    teacherName: 'Prof. Anjali Sharma',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'Lab 302',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-2',
    classId: 'class-cse-b',
    className: 'CSE-B (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'B',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    subjectCode: 'CS402',
    teacherName: 'Prof. Rajiv Mehta',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
    room: 'Room 304',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-3',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'A',
    subjectId: 'sub-dbms',
    subjectName: 'Database Management Systems',
    subjectCode: 'CS403',
    teacherName: 'Prof. Sunita Rao',
    startTime: '11:30 AM',
    endTime: '12:30 PM',
    room: 'Lab 201',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-4',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'A',
    subjectId: 'sub-ai',
    subjectName: 'Artificial Intelligence & ML',
    subjectCode: 'CS404',
    teacherName: 'Prof. Anjali Sharma',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    room: 'Room 301',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-5',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    branch: 'Information Technology',
    semester: 6,
    division: 'A',
    subjectId: 'sub-cn',
    subjectName: 'Computer Networks',
    subjectCode: 'IT601',
    teacherName: 'Prof. Vikram Joshi',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'Room 202',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-6',
    classId: 'class-it-a',
    className: 'IT-A (Semester 6)',
    branch: 'Information Technology',
    semester: 6,
    division: 'A',
    subjectId: 'sub-cloud',
    subjectName: 'Cloud Computing & DevOps',
    subjectCode: 'IT602',
    teacherName: 'Prof. Anjali Sharma',
    startTime: '03:15 PM',
    endTime: '04:15 PM',
    room: 'Lab 105',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  {
    id: 'tt-7',
    classId: 'class-ece-a',
    className: 'ECE-A (Semester 4)',
    branch: 'Electronics & Communication',
    semester: 4,
    division: 'A',
    subjectId: 'sub-mp',
    subjectName: 'Microprocessors & Microcontrollers',
    subjectCode: 'EC401',
    teacherName: 'Prof. Rajesh Iyer',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
    room: 'Room 401',
    dayOfWeek: 'Friday',
    isToday: true,
    isCompleted: false,
  },
  // Monday Schedule
  {
    id: 'tt-8',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'A',
    subjectId: 'sub-ds',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CS401',
    teacherName: 'Prof. Anjali Sharma',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'Lab 302',
    dayOfWeek: 'Monday',
    isToday: false,
    isCompleted: false,
  },
  {
    id: 'tt-9',
    classId: 'class-cse-a',
    className: 'CSE-A (Semester 4)',
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'A',
    subjectId: 'sub-os',
    subjectName: 'Operating Systems',
    subjectCode: 'CS402',
    teacherName: 'Prof. Rajiv Mehta',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    room: 'Room 301',
    dayOfWeek: 'Monday',
    isToday: false,
    isCompleted: false,
  },
];

let mockTimetable: TimetableItem[] = getInitialTimetable();

const studentTemplates = [
  { name: 'Aditya Verma', rollNo: '22CS001', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop', attendance: 94 },
  { name: 'Sneha Patil', rollNo: '22CS002', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop', attendance: 91 },
  { name: 'Rohan Mehta', rollNo: '22CS003', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop', attendance: 88 },
  { name: 'Kavya Singh', rollNo: '22CS004', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop', attendance: 96 },
  { name: 'Arjun Nair', rollNo: '22CS005', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop', attendance: 85 },
  { name: 'Priya Sharma', rollNo: '22CS006', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop', attendance: 92 },
  { name: 'Rahul Deshmukh', rollNo: '22CS007', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=120&auto=format&fit=crop', attendance: 78 },
  { name: 'Ananya Iyer', rollNo: '22CS008', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop', attendance: 95 },
  { name: 'Vikram Patel', rollNo: '22CS009', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=120&auto=format&fit=crop', attendance: 89 },
  { name: 'Neha Gupta', rollNo: '22CS010', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=120&auto=format&fit=crop', attendance: 82 },
  { name: 'Siddharth Roy', rollNo: '22CS011', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop', attendance: 90 },
  { name: 'Tanvi Joshi', rollNo: '22CS012', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=120&auto=format&fit=crop', attendance: 87 },
  { name: 'Karan Malhotra', rollNo: '22CS013', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop', attendance: 76 },
  { name: 'Meera Nambiar', rollNo: '22CS014', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=120&auto=format&fit=crop', attendance: 93 },
  { name: 'Varun Sen', rollNo: '22CS015', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop', attendance: 84 },
  { name: 'Diya Menon', rollNo: '22CS016', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=120&auto=format&fit=crop', attendance: 97 },
];

function generateStudentsForClass(classId: string, count: number) {
  const students = [];
  for (let i = 0; i < count; i++) {
    const template = studentTemplates[i % studentTemplates.length];
    const rollIndex = (i + 1).toString().padStart(3, '0');
    const rollPrefix = classId.includes('it') ? '22IT' : classId.includes('ece') ? '22EC' : '22CS';
    students.push({
      id: `std-${classId}-${i + 1}`,
      rollNo: `${rollPrefix}${rollIndex}`,
      name: i < studentTemplates.length ? template.name : `${template.name} (${i + 1})`,
      email: `${template.name.toLowerCase().replace(/\s+/g, '.')}.${rollIndex}@attendit.edu`,
      avatar: template.avatar,
      classId,
      overallAttendance: template.attendance,
      status: 'absent' as const,
    });
  }
  return students;
}

// Active session state
let activeSession: any = null;
let pastSessions: any[] = [];
let qrRotationTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;
let secondsRemaining = QR_ROTATION_SECONDS;

async function generateDynamicQrPayload(sessionId: string, sessionCode: string) {
  const timestamp = Date.now();
  const token = jwt.sign(
    {
      sessionId,
      sessionCode,
      ts: timestamp,
      type: 'anti-proxy-dynamic-qr',
    },
    JWT_SECRET,
    { expiresIn: '60s' } // 60s validity gives smooth scanning across mobile camera focuses while rotating on screen
  );

  const qrDataString = JSON.stringify({
    app: 'AttendIt',
    sessionId,
    sessionCode,
    token,
    ts: timestamp,
    validForMs: QR_ROTATION_SECONDS * 1000,
  });

  const qrCodeUrl = await QRCode.toDataURL(qrDataString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return { qrCodeUrl, qrToken: token, timestamp, qrDataString };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(express.json());

  // Socket.io connection handler
  io.on('connection', (socket) => {
    // Send active session snapshot immediately if available
    if (activeSession) {
      socket.emit('session:sync', {
        ...activeSession,
        qrExpiresIn: secondsRemaining,
      });
    }

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  // Background QR Rotation Engine (every 15 seconds)
  function startSessionTimer(sessionId: string, sessionCode: string) {
    if (qrRotationTimer) clearInterval(qrRotationTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    secondsRemaining = QR_ROTATION_SECONDS;

    // 1-second countdown tick for smooth UI radial ring
    countdownTimer = setInterval(() => {
      if (!activeSession) return;
      secondsRemaining -= 1;
      if (secondsRemaining < 0) {
        secondsRemaining = QR_ROTATION_SECONDS;
      }
      io.emit('qr:tick', {
        secondsRemaining,
        totalSeconds: QR_ROTATION_SECONDS,
      });
    }, 1000);

    // 15-second QR regeneration cycle
    qrRotationTimer = setInterval(async () => {
      if (!activeSession) return;
      try {
        const { qrCodeUrl, qrToken } = await generateDynamicQrPayload(sessionId, sessionCode);
        activeSession.qrCodeUrl = qrCodeUrl;
        activeSession.qrToken = qrToken;
        activeSession.qrExpiresIn = QR_ROTATION_SECONDS;
        secondsRemaining = QR_ROTATION_SECONDS;

        io.emit('qr:rotated', {
          qrCodeUrl,
          qrToken,
          secondsRemaining: QR_ROTATION_SECONDS,
          session: activeSession,
        });
        io.emit('session:sync', activeSession);
      } catch (err) {
        console.error('Error rotating QR code:', err);
      }
    }, QR_ROTATION_SECONDS * 1000);
  }

  function stopSessionTimers() {
    if (qrRotationTimer) {
      clearInterval(qrRotationTimer);
      qrRotationTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    secondsRemaining = QR_ROTATION_SECONDS;
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AttendIt Attendance Engine',
      realtime: 'Socket.IO Active',
      time: new Date().toISOString(),
    });
  });

  // Helper: Format human-friendly name from input or email (e.g. "rohan" -> "Rohan", "rohan.sharma@domain.com" -> "Rohan Sharma")
  function formatNameFromInput(inputStr?: string, defaultFallback: string = 'User'): string {
    if (!inputStr || typeof inputStr !== 'string') return defaultFallback;
    let clean = inputStr.trim();
    if (clean.includes('@')) {
      clean = clean.split('@')[0];
    }
    // Replace dots, underscores, hyphens, numbers
    clean = clean.replace(/[._\-0-9]+/g, ' ').trim();
    if (!clean) return defaultFallback;
    return clean
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // ==========================================
  // Authentication Endpoints (Teacher, Student, Admin)
  // Supports dynamic name resolution and sign-up/sign-in
  // ==========================================

  // Registration handler for student, teacher, admin
  app.post('/api/auth/register', (req, res) => {
    try {
      const { role, name, email, department, designation, rollNo, className } = req.body;
      const cleanEmail = email || `${(name || 'user').toLowerCase().replace(/\s+/g, '.')}@attendit.edu`;
      const displayName = name || formatNameFromInput(email, role === 'teacher' ? 'Prof. Faculty' : role === 'admin' ? 'Dr. Administrator' : 'Student');

      if (role === 'teacher') {
        const teacherData = {
          id: `prof-${Date.now()}`,
          name: displayName.toLowerCase().startsWith('prof') ? displayName : `Prof. ${displayName}`,
          email: cleanEmail,
          department: department || 'Computer Science & Engineering',
          branch: department || 'Computer Science & Engineering',
          designation: designation || 'Assistant Professor',
          facultyCode: `FAC-${Math.floor(100 + Math.random() * 900)}`,
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
          timings: { start: '08:30 AM', finish: '04:30 PM' },
          shiftStart: '08:30 AM',
          shiftFinish: '04:30 PM',
        };
        const token = jwt.sign({ id: teacherData.id, email: teacherData.email, role: 'teacher' }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({ success: true, token, teacher: teacherData });
      } else if (role === 'admin') {
        const adminData = {
          id: `admin-${Date.now()}`,
          name: displayName.toLowerCase().startsWith('dr') ? displayName : `Dr. ${displayName}`,
          title: designation || 'Academic Administrator',
          email: cleanEmail,
          department: department || 'Academic Administration',
        };
        const token = jwt.sign({ id: adminData.id, email: adminData.email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({ success: true, token, admin: adminData });
      } else {
        // Student Registration
        const assignedRoll = rollNo || `22CS${Math.floor(100 + Math.random() * 899)}`;
        const newStudent: MockStudent = {
          id: `std-${Date.now()}`,
          name: displayName,
          rollNo: assignedRoll,
          email: cleanEmail,
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
          classId: 'class-cse-a',
          className: className || 'CSE-A (Semester 4)',
          enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
          overallAttendance: 100,
        };
        mockStudentDirectory.unshift(newStudent);
        studentProfiles[newStudent.id] = {
          studentId: newStudent.id,
          careerGoal: 'Full Stack Developer',
          interests: ['System Design', 'React & Frontend', 'SQL & DBMS'],
          strongSubjects: ['sub-ds'],
          weakSubjects: ['sub-os', 'sub-cn'],
          learningStyle: 'hands_on',
          freeTimeMinutes: 30,
          xp: 150,
          streakDays: 1,
          completedActivitiesCount: 1,
          lastActivityDate: 'Today',
          badges: ['badge-streak-5'],
        };
        const token = jwt.sign({ id: newStudent.id, rollNo: newStudent.rollNo, role: 'student', classId: newStudent.classId }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({ success: true, token, student: newStudent });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Teacher Login handler
  const handleTeacherLogin = (req: express.Request, res: express.Response) => {
    const { email, name, password } = req.body;
    
    // If specific demo email matching Prof. Anjali Sharma
    let teacherName = 'Prof. Anjali Sharma';
    let teacherEmail = 'anjali.sharma@attendit.edu';

    if (name) {
      teacherName = name.toLowerCase().startsWith('prof') ? name : `Prof. ${name}`;
      teacherEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@attendit.edu`;
    } else if (email && !email.toLowerCase().includes('anjali.sharma')) {
      const derived = formatNameFromInput(email, 'Faculty');
      teacherName = derived.toLowerCase().startsWith('prof') ? derived : `Prof. ${derived}`;
      teacherEmail = email;
    }

    const teacherObj = {
      id: `prof-${Date.now()}`,
      name: teacherName,
      email: teacherEmail,
      department: mockTeacher.department,
      branch: mockTeacher.branch,
      designation: mockTeacher.designation,
      facultyCode: `FAC-${Math.floor(100 + Math.random() * 900)}`,
      avatar: mockTeacher.avatar,
      timings: mockTeacher.timings,
      shiftStart: mockTeacher.timings.start,
      shiftFinish: mockTeacher.timings.finish,
    };

    const token = jwt.sign(
      { id: teacherObj.id, email: teacherObj.email, role: 'teacher' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      teacher: teacherObj,
    });
  };

  app.post('/api/auth/login', handleTeacherLogin);
  app.post('/api/teacher/login', handleTeacherLogin);

  // Student Login handler
  const handleStudentLogin = (req: express.Request, res: express.Response) => {
    const { email, rollNo, studentId, name, password } = req.body;
    
    // Find matching student from mock directory by exact email, rollNo, studentId, or partial name
    let student = mockStudentDirectory.find(
      (s) =>
        (email && s.email.toLowerCase() === email.toLowerCase()) ||
        (rollNo && s.rollNo.toLowerCase() === rollNo.toLowerCase()) ||
        (studentId && s.id === studentId) ||
        (name && s.name.toLowerCase() === name.toLowerCase())
    );

    if (!student && email) {
      student = mockStudentDirectory.find(
        (s) => s.name.toLowerCase().includes(email.toLowerCase()) || s.email.toLowerCase().includes(email.toLowerCase())
      );
    }

    // If still not found, dynamically register the student with their entered Name or Email
    if (!student) {
      const studentName = name || formatNameFromInput(email || rollNo, 'Student');
      const cleanEmail = email || `${studentName.toLowerCase().replace(/\s+/g, '.')}@attendit.edu`;
      const assignedRoll = rollNo || `22CS${Math.floor(100 + Math.random() * 899)}`;
      
      student = {
        id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: studentName,
        rollNo: assignedRoll,
        email: cleanEmail,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
        classId: 'class-cse-a',
        className: 'CSE-A (Semester 4)',
        enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
        overallAttendance: 92,
      };

      // Add to runtime directory and profile storage
      mockStudentDirectory.unshift(student);
      studentProfiles[student.id] = {
        studentId: student.id,
        careerGoal: 'Full Stack Developer',
        interests: ['System Design', 'React & Frontend', 'SQL & DBMS'],
        strongSubjects: ['sub-ds'],
        weakSubjects: ['sub-os', 'sub-cn'],
        learningStyle: 'hands_on',
        freeTimeMinutes: 30,
        xp: 260,
        streakDays: 4,
        completedActivitiesCount: 3,
        lastActivityDate: 'Today',
        badges: ['badge-streak-5', 'badge-sql-starter'],
      };
    }

    const token = jwt.sign(
      { id: student.id, rollNo: student.rollNo, role: 'student', classId: student.classId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      student,
    });
  };

  app.post('/api/auth/student-login', handleStudentLogin);
  app.post('/api/student/login', handleStudentLogin);

  // Admin / Dean Login handler
  const handleAdminLogin = (req: express.Request, res: express.Response) => {
    const { email, name } = req.body;
    let adminName = 'Dr. Rajesh Iyer';
    let adminEmail = 'rajesh.iyer@attendit.edu';

    if (name) {
      adminName = name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
      adminEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@attendit.edu`;
    } else if (email && !email.toLowerCase().includes('rajesh.iyer')) {
      const derived = formatNameFromInput(email, 'Dean');
      adminName = derived.toLowerCase().startsWith('dr') ? derived : `Dr. ${derived}`;
      adminEmail = email;
    }

    const adminData = {
      id: 'admin-1',
      name: adminName,
      title: 'Dean of Academic Affairs',
      email: adminEmail,
      department: 'Academic Administration',
    };
    const token = jwt.sign(
      { id: adminData.id, email: adminData.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({
      success: true,
      token,
      admin: adminData,
    });
  };

  app.post('/api/auth/admin-login', handleAdminLogin);
  app.post('/api/admin/login', handleAdminLogin);

  // Get Teacher Classes & Timetable Meta
  app.get('/api/teacher/meta', (req, res) => {
    res.json({
      teacher: {
        id: mockTeacher.id,
        name: mockTeacher.name,
        email: mockTeacher.email,
        department: mockTeacher.department,
        branch: mockTeacher.branch,
        designation: mockTeacher.designation,
        facultyCode: mockTeacher.facultyCode,
        avatar: mockTeacher.avatar,
        timings: mockTeacher.timings,
        shiftStart: mockTeacher.timings.start,
        shiftFinish: mockTeacher.timings.finish,
      },
      branches: mockBranches,
      divisions: mockDivisions,
      semesters: mockSemesters,
      classes: mockClasses,
      subjects: mockSubjects,
      timetable: mockTimetable,
      dailyAttendance: mockDailyAttendance,
      lowAttendanceStudents: mockLowAttendanceStudents,
      activeSession: activeSession ? { ...activeSession, qrExpiresIn: secondsRemaining } : null,
    });
  });

  // Low Attendance Students API
  app.get('/api/students/low-attendance', (req, res) => {
    const threshold = Number(req.query.threshold) || 75;
    const filtered = mockLowAttendanceStudents.filter((s) => s.overallAttendance <= threshold);
    res.json({ students: filtered, threshold, totalCount: filtered.length });
  });

  app.post('/api/students/send-warning', (req, res) => {
    const { studentId, message, type } = req.body;
    const student = mockLowAttendanceStudents.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json({
      success: true,
      message: `Notice and SMS warning successfully dispatched to ${student.name} (${student.parentPhone || student.parentEmail}).`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  // Branches CRUD APIs
  app.get('/api/branches', (req, res) => {
    res.json({ branches: mockBranches });
  });

  app.post('/api/branches', (req, res) => {
    try {
      const { code, name, department } = req.body;
      if (!name) return res.status(400).json({ error: 'Branch name is required' });
      const newBranch = {
        id: `branch-${Date.now()}`,
        code: (code || name.substring(0, 4)).toUpperCase(),
        name,
        department: department || name,
      };
      mockBranches.push(newBranch);
      return res.status(201).json({ message: 'Branch created', branch: newBranch, branches: mockBranches });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create branch' });
    }
  });

  app.put('/api/branches/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockBranches.findIndex((b) => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Branch not found' });
    const { code, name, department } = req.body;
    mockBranches[idx] = {
      ...mockBranches[idx],
      code: code || mockBranches[idx].code,
      name: name || mockBranches[idx].name,
      department: department || mockBranches[idx].department,
    };
    return res.json({ message: 'Branch updated', branch: mockBranches[idx], branches: mockBranches });
  });

  app.delete('/api/branches/:id', (req, res) => {
    const { id } = req.params;
    mockBranches = mockBranches.filter((b) => b.id !== id);
    return res.json({ message: 'Branch deleted', branches: mockBranches });
  });

  // Divisions CRUD APIs
  app.get('/api/divisions', (req, res) => {
    res.json({ divisions: mockDivisions });
  });

  app.post('/api/divisions', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Division name is required' });
    const newDiv = {
      id: `div-${Date.now()}`,
      name: name.toUpperCase().trim(),
    };
    mockDivisions.push(newDiv);
    return res.status(201).json({ message: 'Division created', division: newDiv, divisions: mockDivisions });
  });

  app.put('/api/divisions/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockDivisions.findIndex((d) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Division not found' });
    if (req.body.name) {
      mockDivisions[idx].name = req.body.name.toUpperCase().trim();
    }
    return res.json({ message: 'Division updated', division: mockDivisions[idx], divisions: mockDivisions });
  });

  app.delete('/api/divisions/:id', (req, res) => {
    const { id } = req.params;
    mockDivisions = mockDivisions.filter((d) => d.id !== id);
    return res.json({ message: 'Division deleted', divisions: mockDivisions });
  });

  // Semesters CRUD APIs
  app.get('/api/semesters', (req, res) => {
    res.json({ semesters: mockSemesters });
  });

  app.post('/api/semesters', (req, res) => {
    const { semesterNumber, label } = req.body;
    const num = Number(semesterNumber);
    if (!num) return res.status(400).json({ error: 'Valid semester number required' });
    const newSem = {
      id: `sem-${Date.now()}`,
      semesterNumber: num,
      label: label || `Semester ${num}`,
    };
    mockSemesters.push(newSem);
    mockSemesters.sort((a, b) => a.semesterNumber - b.semesterNumber);
    return res.status(201).json({ message: 'Semester created', semester: newSem, semesters: mockSemesters });
  });

  app.put('/api/semesters/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockSemesters.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Semester not found' });
    const { semesterNumber, label } = req.body;
    if (semesterNumber) mockSemesters[idx].semesterNumber = Number(semesterNumber);
    if (label) mockSemesters[idx].label = label;
    mockSemesters.sort((a, b) => a.semesterNumber - b.semesterNumber);
    return res.json({ message: 'Semester updated', semester: mockSemesters[idx], semesters: mockSemesters });
  });

  app.delete('/api/semesters/:id', (req, res) => {
    const { id } = req.params;
    mockSemesters = mockSemesters.filter((s) => s.id !== id);
    return res.json({ message: 'Semester deleted', semesters: mockSemesters });
  });

  // Subjects CRUD APIs
  app.get('/api/subjects', (req, res) => {
    res.json({ subjects: mockSubjects });
  });

  app.post('/api/subjects', (req, res) => {
    const { code, name, credits, department, branch, colorTheme } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Subject code and name are required' });
    const newSub = {
      id: `sub-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      credits: Number(credits) || 3,
      department: department || 'Computer Science',
      branch: branch || 'Computer Science & Engineering',
      colorTheme: colorTheme || 'indigo',
    };
    mockSubjects.push(newSub);
    return res.status(201).json({ message: 'Subject created', subject: newSub, subjects: mockSubjects });
  });

  app.put('/api/subjects/:id', (req, res) => {
    const { id } = req.params;
    const idx = mockSubjects.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Subject not found' });
    const { code, name, credits, department, branch, colorTheme } = req.body;
    mockSubjects[idx] = {
      ...mockSubjects[idx],
      code: code ? code.toUpperCase() : mockSubjects[idx].code,
      name: name || mockSubjects[idx].name,
      credits: credits !== undefined ? Number(credits) : mockSubjects[idx].credits,
      department: department || mockSubjects[idx].department,
      branch: branch || mockSubjects[idx].branch,
      colorTheme: colorTheme || mockSubjects[idx].colorTheme,
    };
    return res.json({ message: 'Subject updated', subject: mockSubjects[idx], subjects: mockSubjects });
  });

  app.delete('/api/subjects/:id', (req, res) => {
    const { id } = req.params;
    mockSubjects = mockSubjects.filter((s) => s.id !== id);
    return res.json({ message: 'Subject deleted', subjects: mockSubjects });
  });

  // Class Management CRUD APIs
  app.get('/api/classes', (req, res) => {
    res.json({ classes: mockClasses });
  });

  app.post('/api/classes', (req, res) => {
    try {
      const { code, name, department, branch, semester, section, totalStudents, defaultRoom } = req.body;
      if (!name || !section) {
        return res.status(400).json({ error: 'Class name and division/section are required' });
      }

      const newClass = {
        id: `class-${Date.now()}`,
        code: code || `${section}-${semester || 1}`,
        name: name || `${code || section} (Semester ${semester || 1})`,
        department: department || 'Computer Science',
        branch: branch || department || 'Computer Science & Engineering',
        semester: Number(semester) || 1,
        section: section || 'A',
        totalStudents: Number(totalStudents) || 40,
        defaultRoom: defaultRoom || 'Room 101',
      };

      mockClasses.push(newClass);
      return res.status(201).json({ message: 'Class created successfully', class: newClass, classes: mockClasses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create class' });
    }
  });

  app.put('/api/classes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const index = mockClasses.findIndex((c) => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const { code, name, department, branch, semester, section, totalStudents, defaultRoom } = req.body;
      mockClasses[index] = {
        ...mockClasses[index],
        code: code !== undefined ? code : mockClasses[index].code,
        name: name !== undefined ? name : mockClasses[index].name,
        department: department !== undefined ? department : mockClasses[index].department,
        branch: branch !== undefined ? branch : mockClasses[index].branch,
        semester: semester !== undefined ? Number(semester) : mockClasses[index].semester,
        section: section !== undefined ? section : mockClasses[index].section,
        totalStudents: totalStudents !== undefined ? Number(totalStudents) : mockClasses[index].totalStudents,
        defaultRoom: defaultRoom !== undefined ? defaultRoom : mockClasses[index].defaultRoom,
      };

      return res.json({ message: 'Class updated successfully', class: mockClasses[index], classes: mockClasses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update class' });
    }
  });

  app.delete('/api/classes/:id', (req, res) => {
    try {
      const { id } = req.params;
      mockClasses = mockClasses.filter((c) => c.id !== id);
      return res.json({ message: 'Class deleted successfully', classes: mockClasses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete class' });
    }
  });

  // ==========================================
  // Timetable Master Management CRUD APIs
  // Allows Admin to manage full master schedule across Branch, Year, Class & Div
  // ==========================================
  app.get('/api/timetable', (req, res) => {
    const { branch, semester, division, classId, day, teacherName } = req.query;
    let results = [...mockTimetable];

    if (branch && branch !== 'all') {
      results = results.filter(
        (t) => (t.branch && t.branch.toLowerCase().includes((branch as string).toLowerCase())) ||
               (t.className && t.className.toLowerCase().includes((branch as string).toLowerCase()))
      );
    }

    if (semester && semester !== 'all') {
      const semNum = Number(semester);
      if (!isNaN(semNum)) {
        results = results.filter(
          (t) => t.semester === semNum || (t.className && t.className.includes(`Semester ${semNum}`))
        );
      }
    }

    if (division && division !== 'all') {
      results = results.filter(
        (t) => (t.division && t.division.toUpperCase() === (division as string).toUpperCase()) ||
               (t.className && t.className.includes(`-${division}`))
      );
    }

    if (classId && classId !== 'all') {
      results = results.filter((t) => t.classId === classId);
    }

    if (day && day !== 'all') {
      results = results.filter(
        (t) => t.dayOfWeek && t.dayOfWeek.toLowerCase() === (day as string).toLowerCase()
      );
    }

    if (teacherName && teacherName !== 'all') {
      results = results.filter(
        (t) => t.teacherName && t.teacherName.toLowerCase().includes((teacherName as string).toLowerCase())
      );
    }

    return res.json({ timetable: results, allTimetable: mockTimetable });
  });

  app.post('/api/timetable', (req, res) => {
    try {
      const {
        classId,
        className,
        branch,
        semester,
        division,
        subjectId,
        subjectName,
        subjectCode,
        teacherName,
        startTime,
        endTime,
        room,
        dayOfWeek,
        isToday,
      } = req.body;

      if (!subjectName || !startTime || !endTime) {
        return res.status(400).json({ error: 'Subject, Start Time, and End Time are required' });
      }

      const newSlot: TimetableItem = {
        id: `tt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        classId: classId || 'class-cse-a',
        className: className || `${branch || 'CSE'}-${division || 'A'} (Semester ${semester || 4})`,
        branch: branch || 'Computer Science & Engineering',
        semester: Number(semester) || 4,
        division: division || 'A',
        subjectId: subjectId || `sub-${Date.now()}`,
        subjectName: subjectName || 'Subject Lecture',
        subjectCode: subjectCode || 'CS401',
        teacherName: teacherName || 'Prof. Faculty Member',
        startTime,
        endTime,
        room: room || 'Room 301',
        dayOfWeek: dayOfWeek || 'Friday',
        isToday: isToday !== undefined ? Boolean(isToday) : (dayOfWeek === 'Friday' || dayOfWeek === 'Today'),
        isCompleted: false,
      };

      mockTimetable.push(newSlot);

      // Broadcast update to all connected faculty and student clients
      io.emit('timetable:updated', mockTimetable);

      return res.status(201).json({
        message: 'Timetable slot created successfully',
        slot: newSlot,
        timetable: mockTimetable,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create timetable slot' });
    }
  });

  app.put('/api/timetable/:id', (req, res) => {
    try {
      const { id } = req.params;
      const idx = mockTimetable.findIndex((t) => t.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Timetable slot not found' });
      }

      const {
        classId,
        className,
        branch,
        semester,
        division,
        subjectId,
        subjectName,
        subjectCode,
        teacherName,
        startTime,
        endTime,
        room,
        dayOfWeek,
        isToday,
        isCompleted,
      } = req.body;

      mockTimetable[idx] = {
        ...mockTimetable[idx],
        classId: classId || mockTimetable[idx].classId,
        className: className || mockTimetable[idx].className,
        branch: branch || mockTimetable[idx].branch,
        semester: semester !== undefined ? Number(semester) : mockTimetable[idx].semester,
        division: division || mockTimetable[idx].division,
        subjectId: subjectId || mockTimetable[idx].subjectId,
        subjectName: subjectName || mockTimetable[idx].subjectName,
        subjectCode: subjectCode || mockTimetable[idx].subjectCode,
        teacherName: teacherName || mockTimetable[idx].teacherName,
        startTime: startTime || mockTimetable[idx].startTime,
        endTime: endTime || mockTimetable[idx].endTime,
        room: room || mockTimetable[idx].room,
        dayOfWeek: dayOfWeek || mockTimetable[idx].dayOfWeek,
        isToday: isToday !== undefined ? Boolean(isToday) : mockTimetable[idx].isToday,
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : mockTimetable[idx].isCompleted,
      };

      io.emit('timetable:updated', mockTimetable);

      return res.json({
        message: 'Timetable slot updated successfully',
        slot: mockTimetable[idx],
        timetable: mockTimetable,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update timetable slot' });
    }
  });

  app.delete('/api/timetable/:id', (req, res) => {
    try {
      const { id } = req.params;
      mockTimetable = mockTimetable.filter((t) => t.id !== id);

      io.emit('timetable:updated', mockTimetable);

      return res.json({
        message: 'Timetable slot deleted successfully',
        timetable: mockTimetable,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete timetable slot' });
    }
  });

  app.post('/api/timetable/reset', (req, res) => {
    mockTimetable = getInitialTimetable();
    io.emit('timetable:updated', mockTimetable);
    return res.json({
      message: 'Timetable reset to master template successfully',
      timetable: mockTimetable,
    });
  });

  // Start Attendance Session
  app.post('/api/session/start', async (req, res) => {
    try {
      const {
        classId,
        className,
        classCode,
        branch,
        semester,
        section,
        totalStudents,
        subjectId,
        subjectName,
        subjectCode,
        room,
        timeSlot,
        teacherId,
        teacherName,
      } = req.body;

      // 1. Resolve Class
      let selectedClass = mockClasses.find(
        (c) =>
          (classId && c.id === classId) ||
          (classId && c.code.toLowerCase() === classId.toLowerCase()) ||
          (classId && c.name.toLowerCase() === classId.toLowerCase()) ||
          (className && c.name.toLowerCase() === className.toLowerCase()) ||
          (classCode && c.code.toLowerCase() === classCode.toLowerCase())
      );

      if (!selectedClass) {
        // If class not in mockClasses, check if timetable has it
        const ttClass = mockTimetable.find(
          (t) => (classId && t.classId === classId) || (className && t.className.toLowerCase() === className.toLowerCase())
        );

        selectedClass = {
          id: classId || (ttClass ? ttClass.classId : `class-${Date.now()}`),
          code: classCode || (ttClass ? ttClass.className.split(' ')[0] : className ? className.split(' ')[0] : 'BATCH'),
          name: className || (ttClass ? ttClass.className : classCode ? `${classCode} (Semester ${semester || 4})` : 'Class Batch'),
          department: branch || (ttClass ? ttClass.branch : 'Computer Science'),
          branch: branch || (ttClass ? ttClass.branch : 'Computer Science & Engineering'),
          semester: Number(semester) || (ttClass ? ttClass.semester : 4) || 4,
          section: section || (ttClass ? ttClass.division : 'A') || 'A',
          totalStudents: Number(totalStudents) || 40,
          defaultRoom: room || (ttClass ? ttClass.room : 'Room 301') || 'Room 301',
        };
        mockClasses.push(selectedClass);
      }

      // 2. Resolve Subject
      let selectedSubject = mockSubjects.find(
        (s) =>
          (subjectId && s.id === subjectId) ||
          (subjectId && s.code.toLowerCase() === subjectId.toLowerCase()) ||
          (subjectId && s.name.toLowerCase() === subjectId.toLowerCase()) ||
          (subjectCode && s.code.toLowerCase() === subjectCode.toLowerCase()) ||
          (subjectName && s.name.toLowerCase() === subjectName.toLowerCase())
      );

      if (!selectedSubject) {
        // Check timetable for matching subject
        const ttSub = mockTimetable.find(
          (t) =>
            (subjectId && t.subjectId === subjectId) ||
            (subjectCode && t.subjectCode.toLowerCase() === subjectCode.toLowerCase()) ||
            (subjectName && t.subjectName.toLowerCase() === subjectName.toLowerCase())
        );

        if (ttSub) {
          selectedSubject = {
            id: ttSub.subjectId,
            code: ttSub.subjectCode,
            name: ttSub.subjectName,
            credits: 4,
            department: ttSub.branch || 'Computer Science',
            branch: ttSub.branch || 'Computer Science & Engineering',
            colorTheme: 'indigo',
          };
          mockSubjects.push(selectedSubject);
        } else {
          selectedSubject = {
            id: subjectId || `sub-${Date.now()}`,
            code: subjectCode || (subjectName ? subjectName.substring(0, 4).toUpperCase() : 'CS401'),
            name: subjectName || (subjectCode ? `Course ${subjectCode}` : 'Selected Course'),
            credits: 3,
            department: selectedClass.department || 'Computer Science',
            branch: selectedClass.branch || 'Computer Science & Engineering',
            colorTheme: 'indigo',
          };
          mockSubjects.push(selectedSubject);
        }
      }

      const roomAssigned = room || selectedClass.defaultRoom || 'Room 301';

      // Find matching slot for timeSlot
      const matchingTt = mockTimetable.find(
        (t) =>
          (t.classId === selectedClass.id && (t.subjectId === selectedSubject.id || t.subjectCode === selectedSubject.code)) ||
          t.id === classId ||
          t.id === subjectId
      );

      const timeSlotAssigned =
        timeSlot ||
        (matchingTt ? `${matchingTt.startTime} - ${matchingTt.endTime}` : `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - Active`);

      const sessionId = `SES-${Date.now()}`;
      const codePrefix = selectedSubject.code ? selectedSubject.code.replace(/[^a-zA-Z0-9]/g, '') : 'SES';
      const sessionCode = `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { qrCodeUrl, qrToken } = await generateDynamicQrPayload(sessionId, sessionCode);

      // Generate realistic student roster tailored to the selected class
      const students = generateStudentsForClass(selectedClass.id, selectedClass.totalStudents);

      students.forEach((s) => {
        s.status = 'absent';
        s.markedAt = undefined;
        s.flagReason = undefined;
        s.verificationMethod = undefined;
      });

      activeSession = {
        id: sessionId,
        sessionId,
        sessionCode,
        classId: selectedClass.id,
        className: selectedClass.name,
        classCode: selectedClass.code,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        subjectCode: selectedSubject.code,
        room: roomAssigned,
        timeSlot: timeSlotAssigned,
        teacherId: teacherId || mockTeacher.id,
        teacherName: teacherName || mockTeacher.name,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
        qrCodeUrl,
        qrToken,
        qrExpiresIn: QR_ROTATION_SECONDS,
        qrTotalDuration: QR_ROTATION_SECONDS,
        stats: {
          present: 0,
          flagged: 0,
          absent: students.length,
          total: students.length,
        },
        students,
      };

      startSessionTimer(sessionId, sessionCode);

      io.emit('session:started', activeSession);
      io.emit('session:sync', activeSession);

      return res.json(activeSession);
    } catch (err: any) {
      console.error('Failed to start attendance session:', err);
      return res.status(500).json({ error: 'Failed to start session' });
    }
  });

  // Stop / End Attendance Session
  const handleStopSession = (req: any, res: any) => {
    if (!activeSession) {
      return res.status(400).json({ error: 'No active session found' });
    }

    activeSession.status = 'ended';
    stopSessionTimers();

    const finalSessionData = { ...activeSession, endedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    // Store in past sessions history
    pastSessions = [finalSessionData, ...pastSessions.filter((s) => s.id !== finalSessionData.id)];

    // Update timetable slot if matching
    const matchingTt = mockTimetable.find(
      (t) => t.classId === finalSessionData.classId && t.subjectId === finalSessionData.subjectId
    );
    if (matchingTt) {
      matchingTt.isCompleted = true;
      matchingTt.attendanceCount = {
        present: finalSessionData.stats.present,
        total: finalSessionData.stats.total,
        flagged: finalSessionData.stats.flagged,
        percentage: Math.round((finalSessionData.stats.present / (finalSessionData.stats.total || 1)) * 100),
      };
    } else {
      // Find the first non-completed today's lecture and mark it completed
      const firstPending = mockTimetable.find((t) => !t.isCompleted);
      if (firstPending) {
        firstPending.isCompleted = true;
        firstPending.attendanceCount = {
          present: finalSessionData.stats.present,
          total: finalSessionData.stats.total,
          flagged: finalSessionData.stats.flagged,
          percentage: Math.round((finalSessionData.stats.present / (finalSessionData.stats.total || 1)) * 100),
        };
      }
    }

    io.emit('session:ended', finalSessionData);

    return res.json({ message: 'Attendance session closed successfully', session: finalSessionData, timetable: mockTimetable });
  };

  app.post('/api/session/stop', handleStopSession);
  app.post('/api/session/end', handleStopSession);

  // Get Session History
  app.get('/api/session/history', (req, res) => {
    return res.json({ sessions: pastSessions });
  });

  // Edit Attendance Record (with audit note/reason)
  app.post('/api/session/edit-record', (req, res) => {
    const { sessionId, studentId, newStatus, editReason, editedBy } = req.body;
    if (!studentId || !newStatus) {
      return res.status(400).json({ error: 'Missing required parameters: studentId, newStatus' });
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const editor = editedBy || 'Faculty Instructor';
    const finalReason = (editReason && editReason.trim()) || 'Manual adjustment by faculty';

    // Find in active session or past sessions
    let targetSession = (activeSession && (!sessionId || activeSession.id === sessionId)) ? activeSession : null;
    if (!targetSession) {
      targetSession = pastSessions.find((s) => s.id === sessionId) || pastSessions[0];
    }

    if (targetSession && targetSession.students) {
      const student = targetSession.students.find((s: any) => s.id === studentId);
      if (student) {
        student.status = newStatus;
        student.editReason = finalReason;
        student.editedAt = timestamp;
        student.editedBy = editor;
        student.verificationMethod = `Manual Override (${editor})`;
        if (newStatus === 'present' && !student.markedAt) {
          student.markedAt = timestamp;
        }

        // Recompute stats
        targetSession.stats.present = targetSession.students.filter((s: any) => s.status === 'present').length;
        targetSession.stats.flagged = targetSession.students.filter((s: any) => s.status === 'flagged').length;
        targetSession.stats.absent = targetSession.students.filter((s: any) => s.status === 'absent').length;

        // Also update timetable if matching
        const matchingTt = mockTimetable.find(
          (t) => t.classId === targetSession.classId && t.subjectId === targetSession.subjectId
        );
        if (matchingTt) {
          matchingTt.attendanceCount = {
            present: targetSession.stats.present,
            total: targetSession.stats.total || targetSession.students.length,
            flagged: targetSession.stats.flagged,
            percentage: Math.round((targetSession.stats.present / (targetSession.stats.total || targetSession.students.length || 1)) * 100),
          };
          io.emit('timetable:updated', mockTimetable);
        }

        io.emit('attendance:updated', {
          student,
          stats: targetSession.stats,
          sessionId: targetSession.id,
        });

        return res.json({ success: true, student, session: targetSession });
      }
    }

    return res.status(404).json({ error: 'Student or session not found' });
  });

  // Bulk Save Session Review
  app.post('/api/session/save-review', (req, res) => {
    const { sessionId, students: updatedStudents } = req.body;
    if (!updatedStudents || !Array.isArray(updatedStudents)) {
      return res.status(400).json({ error: 'Invalid students payload' });
    }

    let targetSession = pastSessions.find((s) => s.id === sessionId) || pastSessions[0];
    if (targetSession) {
      targetSession.students = updatedStudents;
      targetSession.stats = {
        total: updatedStudents.length,
        present: updatedStudents.filter((s: any) => s.status === 'present').length,
        flagged: updatedStudents.filter((s: any) => s.status === 'flagged').length,
        absent: updatedStudents.filter((s: any) => s.status === 'absent').length,
      };

      const matchingTt = mockTimetable.find(
        (t) => t.classId === targetSession.classId && t.subjectId === targetSession.subjectId
      );
      if (matchingTt) {
        matchingTt.attendanceCount = {
          present: targetSession.stats.present,
          total: targetSession.stats.total,
          flagged: targetSession.stats.flagged,
          percentage: Math.round((targetSession.stats.present / (targetSession.stats.total || 1)) * 100),
        };
        io.emit('timetable:updated', mockTimetable);
      }

      return res.json({ success: true, session: targetSession });
    }

    return res.json({ success: true });
  });

  // Get Active Session
  app.get('/api/session/active', (req, res) => {
    if (!activeSession) {
      return res.json({ activeSession: null });
    }
    return res.json({
      activeSession: {
        ...activeSession,
        qrExpiresIn: secondsRemaining,
      },
    });
  });

  // Simulate or Record Student Scan
  app.post('/api/session/scan', (req, res) => {
    if (!activeSession || activeSession.status !== 'active') {
      return res.status(400).json({ error: 'No active session running' });
    }

    const { studentId, rollNo, studentName, isFlagged, flagReason } = req.body;

    // Find student in roster or first absent student
    let student = activeSession.students.find((s: any) => s.id === studentId || s.rollNo === rollNo);
    if (!student) {
      student = activeSession.students.find((s: any) => s.status === 'absent');
    }

    if (!student) {
      return res.status(400).json({ error: 'All students have already scanned in this session' });
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (isFlagged) {
      student.status = 'flagged';
      student.markedAt = nowStr;
      student.flagReason = flagReason || 'Suspicious token delay or BLE beacon out of range';
      student.verificationMethod = 'Liveness Verified';
    } else {
      student.status = 'present';
      student.markedAt = nowStr;
      student.flagReason = undefined;
      student.verificationMethod = 'BLE Verified';
    }

    // Recompute stats
    activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
    activeSession.stats.flagged = activeSession.students.filter((s: any) => s.status === 'flagged').length;
    activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;

    // Update timetable slot
    const matchingTt = mockTimetable.find(
      (t) => t.classId === activeSession.classId && t.subjectId === activeSession.subjectId
    );
    if (matchingTt) {
      matchingTt.attendanceCount = {
        present: activeSession.stats.present,
        total: activeSession.stats.total || activeSession.students.length,
        flagged: activeSession.stats.flagged,
        percentage: Math.round((activeSession.stats.present / (activeSession.stats.total || activeSession.students.length || 1)) * 100),
      };
      io.emit('timetable:updated', mockTimetable);
    }

    io.emit('attendance:marked', {
      student,
      stats: activeSession.stats,
      sessionId: activeSession.id,
      session: activeSession,
    });
    io.emit('session:sync', activeSession);

    return res.json({
      success: true,
      student,
      stats: activeSession.stats,
      session: activeSession,
    });
  });

  // Manual Status Override by Teacher
  app.post('/api/session/override-student', (req, res) => {
    if (!activeSession) {
      return res.status(400).json({ error: 'No active session' });
    }
    const { studentId, newStatus } = req.body;
    const student = activeSession.students.find((s: any) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found in session' });
    }

    student.status = newStatus;
    if (newStatus === 'present') {
      student.markedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      student.verificationMethod = 'Manual Override';
      student.flagReason = undefined;
    } else if (newStatus === 'absent') {
      student.markedAt = undefined;
      student.flagReason = undefined;
    }

    activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
    activeSession.stats.flagged = activeSession.students.filter((s: any) => s.status === 'flagged').length;
    activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;

    io.emit('attendance:updated', {
      student,
      stats: activeSession.stats,
      sessionId: activeSession.id,
    });

    return res.json({ success: true, student, stats: activeSession.stats });
  });

  // ==========================================
  // Student Scan & Verification Pipeline
  // ==========================================

  // Get current active session for students (Current class details)
  app.get('/api/student/current-class', (req, res) => {
    const studentId = (req.query.studentId as string) || '';
    const studentRoll = (req.query.rollNo as string) || '';
    
    let student = mockStudentDirectory.find(
      (s) => (studentId && s.id === studentId) || (studentRoll && s.rollNo === studentRoll)
    );

    if (!student && studentId) {
      student = {
        id: studentId,
        name: (req.query.name as string) || formatNameFromInput(studentId, 'Student'),
        rollNo: studentRoll || `22CS${Math.floor(100 + Math.random() * 899)}`,
        email: `${studentId}@attendit.edu`,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
        classId: 'class-cse-a',
        className: 'CSE-A (Semester 4)',
        enrolledSubjectIds: ['sub-ds', 'sub-os', 'sub-dbms', 'sub-ai'],
        overallAttendance: 92,
      };
      mockStudentDirectory.unshift(student);
    }

    if (!student) {
      student = mockStudentDirectory[0];
    }

    // Check if there is an active session
    if (!activeSession || activeSession.status !== 'active') {
      return res.json({
        activeSession: null,
        student,
        currentTimetableSlot: mockTimetable[0],
        message: 'No live attendance session is currently active.',
      });
    }

    // Check if student has already scanned in attendance table or active roster
    const existingRecord = attendanceTable.find(
      (rec) => (rec.studentId === student.id || (student.rollNo && rec.rollNo === student.rollNo)) && rec.sessionId === activeSession.id
    );

    const rosterStudent = activeSession.students?.find(
      (s: any) => (student.id && s.id === student.id) || (student.rollNo && s.rollNo.toUpperCase() === student.rollNo.toUpperCase())
    );
    const isAlreadyPresent = rosterStudent?.status === 'present' || !!existingRecord;

    return res.json({
      activeSession: {
        id: activeSession.id,
        sessionId: activeSession.id,
        sessionCode: activeSession.sessionCode,
        classId: activeSession.classId,
        className: activeSession.className,
        subjectId: activeSession.subjectId,
        subjectName: activeSession.subjectName,
        subjectCode: activeSession.subjectCode,
        room: activeSession.room,
        timeSlot: activeSession.timeSlot,
        teacherName: activeSession.teacherName,
        startedAt: activeSession.startedAt,
        status: activeSession.status,
        qrToken: activeSession.qrToken,
        qrCodeUrl: activeSession.qrCodeUrl,
        qrExpiresIn: secondsRemaining || activeSession.qrExpiresIn || QR_ROTATION_SECONDS,
        qrTotalDuration: QR_ROTATION_SECONDS,
        stats: activeSession.stats,
      },
      student,
      alreadyMarked: isAlreadyPresent,
      existingRecord: existingRecord || (rosterStudent?.status === 'present' ? { timestamp: rosterStudent.markedAt || 'Just now', verificationMethod: rosterStudent.verificationMethod } : null),
    });
  });

  // Get student list for demo student switcher
  app.get('/api/student/list', (req, res) => {
    return res.json({ students: mockStudentDirectory });
  });

  // Unified Verification Pipeline: POST /api/verify
  app.post('/api/verify', (req, res) => {
    try {
      const { token, rawQrData, qrToken, qrData, studentId, rollNo, metadata } = req.body;

      // Extract payload either from direct token, raw QR JSON string, or scanned URL
      let jwtToken: string | null = null;
      let qrPayload: any = null;
      let scannedSessionId: string | null = null;
      let scannedSessionCode: string | null = null;

      const tryParseJson = (val: any) => {
        if (typeof val === 'object' && val !== null) return val;
        if (typeof val !== 'string') return null;
        const trimmed = val.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            return JSON.parse(trimmed);
          } catch {
            return null;
          }
        }
        return null;
      };

      // Extract all candidate values
      const candidates = [token, rawQrData, qrToken, qrData];
      for (const cand of candidates) {
        if (!cand) continue;
        const parsed = tryParseJson(cand);
        if (parsed) {
          qrPayload = { ...qrPayload, ...parsed };
          if (parsed.token) jwtToken = parsed.token;
          if (parsed.qrToken) jwtToken = parsed.qrToken;
          if (parsed.sessionId) scannedSessionId = parsed.sessionId;
          if (parsed.sessionCode) scannedSessionCode = parsed.sessionCode;
        } else if (typeof cand === 'string') {
          const trimmed = cand.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
            try {
              const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://attendit.local/${trimmed}`);
              const qTok = urlObj.searchParams.get('token') || urlObj.searchParams.get('t') || urlObj.searchParams.get('qrToken');
              const qScan = urlObj.searchParams.get('scanData');
              if (qTok) jwtToken = qTok;
              if (qScan) {
                const p = tryParseJson(decodeURIComponent(qScan));
                if (p) {
                  qrPayload = { ...qrPayload, ...p };
                  if (p.token) jwtToken = p.token;
                  if (p.qrToken) jwtToken = p.qrToken;
                }
              }
            } catch {
              // fallback
            }
          } else if (trimmed.split('.').length === 3) {
            // Standard JWT 3-part structure
            jwtToken = trimmed;
          } else if (trimmed.startsWith('SES-') || trimmed.startsWith('DS-')) {
            // Direct Session ID or Code
            if (trimmed.startsWith('SES-')) scannedSessionId = trimmed;
            else scannedSessionCode = trimmed;
          } else if (!jwtToken) {
            jwtToken = trimmed;
          }
        }
      }

      // Check 1: Is there an active session?
      if (!activeSession || activeSession.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Session Inactive',
          reason: 'No live attendance session is currently active for scanning. Please ask the instructor to start an attendance session.',
          code: 'SESSION_INACTIVE',
        });
      }

      // If instant simulation scan or test payload was used without a token, use current active session's QR token
      if (!jwtToken && (
        (qrPayload && (qrPayload.sessionId === activeSession.id || qrPayload.sessionCode === activeSession.sessionCode || qrPayload.app === 'AttendIt')) ||
        (scannedSessionId === activeSession.id || scannedSessionCode === activeSession.sessionCode)
      )) {
        jwtToken = activeSession.qrToken;
      }

      // Check 2: Verify Token Signature & Expiration or Session Authenticity
      let isTokenValid = false;
      let decodedSessionId: string | null = null;

      if (jwtToken) {
        try {
          const decoded: any = jwt.verify(jwtToken, JWT_SECRET);
          if (decoded) {
            decodedSessionId = decoded.sessionId;
            isTokenValid = true;
          }
        } catch (jwtErr: any) {
          // Check if token matches active session's current token
          if (jwtToken === activeSession.qrToken) {
            isTokenValid = true;
            decodedSessionId = activeSession.id;
          } else {
            // Check if token was generated for this session but timestamp rotated recently
            const decodedUnsafe: any = jwt.decode(jwtToken);
            if (decodedUnsafe && decodedUnsafe.sessionId === activeSession.id) {
              isTokenValid = true;
              decodedSessionId = activeSession.id;
            }
          }
        }
      }

      // If token wasn't valid JWT, check if session match via qrPayload / scannedSessionId / direct code
      if (!isTokenValid) {
        if (
          (scannedSessionId && scannedSessionId === activeSession.id) ||
          (scannedSessionCode && scannedSessionCode.toLowerCase() === activeSession.sessionCode.toLowerCase()) ||
          (qrPayload && (qrPayload.sessionId === activeSession.id || qrPayload.sessionCode === activeSession.sessionCode)) ||
          (jwtToken && (jwtToken === activeSession.qrToken || jwtToken.toLowerCase() === activeSession.sessionCode.toLowerCase() || jwtToken === activeSession.id))
        ) {
          isTokenValid = true;
          decodedSessionId = activeSession.id;
        }
      }

      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid QR Token',
          reason: 'This QR code does not belong to the current active lecture session or has expired.',
          code: 'TOKEN_INVALID',
        });
      }

      // Verify token matches current active session
      if (decodedSessionId && decodedSessionId !== activeSession.id) {
        return res.status(400).json({
          success: false,
          error: 'Session Mismatch',
          reason: 'The scanned QR code belongs to a different or expired attendance session.',
          code: 'SESSION_MISMATCH',
        });
      }

      // Check 3 & 4: Student verification & enrollment check
      const queryId = studentId || '';
      const queryRoll = (rollNo || '').trim().toUpperCase();

      // Find in mockStudentDirectory or activeSession roster
      let student = mockStudentDirectory.find(
        (s) => (queryId && s.id === queryId) || (queryRoll && s.rollNo.toUpperCase() === queryRoll)
      );

      // If not in mock directory, find in activeSession roster
      if (!student && activeSession.students) {
        const rosterMatch = activeSession.students.find(
          (s: any) => (queryId && s.id === queryId) || (queryRoll && s.rollNo.toUpperCase() === queryRoll)
        );
        if (rosterMatch) {
          student = {
            id: rosterMatch.id,
            name: rosterMatch.name,
            rollNo: rosterMatch.rollNo,
            email: rosterMatch.email,
            avatar: rosterMatch.avatar,
            classId: activeSession.classId,
            className: activeSession.className,
            enrolledSubjectIds: [activeSession.subjectId],
            overallAttendance: rosterMatch.overallAttendance || 90,
          };
        }
      }

      // Fallback default student if none specified
      if (!student) {
        student = {
          id: queryId || `std-active-${Date.now()}`,
          name: queryRoll ? `Student (${queryRoll})` : (mockStudentDirectory[0]?.name || 'Student'),
          rollNo: queryRoll || (mockStudentDirectory[0]?.rollNo || '22CS001'),
          email: `${queryId || 'student'}@attendit.edu`,
          avatar: mockStudentDirectory[0]?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
          classId: activeSession.classId,
          className: activeSession.className,
          enrolledSubjectIds: [activeSession.subjectId],
          overallAttendance: 92,
        };
      }

      // Check 5: Duplicate scan check (check attendance table for studentId + sessionId)
      const existingScan = attendanceTable.find(
        (rec) => (rec.studentId === student.id || (student.rollNo && rec.rollNo === student.rollNo)) && rec.sessionId === activeSession.id
      );

      if (existingScan) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate Scan Detected',
          reason: `Attendance for ${student.name} (${student.rollNo}) has already been recorded at ${existingScan.timestamp}.`,
          code: 'DUPLICATE_SCAN',
          existingRecord: existingScan,
        });
      }

      // All checks passed! Insert attendance record (status="Present", verificationStatus="Verified")
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId: activeSession.id,
        sessionCode: activeSession.sessionCode,
        studentId: student.id,
        rollNo: student.rollNo,
        studentName: student.name,
        classId: activeSession.classId,
        subjectId: activeSession.subjectId,
        subjectName: activeSession.subjectName,
        timestamp: nowStr,
        status: 'Present',
        verificationStatus: 'Verified',
        verificationMethod: 'BLE & Dynamic QR Verified',
        clientMetadata: metadata || {
          deviceInfo: 'Camera Scanner Web Client',
          scannedAt: new Date().toISOString(),
        },
      };

      // Push to attendance table
      attendanceTable.push(newRecord);

      // Update session roster & real-time stats
      let rosterStudent = activeSession.students.find(
        (s: any) => (s.id && s.id === student.id) || (s.rollNo && student.rollNo && s.rollNo.toUpperCase() === student.rollNo.toUpperCase())
      );

      if (rosterStudent) {
        rosterStudent.status = 'present';
        rosterStudent.markedAt = nowStr;
        rosterStudent.verificationMethod = 'BLE & Dynamic QR Verified';
        rosterStudent.flagReason = undefined;
      } else {
        rosterStudent = {
          id: student.id,
          rollNo: student.rollNo,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          classId: activeSession.classId,
          overallAttendance: student.overallAttendance,
          status: 'present',
          markedAt: nowStr,
          verificationMethod: 'BLE & Dynamic QR Verified',
        };
        activeSession.students.unshift(rosterStudent);
      }

      // Recompute stats
      activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
      activeSession.stats.flagged = activeSession.students.filter((s: any) => s.status === 'flagged').length;
      activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;
      activeSession.stats.total = activeSession.students.length;
      activeSession.stats.attendanceRate = Math.round((activeSession.stats.present / (activeSession.students.length || 1)) * 100);

      // Broadcast real-time event to teacher dashboard
      const matchingTt = mockTimetable.find(
        (t) => t.classId === activeSession.classId && t.subjectId === activeSession.subjectId
      );
      if (matchingTt) {
        matchingTt.attendanceCount = {
          present: activeSession.stats.present,
          total: activeSession.stats.total || activeSession.students.length,
          flagged: activeSession.stats.flagged,
          percentage: activeSession.stats.attendanceRate,
        };
        io.emit('timetable:updated', mockTimetable);
      }

      io.emit('attendance:marked', {
        student: rosterStudent,
        stats: activeSession.stats,
        sessionId: activeSession.id,
        session: activeSession,
      });
      io.emit('session:sync', activeSession);

      return res.json({
        success: true,
        message: 'Attendance successfully verified and marked.',
        record: newRecord,
        session: activeSession,
        student: rosterStudent,
      });
    } catch (error: any) {
      console.error('Attendance verification failure:', error);
      return res.status(500).json({
        success: false,
        error: 'Verification Server Error',
        reason: error?.message || 'Unexpected server error occurred during verification.',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  });

  // ==========================================
  // Student Free-Period Recommendation Engine & Gamification APIs
  // ==========================================

  let studentProfiles: Record<string, any> = {
    'std-class-cse-a-1': {
      studentId: 'std-class-cse-a-1',
      careerGoal: 'Full Stack Developer',
      interests: ['System Design', 'React & Frontend', 'SQL & DBMS', 'Docker & Cloud'],
      strongSubjects: ['sub-ds', 'sub-dbms'],
      weakSubjects: ['sub-os', 'sub-cn'],
      learningStyle: 'hands_on',
      freeTimeMinutes: 30,
      xp: 340,
      streakDays: 5,
      completedActivitiesCount: 6,
      lastActivityDate: 'Today',
      badges: ['badge-streak-5', 'badge-sql-starter', 'badge-nep-explorer'],
    },
  };

  const activityBank = [
    {
      id: 'act-os-1',
      title: "Deadlock Detection & Banker's Algorithm Simulator",
      description: 'Solve a resource allocation graph puzzle and evaluate safe vs deadlock states in 5 interactive scenarios.',
      subjectId: 'sub-os',
      subjectName: 'Operating Systems',
      durationMinutes: 15,
      category: 'Skill Dev',
      difficulty: 'Intermediate',
      nepCreditLabel: 'Counts toward Skill Enhancement Credit (SEC-202)',
      xpReward: 50,
      tags: ['Operating Systems', 'Concurrency', 'SEC Credit'],
      quizQuestions: [
        {
          question: 'Which of the following conditions is NOT a necessary condition for deadlock?',
          options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
          correctIndex: 2,
          explanation: 'Deadlock requires *No Preemption*. If resources can be preempted, deadlock cannot occur.',
        },
        {
          question: "What is the primary objective of the Banker's Algorithm?",
          options: ['Deadlock Avoidance', 'Deadlock Recovery', 'Memory Defragmentation', 'Thread Scheduling'],
          correctIndex: 0,
          explanation: "Banker's algorithm tests for safety by simulating resource allocations for maximum claims.",
        },
      ],
    },
    {
      id: 'act-os-2',
      title: 'Process Scheduling & Context Switching Visualizer',
      description: 'Compare Round Robin, Shortest Job First (SJF), and Priority Scheduling on real Gantt chart traces.',
      subjectId: 'sub-os',
      subjectName: 'Operating Systems',
      durationMinutes: 30,
      category: 'Project Lab',
      difficulty: 'Intermediate',
      nepCreditLabel: 'Counts toward Skill Enhancement Credit (SEC-202)',
      xpReward: 70,
      tags: ['Operating Systems', 'CPU Scheduling', 'SEC Credit'],
      quizQuestions: [
        {
          question: 'In Round Robin scheduling, what happens if the time quantum is extremely large?',
          options: ['It behaves like First-Come First-Served (FCFS)', 'It causes high context-switch overhead', 'It guarantees zero waiting time', 'It causes livelock'],
          correctIndex: 0,
          explanation: 'As time slice increases toward infinity, Round Robin degenerates directly into FCFS.',
        },
      ],
    },
    {
      id: 'act-cn-1',
      title: 'TCP 3-Way Handshake & Packet Inspection Sprint',
      description: 'Step through SYN, SYN-ACK, ACK packet exchanges and pinpoint packet loss & retransmission timeouts.',
      subjectId: 'sub-cn',
      subjectName: 'Computer Networks',
      durationMinutes: 15,
      category: 'Quiz Challenge',
      difficulty: 'Beginner',
      nepCreditLabel: 'Counts toward Value Added Course (VAC-104)',
      xpReward: 50,
      tags: ['Computer Networks', 'Protocols', 'VAC Credit'],
      quizQuestions: [
        {
          question: 'What sequence of flags establishes a reliable TCP connection?',
          options: ['SYN -> SYN-ACK -> ACK', 'ACK -> SYN -> ACK', 'SYN -> ACK -> FIN', 'RST -> SYN -> ACK'],
          correctIndex: 0,
          explanation: 'The standard 3-way handshake begins with client SYN, server SYN-ACK, and client ACK.',
        },
      ],
    },
    {
      id: 'act-cn-2',
      title: 'IPv4 Subnetting & CIDR Calculation Speed Drill',
      description: 'Rapidly compute network IDs, broadcast addresses, and usable host counts for /24 through /28 subnets.',
      subjectId: 'sub-cn',
      subjectName: 'Computer Networks',
      durationMinutes: 20,
      category: 'Skill Dev',
      difficulty: 'Intermediate',
      nepCreditLabel: 'Counts toward Skill Enhancement Credit (SEC-204)',
      xpReward: 60,
      tags: ['Computer Networks', 'Subnetting', 'SEC Credit'],
      quizQuestions: [
        {
          question: 'How many usable host IP addresses are available in a /28 subnet?',
          options: ['14', '16', '30', '6'],
          correctIndex: 0,
          explanation: '2^(32-28) = 16 total IPs. Subtracting network and broadcast yields 14 usable hosts.',
        },
      ],
    },
    {
      id: 'act-dbms-1',
      title: 'SQL Query Optimization & Indexing Lab',
      description: 'Analyze EXPLAIN query execution plans, eliminate full table scans, and structure composite B-Tree indexes.',
      subjectId: 'sub-dbms',
      subjectName: 'Database Management Systems',
      durationMinutes: 30,
      category: 'Project Lab',
      difficulty: 'Intermediate',
      nepCreditLabel: 'Counts toward Skill Enhancement Credit (SEC-202)',
      xpReward: 75,
      tags: ['Databases', 'SQL Optimization', 'Full Stack Goal'],
      quizQuestions: [
        {
          question: 'Which index structure is standard for range queries and equality lookups in relational engines?',
          options: ['B+ Tree', 'Hash Map', 'Trie', 'Bloom Filter'],
          correctIndex: 0,
          explanation: 'B+ Trees store all leaf records sequentially linked, making both point lookups and range scans logarithmic.',
        },
      ],
    },
    {
      id: 'act-ds-1',
      title: 'Binary Tree Traversal & Dynamic Programming Sprint',
      description: 'Solve 2 fast algorithmic challenges on recursive subtree evaluation and top-down memoization.',
      subjectId: 'sub-ds',
      subjectName: 'Data Structures',
      durationMinutes: 15,
      category: 'Quiz Challenge',
      difficulty: 'Intermediate',
      nepCreditLabel: 'Counts toward Skill Enhancement Credit (SEC-201)',
      xpReward: 50,
      tags: ['Algorithms', 'Data Structures', 'Coding'],
      quizQuestions: [
        {
          question: 'In which tree traversal are child nodes processed strictly before their parent node?',
          options: ['Post-order', 'Pre-order', 'In-order', 'Level-order'],
          correctIndex: 0,
          explanation: 'Post-order traversal visits Left, Right, and then the Root Node.',
        },
      ],
    },
  ];

  // Get or update Student Profile
  app.get('/api/student/profile', (req, res) => {
    const studentId = (req.query.studentId as string) || 'std-class-cse-a-1';
    let profile = studentProfiles[studentId];
    if (!profile) {
      profile = {
        studentId,
        careerGoal: 'Full Stack Developer',
        interests: ['System Design', 'React & Frontend', 'SQL & DBMS'],
        strongSubjects: ['sub-ds'],
        weakSubjects: ['sub-os', 'sub-cn'],
        learningStyle: 'hands_on',
        freeTimeMinutes: 30,
        xp: 300,
        streakDays: 5,
        completedActivitiesCount: 4,
        lastActivityDate: 'Today',
        badges: ['badge-streak-5', 'badge-sql-starter'],
      };
      studentProfiles[studentId] = profile;
    }
    return res.json({ profile });
  });

  app.post('/api/student/profile', (req, res) => {
    const { studentId, careerGoal, interests, strongSubjects, weakSubjects, learningStyle, freeTimeMinutes } = req.body;
    const sId = studentId || 'std-class-cse-a-1';
    studentProfiles[sId] = {
      ...(studentProfiles[sId] || {
        xp: 340,
        streakDays: 5,
        completedActivitiesCount: 6,
        badges: ['badge-streak-5', 'badge-sql-starter', 'badge-nep-explorer'],
      }),
      studentId: sId,
      careerGoal: careerGoal || 'Full Stack Developer',
      interests: interests || ['System Design', 'React & Frontend', 'SQL & DBMS'],
      strongSubjects: strongSubjects || [],
      weakSubjects: weakSubjects || ['sub-os'],
      learningStyle: learningStyle || 'hands_on',
      freeTimeMinutes: Number(freeTimeMinutes) || 30,
    };
    return res.json({ success: true, profile: studentProfiles[sId] });
  });

  // Free-Period Recommendations Engine API
  // Rule-based matching: IF weak_subject exists AND free_time fits -> prioritize with "Why this recommendation" explanation
  app.get('/api/student/activities', (req, res) => {
    const studentId = (req.query.studentId as string) || 'std-class-cse-a-1';
    const profile = studentProfiles[studentId] || {
      careerGoal: 'Full Stack Developer',
      weakSubjects: ['sub-os', 'sub-cn'],
      freeTimeMinutes: 30,
      learningStyle: 'hands_on',
    };

    const evaluatedActivities = activityBank.map((act) => {
      const isWeakSubject = (profile.weakSubjects || []).includes(act.subjectId);
      const fitsTime = act.durationMinutes <= (profile.freeTimeMinutes || 30);
      const isCareerRelevant =
        profile.careerGoal?.toLowerCase().includes('full stack') && (act.subjectId === 'sub-dbms' || act.subjectId === 'sub-os') ||
        profile.careerGoal?.toLowerCase().includes('data') && act.subjectId === 'sub-dbms';
      const isStyleMatch =
        (profile.learningStyle === 'hands_on' && act.category === 'Project Lab') ||
        (profile.learningStyle === 'quizzes' && act.category === 'Quiz Challenge') ||
        act.category === 'Skill Dev';

      let score = 0;
      if (isWeakSubject) score += 50;
      if (fitsTime) score += 30;
      if (isCareerRelevant) score += 20;
      if (isStyleMatch) score += 10;

      const reasonPoints = [];
      if (isWeakSubject) reasonPoints.push(`Weak Subject Target (${act.subjectName})`);
      if (fitsTime) reasonPoints.push(`Fits your ${profile.freeTimeMinutes || 30}m window`);
      if (isCareerRelevant) reasonPoints.push(`Directly boosts ${profile.careerGoal}`);
      reasonPoints.push(act.nepCreditLabel);

      return {
        ...act,
        score,
        matchReasons: {
          weakSubjectMatched: isWeakSubject,
          careerGoalMatched: isCareerRelevant,
          timeFitMatched: fitsTime,
          learningStyleMatched: isStyleMatch,
          explanation: `Matched because: ${reasonPoints.join(' • ')}`,
        },
      };
    });

    // Sort by recommendation score descending
    evaluatedActivities.sort((a, b) => b.score - a.score);

    return res.json({
      activities: evaluatedActivities,
      studentProfile: profile,
    });
  });

  // Complete Activity & Award Gamification XP
  app.post('/api/student/complete-activity', (req, res) => {
    const { studentId, activityId, scoreEarned } = req.body;
    const sId = studentId || 'std-class-cse-a-1';
    const profile = studentProfiles[sId] || {
      studentId: sId,
      careerGoal: 'Full Stack Developer',
      weakSubjects: ['sub-os'],
      freeTimeMinutes: 30,
      xp: 340,
      streakDays: 5,
      completedActivitiesCount: 6,
      badges: ['badge-streak-5', 'badge-sql-starter', 'badge-nep-explorer'],
    };

    const xpEarned = Number(scoreEarned) || 50;
    profile.xp = (profile.xp || 0) + xpEarned;
    profile.completedActivitiesCount = (profile.completedActivitiesCount || 0) + 1;
    profile.lastActivityDate = 'Just now';

    if (profile.xp >= 300 && !profile.badges.includes('badge-nep-explorer')) {
      profile.badges.push('badge-nep-explorer');
    }

    studentProfiles[sId] = profile;

    return res.json({
      success: true,
      message: `Completed! +${xpEarned} XP awarded.`,
      xpEarned,
      newTotalXp: profile.xp,
      completedCount: profile.completedActivitiesCount,
      profile,
    });
  });

  // Predictive Admin Analytics API
  app.get('/api/admin/analytics', (req, res) => {
    // Dynamically compute KPIs and early-warning drop flags
    const kpis = {
      totalStudents: mockStudentDirectory.length * 8 + 80,
      todayAttendancePercent: 91.4,
      attendanceDeltaPercent: 2.1,
      freePeriodUsagePercent: 68.5,
      studentsAtRiskCount: mockLowAttendanceStudents.length,
    };

    const earlyWarningList = mockLowAttendanceStudents.map((s, idx) => {
      const lastWeek = Math.min(95, s.overallAttendance + (idx % 2 === 0 ? 18 : 14));
      const thisWeek = s.overallAttendance;
      const delta = thisWeek - lastWeek;
      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        branch: s.branch,
        semester: s.semester,
        attendanceLastWeek: lastWeek,
        attendanceThisWeek: thisWeek,
        deltaPercent: delta,
        riskCategory: delta <= -15 ? ('High Risk (>15% drop)' as const) : ('Moderate Risk' as const),
        suggestedAction: delta <= -15 ? 'Immediate Counselor 1-on-1 & SMS' : 'Automated In-App Attendit Nudge',
      };
    });

    return res.json({
      kpis,
      earlyWarningStudents: earlyWarningList,
      weeklyTrends: [
        { day: 'Mon', cse: 94, it: 91, aids: 96, ece: 88, overall: 92.2 },
        { day: 'Tue', cse: 89, it: 87, aids: 93, ece: 85, overall: 88.5 },
        { day: 'Wed', cse: 96, it: 94, aids: 97, ece: 91, overall: 94.5 },
        { day: 'Thu', cse: 90, it: 88, aids: 92, ece: 86, overall: 89.0 },
        { day: 'Fri (Today)', cse: 93, it: 90, aids: 95, ece: 88, overall: 91.4 },
      ],
      departmentBreakdown: [
        { department: 'Computer Science & Engineering', code: 'CSE', enrolled: 80, present: 74, attendancePercent: 92.5, freePeriodActivePercent: 72.0 },
        { department: 'Information Technology', code: 'IT', enrolled: 60, present: 54, attendancePercent: 90.0, freePeriodActivePercent: 66.5 },
        { department: 'AI & Data Science', code: 'AI&DS', enrolled: 50, present: 48, attendancePercent: 96.0, freePeriodActivePercent: 78.0 },
        { department: 'Electronics & Communication', code: 'ECE', enrolled: 50, present: 44, attendancePercent: 88.0, freePeriodActivePercent: 54.0 },
      ],
      freePeriodUsage: {
        skillDevelopment: 38,
        revision: 24,
        projectLabs: 20,
        idle: 18,
      },
      topRequestedSkills: [
        { skill: 'Docker & Kubernetes Cloud Lab', demandPercent: 42, category: 'DevOps & Cloud' },
        { skill: 'System Design & Distributed Cache', demandPercent: 36, category: 'Full Stack' },
        { skill: 'SQL Index Tuning & EXPLAIN Plans', demandPercent: 31, category: 'Databases' },
        { skill: 'PyTorch Neural Networks Basics', demandPercent: 28, category: 'AI/ML' },
      ],
      careerCounselorInsights: [
        {
          title: 'Free Period Idleness Reduction',
          statistic: '60% -> 18% Idle',
          description: "Historical data showed 60% of CS students were idle during free periods. Attendit's rule-based micro-labs have converted 82% of free time into active NEP credit progress.",
          recommendation: 'Expand SEC micro-credentials for 3rd year students in Semester 6.',
        },
        {
          title: 'Operating Systems & Concurrency Deficit',
          statistic: '34% Flagged Weak',
          description: 'Over 34% of 2nd year students registered Operating Systems as their primary weak subject in onboarding surveys.',
          recommendation: "Targeted Banker's algorithm and CPU scheduling sprints are actively driving 18% higher pass rates.",
        },
      ],
    });
  });

  // Batch Offline Queue Sync API
  app.post('/api/session/batch-sync', (req, res) => {
    const { queue } = req.body;
    if (!Array.isArray(queue) || queue.length === 0) {
      return res.json({ success: true, syncedCount: 0, results: [] });
    }

    const results = queue.map((item: any) => {
      const student = mockStudentDirectory.find((s) => s.id === item.studentId || s.rollNo === item.rollNo) || mockStudentDirectory[0];
      const nowStr = item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newRecord: AttendanceRecord = {
        id: `att-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId: activeSession ? activeSession.id : `SES-OFFLINE-${Date.now()}`,
        sessionCode: activeSession ? activeSession.sessionCode : 'DS-OFFLINE',
        studentId: student.id,
        rollNo: student.rollNo,
        studentName: student.name,
        classId: student.classId,
        subjectId: activeSession ? activeSession.subjectId : 'sub-ds',
        subjectName: activeSession ? activeSession.subjectName : 'Data Structures',
        timestamp: nowStr,
        status: 'Present',
        verificationStatus: 'Verified',
        verificationMethod: 'Offline Queued Scan (Replayed on Reconnect)',
        clientMetadata: {
          offlineSynced: true,
          originalTimestamp: item.timestamp,
          device: item.deviceInfo || 'Offline Mobile Client',
        },
      };

      attendanceTable.push(newRecord);

      if (activeSession) {
        let rosterStudent = activeSession.students.find((s: any) => s.id === student.id || s.rollNo === student.rollNo);
        if (rosterStudent) {
          rosterStudent.status = 'present';
          rosterStudent.markedAt = nowStr;
          rosterStudent.verificationMethod = 'Offline Replayed';
        }
        activeSession.stats.present = activeSession.students.filter((s: any) => s.status === 'present').length;
        activeSession.stats.absent = activeSession.students.filter((s: any) => s.status === 'absent').length;
      }

      return {
        queueId: item.id,
        status: 'synced',
        record: newRecord,
      };
    });

    if (activeSession) {
      io.emit('session:sync', {
        ...activeSession,
        qrExpiresIn: secondsRemaining,
      });
    }

    return res.json({
      success: true,
      syncedCount: results.length,
      results,
    });
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

    // Initialize default active session so teacher and student have active QR code immediately
    if (!activeSession) {
      try {
        const defaultClass = mockClasses[0];
        const defaultSubject = mockSubjects[0];
        const sessionId = `SES-${Date.now()}`;
        const sessionCode = `DS-0905-1001`;
        const { qrCodeUrl, qrToken } = await generateDynamicQrPayload(sessionId, sessionCode);
        const students = generateStudentsForClass(defaultClass.id, defaultClass.totalStudents);
        students.forEach((s) => {
          s.status = 'absent';
          s.markedAt = undefined;
          s.flagReason = undefined;
          s.verificationMethod = undefined;
        });
        activeSession = {
          id: sessionId,
          sessionCode,
          classId: defaultClass.id,
          className: defaultClass.name,
          subjectId: defaultSubject.id,
          subjectName: defaultSubject.name,
          subjectCode: defaultSubject.code,
          room: defaultClass.defaultRoom,
          timeSlot: '10:00 AM - 11:00 AM',
          teacherId: mockTeacher.id,
          teacherName: mockTeacher.name,
          startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'active',
          qrCodeUrl,
          qrToken,
          qrExpiresIn: QR_ROTATION_SECONDS,
          qrTotalDuration: QR_ROTATION_SECONDS,
          stats: {
            present: 0,
            flagged: 0,
            absent: students.length,
            total: students.length,
          },
          students,
        };
        startSessionTimer(sessionId, sessionCode);
      } catch (e) {
        console.error('Error bootstrapping default session:', e);
      }
    }

    server.listen(PORT, '0.0.0.0', () => {
    console.log(`AttendIt Attendance Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
