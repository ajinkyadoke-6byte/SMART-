import React, { useState } from 'react';
import { Teacher, Student } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import { PrivacyModal } from './PrivacyModal';
import {
  QrCode,
  Lock,
  Mail,
  ArrowRight,
  User,
  GraduationCap,
  KeyRound,
  UserCheck,
  Smartphone,
  ChevronRight,
  X,
  ShieldCheck,
  CheckCircle2,
  Building,
  Sparkles,
  School,
  WifiOff,
  Flame,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onTeacherLoginSuccess: (teacher: Teacher, token: string) => void;
  onStudentLoginSuccess: (student: any, token: string) => void;
  onAdminLoginSuccess?: (admin: any, token: string) => void;
}

interface DemoCredential {
  role: 'teacher' | 'student' | 'admin';
  name: string;
  title: string;
  email: string;
  rollNo?: string;
  password?: string;
  department: string;
  avatar: string;
  classInfo?: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'teacher',
    name: 'Prof. Anjali Sharma',
    title: 'Faculty / Professor',
    email: 'anjali.sharma@attendit.edu',
    password: 'teacher123',
    department: 'Computer Science & Eng.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop',
    classInfo: 'CSE-A, CSE-B (Sem 4)',
  },
  {
    role: 'student',
    name: 'Aditya Verma',
    title: 'Student (CSE-A)',
    email: 'aditya.verma.001@attendit.edu',
    rollNo: '22CS001',
    password: 'student123',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
    classInfo: 'Semester 4 · Roll 001',
  },
  {
    role: 'admin',
    name: 'Dr. Rajesh Iyer',
    title: 'Dean of Academic Affairs',
    email: 'rajesh.iyer@attendit.edu',
    password: 'admin123',
    department: 'Academic Administration',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    classInfo: 'NEP-2020 Master Timetable & Analytics',
  },
  {
    role: 'student',
    name: 'Sneha Patil',
    title: 'Student (CSE-A)',
    email: 'sneha.patil.002@attendit.edu',
    rollNo: '22CS002',
    password: 'student123',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
    classInfo: 'Semester 4 · Roll 002',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onTeacherLoginSuccess,
  onStudentLoginSuccess,
  onAdminLoginSuccess,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authRole, setAuthRole] = useState<'teacher' | 'student' | 'admin'>('teacher');
  const [email, setEmail] = useState('anjali.sharma@attendit.edu');
  const [password, setPassword] = useState('teacher123');
  const [fullName, setFullName] = useState('');
  const [dept, setDept] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Associate Professor');
  const [rollNo, setRollNo] = useState('22CS088');
  const [className, setClassName] = useState('CSE-A (Semester 4)');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleOpenAuth = (role: 'teacher' | 'student' | 'admin', mode: 'signin' | 'signup' = 'signin') => {
    setAuthRole(role);
    setAuthMode(mode);
    setAuthError(null);
    if (mode === 'signup') {
      setEmail('');
      setPassword('');
      setFullName('');
    } else {
      if (role === 'teacher') {
        setEmail('anjali.sharma@attendit.edu');
        setPassword('teacher123');
        setFullName('Prof. Anjali Sharma');
      } else if (role === 'admin') {
        setEmail('rajesh.iyer@attendit.edu');
        setPassword('admin123');
        setFullName('Dr. Rajesh Iyer');
      } else {
        setEmail('aditya.verma.001@attendit.edu');
        setPassword('student123');
        setFullName('Aditya Verma');
      }
    }
    setIsModalOpen(true);
  };

  const handleDirectAccess = (role: 'teacher' | 'student' | 'admin') => {
    if (role === 'teacher') {
      const fallbackTeacher = {
        id: 'prof-sharma',
        name: 'Prof. Anjali Sharma',
        email: 'anjali.sharma@attendit.edu',
        department: 'Computer Science & Engineering',
        branch: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        facultyCode: 'FAC-CS-104',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop',
        timings: { start: '08:30 AM', finish: '04:30 PM' },
        shiftStart: '08:30 AM',
        shiftFinish: '04:30 PM',
      };
      safeFetchJson('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'anjali.sharma@attendit.edu', password: 'teacher123' }),
      }).then(({ ok, data }) => {
        if (ok && data?.teacher) {
          onTeacherLoginSuccess(data.teacher, data.token);
        } else {
          onTeacherLoginSuccess(fallbackTeacher, 'demo-token');
        }
      }).catch(() => {
        onTeacherLoginSuccess(fallbackTeacher, 'demo-token');
      });
    } else if (role === 'student') {
      const fallbackStudent = {
        id: 'std-class-cse-a-1',
        rollNo: '22CS001',
        name: 'Aditya Verma',
        email: 'aditya.verma.001@attendit.edu',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
        classId: 'class-cse-a',
        className: 'CSE-A (Semester 4)',
        overallAttendance: 94,
      };
      safeFetchJson('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'aditya.verma.001@attendit.edu', password: 'student123' }),
      }).then(({ ok, data }) => {
        if (ok && data?.student) {
          onStudentLoginSuccess(data.student, data.token);
        } else {
          onStudentLoginSuccess(fallbackStudent, 'demo-token');
        }
      }).catch(() => {
        onStudentLoginSuccess(fallbackStudent, 'demo-token');
      });
    } else if (role === 'admin') {
      const fallbackAdmin = {
        id: 'admin-1',
        name: 'Dr. Rajesh Iyer',
        title: 'Dean of Academic Affairs',
        email: 'rajesh.iyer@attendit.edu',
      };
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(fallbackAdmin, 'demo-admin-token');
      }
    }
  };

  const handleSelectQuickCred = (cred: DemoCredential) => {
    setAuthRole(cred.role);
    setEmail(cred.email);
    setPassword(cred.password || (cred.role === 'teacher' ? 'teacher123' : cred.role === 'admin' ? 'admin123' : 'student123'));
    setFullName(cred.name);
    setAuthError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    // Derive proper human formatted name from email or entered input
    const cleanRaw = fullName || (email.includes('@') ? email.split('@')[0] : email);
    const formattedDerivedName = cleanRaw
      ? cleanRaw.replace(/[._\-0-9]+/g, ' ').trim().split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : (authRole === 'teacher' ? 'Faculty Member' : authRole === 'admin' ? 'Academic Dean' : 'Student');

    try {
      if (authMode === 'signup') {
        // Registration endpoint
        const signupPayload = {
          role: authRole,
          name: fullName || formattedDerivedName,
          email,
          password,
          department: dept,
          designation,
          rollNo,
          className,
        };

        const { ok, data } = await safeFetchJson('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupPayload),
        });

        if (ok && data) {
          if (authRole === 'teacher' && data.teacher) {
            onTeacherLoginSuccess(data.teacher, data.token || 'reg-token');
          } else if (authRole === 'student' && data.student) {
            onStudentLoginSuccess(data.student, data.token || 'reg-token');
          } else if (authRole === 'admin' && data.admin) {
            if (onAdminLoginSuccess) onAdminLoginSuccess(data.admin, data.token || 'reg-token');
          }
          setIsModalOpen(false);
          return;
        } else {
          // Local fallback registration
          if (authRole === 'teacher') {
            const newTeacher: Teacher = {
              id: `prof-${Date.now()}`,
              name: formattedDerivedName.toLowerCase().startsWith('prof') ? formattedDerivedName : `Prof. ${formattedDerivedName}`,
              email,
              department: dept,
              branch: dept,
              designation,
              facultyCode: `FAC-${Math.floor(100 + Math.random() * 900)}`,
              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop',
              timings: { start: '08:30 AM', finish: '04:30 PM' },
              shiftStart: '08:30 AM',
              shiftFinish: '04:30 PM',
            };
            onTeacherLoginSuccess(newTeacher, 'jwt-token-new');
          } else if (authRole === 'student') {
            const newStudent = {
              id: `std-${Date.now()}`,
              rollNo: rollNo || `22CS${Math.floor(100 + Math.random() * 899)}`,
              name: formattedDerivedName,
              email,
              avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
              classId: 'class-cse-a',
              className: className || 'CSE-A (Semester 4)',
              overallAttendance: 100,
            };
            onStudentLoginSuccess(newStudent, 'jwt-token-student');
          } else if (authRole === 'admin') {
            const newAdmin = {
              id: `admin-${Date.now()}`,
              name: formattedDerivedName.toLowerCase().startsWith('dr') ? formattedDerivedName : `Dr. ${formattedDerivedName}`,
              title: designation || 'Dean of Academic Affairs',
              email,
              department: dept,
            };
            if (onAdminLoginSuccess) onAdminLoginSuccess(newAdmin, 'jwt-token-admin');
          }
          setIsModalOpen(false);
          return;
        }
      }

      // Standard Sign In Mode
      if (authRole === 'admin') {
        const { ok: adminOk, data: adminDataResponse } = await safeFetchJson('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: fullName || formattedDerivedName }),
        });

        if (adminOk && adminDataResponse?.admin) {
          if (onAdminLoginSuccess) {
            onAdminLoginSuccess(adminDataResponse.admin, adminDataResponse.token || 'demo-admin-jwt-token');
          }
        } else {
          const adminData = {
            id: 'admin-1',
            name: formattedDerivedName.toLowerCase().startsWith('dr') ? formattedDerivedName : `Dr. ${formattedDerivedName}`,
            title: 'Dean of Academic Affairs',
            email: email || 'rajesh.iyer@attendit.edu',
          };
          if (onAdminLoginSuccess) {
            onAdminLoginSuccess(adminData, 'demo-admin-jwt-token');
          }
        }
        setIsModalOpen(false);
        return;
      }

      const endpoint = authRole === 'teacher' ? '/api/teacher/login' : '/api/student/login';
      const { ok, status, data } = await safeFetchJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName || formattedDerivedName, rollNo }),
      });

      if (ok && data) {
        if (authRole === 'teacher' && data.teacher) {
          onTeacherLoginSuccess(data.teacher, data.token);
        } else if (data.student) {
          onStudentLoginSuccess(data.student, data.token);
        }
        setIsModalOpen(false);
      } else {
        // Fallback for resilient preview
        if (authRole === 'teacher') {
          const matchedCred = DEMO_CREDENTIALS.find((c) => c.email === email && c.role === 'teacher');
          const teacherName = matchedCred?.name || (formattedDerivedName.toLowerCase().startsWith('prof') ? formattedDerivedName : `Prof. ${formattedDerivedName}`);
          onTeacherLoginSuccess({
            id: 'prof-' + Date.now(),
            name: teacherName,
            email: email || 'faculty@attendit.edu',
            department: 'Computer Science & Engineering',
            branch: 'Computer Science & Engineering',
            designation: 'Associate Professor',
            avatar: matchedCred?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop',
            timings: { start: '08:30 AM', finish: '04:30 PM' },
            shiftStart: '08:30 AM',
            shiftFinish: '04:30 PM',
          }, 'demo-token');
          setIsModalOpen(false);
          return;
        } else {
          const matchedCred = DEMO_CREDENTIALS.find((c) => c.email === email && c.role === 'student');
          const studentName = matchedCred?.name || formattedDerivedName;
          onStudentLoginSuccess({
            id: 'std-' + Date.now(),
            rollNo: matchedCred?.rollNo || rollNo || '22CS001',
            name: studentName,
            email: email || `${studentName.toLowerCase().replace(/\s+/g, '.')}@attendit.edu`,
            avatar: matchedCred?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
            classId: 'class-cse-a',
            className: matchedCred?.classInfo || 'CSE-A (Semester 4)',
            overallAttendance: 92,
          }, 'demo-token');
          setIsModalOpen(false);
          return;
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Main Landing Canvas matching the exact screenshot image.png */}
      <div className="relative min-h-screen bg-[#fafaf8] text-slate-900 overflow-hidden flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] selection:bg-slate-900 selection:text-white">
        
        {/* Ambient Top-Right Golden/Copper Sphere Graphic */}
        <div 
          className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none opacity-90"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ca8a04 0%, #a16207 40%, #713f12 75%, #451a03 100%)',
            boxShadow: '0 25px 60px -15px rgba(113, 63, 18, 0.35)',
          }}
        />

        {/* Ambient Bottom-Left Deep Forest / Emerald Sphere Graphic */}
        <div 
          className="absolute -bottom-40 -left-40 w-[580px] h-[580px] rounded-full pointer-events-none opacity-95"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #065f46 0%, #064e3b 45%, #022c22 80%, #011d16 100%)',
            boxShadow: '0 25px 60px -15px rgba(6, 78, 59, 0.4)',
          }}
        />

        {/* Top Navbar */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 font-['Playfair_Display',Georgia,serif]">
              attendit
            </span>
          </div>

          {/* Right Header Action Button */}
          <div className="flex items-center gap-3">
            <button
              id="header-signin-btn"
              onClick={() => handleOpenAuth('teacher', 'signin')}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign in / Login</span>
            </button>
          </div>
        </header>

        {/* Centered Hero Presentation (Strictly matching screenshot image.png) */}
        <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24 text-center my-auto space-y-7">
          {/* Subdued ecosystem pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-xs font-medium text-slate-700 shadow-2xs backdrop-blur-xs">
            <span>A modern attendance ecosystem from <strong className="text-slate-900 font-bold">AttendIt</strong></span>
          </div>

          {/* Clean Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal text-slate-950 tracking-tight font-['Playfair_Display',Georgia,serif] max-w-4xl mx-auto leading-[1.12]">
            The attendance system that works for you
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mx-auto">
            Available for Teachers, Students, and Campus Administrators
          </p>

          {/* Primary CTA Button */}
          <div className="pt-2 flex flex-col items-center justify-center">
            <button
              id="hero-access-portal-btn"
              onClick={() => handleOpenAuth('teacher', 'signin')}
              className="px-8 py-3.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Sign in / Access Portal</span>
            </button>
          </div>

          {/* Quick Direct Access Row with Colored Dots */}
          <div className="pt-4 flex items-center justify-center flex-wrap gap-3 text-xs text-slate-500 font-medium">
            <span>Quick direct access:</span>
            <button
              id="quick-teacher-btn"
              onClick={() => handleDirectAccess('teacher')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 hover:bg-white border border-slate-200/80 rounded-full text-slate-800 font-semibold shadow-2xs transition cursor-pointer hover:text-indigo-600"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
              <span>Teacher Portal</span>
            </button>
            <button
              id="quick-student-btn"
              onClick={() => handleDirectAccess('student')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 hover:bg-white border border-slate-200/80 rounded-full text-slate-800 font-semibold shadow-2xs transition cursor-pointer hover:text-emerald-600"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              <span>Student Portal</span>
            </button>
            <button
              id="quick-admin-btn"
              onClick={() => handleDirectAccess('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 hover:bg-white border border-slate-200/80 rounded-full text-slate-800 font-semibold shadow-2xs transition cursor-pointer hover:text-slate-900"
            >
              <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
              <span>Admin Center</span>
            </button>
          </div>
        </main>

        {/* Discreet Footer */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="text-[11px] text-slate-500">
            Attendit — smart educational attendance with NEP-2020 compliance.
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Real-time Sync Active</span>
          </div>
        </footer>

        {/* Login & Sign Up Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-['Playfair_Display',serif]">
                      {authMode === 'signup' ? 'Create New Account' : 'Attendit Portal Sign In'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {authMode === 'signup' ? 'Register for faculty, student, or admin access' : 'Select role and sign in securely'}
                    </p>
                  </div>
                </div>
                <button
                  id="close-modal-btn"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Top Selector: Sign In vs Sign Up (Upper side of Faculty) */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200/80 gap-1 text-xs font-bold text-slate-600">
                <button
                  id="tab-mode-signin"
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signin'
                      ? 'bg-white text-slate-950 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-500'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sign In</span>
                </button>
                <button
                  id="tab-mode-signup"
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-white text-slate-950 shadow-2xs font-bold'
                      : 'hover:text-slate-900 text-slate-500'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sign Up</span>
                </button>
              </div>

              {/* Role Switcher (Directly below Sign In / Sign Up) */}
              <div className="grid grid-cols-3 p-2 bg-slate-50 gap-1 text-xs font-semibold text-slate-600 border-b border-slate-100">
                <button
                  id="tab-teacher-btn"
                  type="button"
                  onClick={() => handleOpenAuth('teacher', authMode)}
                  className={`py-1.5 rounded-xl transition cursor-pointer ${
                    authRole === 'teacher' ? 'bg-slate-950 text-white shadow-2xs font-bold' : 'hover:bg-slate-200/70'
                  }`}
                >
                  Faculty
                </button>
                <button
                  id="tab-student-btn"
                  type="button"
                  onClick={() => handleOpenAuth('student', authMode)}
                  className={`py-1.5 rounded-xl transition cursor-pointer ${
                    authRole === 'student' ? 'bg-slate-950 text-white shadow-2xs font-bold' : 'hover:bg-slate-200/70'
                  }`}
                >
                  Student
                </button>
                <button
                  id="tab-admin-btn"
                  type="button"
                  onClick={() => handleOpenAuth('admin', authMode)}
                  className={`py-1.5 rounded-xl transition cursor-pointer ${
                    authRole === 'admin' ? 'bg-slate-950 text-white shadow-2xs font-bold' : 'hover:bg-slate-200/70'
                  }`}
                >
                  Dean / Admin
                </button>
              </div>

              {/* Form Content */}
              <div className="overflow-y-auto p-6 flex-1">
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                      {authError}
                    </div>
                  )}

                  {authMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          id="input-signup-name"
                          type="text"
                          value={fullName}
                          placeholder={authRole === 'teacher' ? 'e.g. Prof. Rohan Deshmukh' : authRole === 'admin' ? 'e.g. Dr. Rajesh Iyer' : 'e.g. Aarav Sharma'}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Institutional Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="input-auth-email"
                        type="email"
                        value={email}
                        placeholder="yourname@attendit.edu"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="input-auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Role Specific Fields for Sign Up */}
                  {authMode === 'signup' && authRole === 'teacher' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Department</label>
                        <input
                          type="text"
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden font-medium text-slate-900 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Designation</label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden font-medium text-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {authMode === 'signup' && authRole === 'student' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Roll Number</label>
                        <input
                          type="text"
                          value={rollNo}
                          onChange={(e) => setRollNo(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden font-medium text-slate-900 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Class / Division</label>
                        <input
                          type="text"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden font-medium text-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      id="submit-auth-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                    >
                      {isLoading ? (
                        'Processing...'
                      ) : authMode === 'signup' ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Create Account & Sign In as {authRole === 'teacher' ? 'Faculty' : authRole === 'admin' ? 'Dean' : 'Student'}</span>
                        </>
                      ) : (
                        <span>Sign In as {authRole === 'teacher' ? 'Faculty' : authRole === 'admin' ? 'Dean' : 'Student'}</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Fast Quick Demo Credential Selection inside modal (Only for Sign In mode) */}
                {authMode === 'signin' && (
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Quick Seeded Demo Credentials
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_CREDENTIALS.filter((c) => c.role === authRole).map((cred, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectQuickCred(cred)}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 text-left transition cursor-pointer shadow-2xs hover:shadow-xs"
                        >
                          <div className="font-bold text-slate-900 truncate">{cred.name}</div>
                          <div className="text-[10px] text-slate-500">{cred.classInfo}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
