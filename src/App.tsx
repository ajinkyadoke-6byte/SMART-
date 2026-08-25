/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ClassesManagement } from './components/ClassesManagement';
import { LiveAttendanceDashboard } from './components/LiveAttendanceDashboard';
import { ClassroomTabletMode } from './components/ClassroomTabletMode';
import { PostSessionAttendanceReview } from './components/PostSessionAttendanceReview';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { safeFetchJson } from './utils/apiClient';
import {
  INITIAL_BRANCHES,
  INITIAL_CLASSES,
  INITIAL_DIVISIONS,
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE,
  INITIAL_DAILY_ATTENDANCE,
  INITIAL_LOW_ATTENDANCE,
} from './data/initialData';
import {
  Teacher,
  ClassItem,
  SubjectItem,
  BranchItem,
  DivisionItem,
  SemesterItem,
  TimetableSlot,
  AttendanceSession,
  Student,
  DailyAttendanceStat,
  LowAttendanceStudent,
} from './types';

export default function App() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [admin, setAdmin] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'session' | 'review' | 'tablet' | 'admin'>('dashboard');

  const [classes, setClasses] = useState<ClassItem[]>(INITIAL_CLASSES);
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [branches, setBranches] = useState<BranchItem[]>(INITIAL_BRANCHES);
  const [divisions, setDivisions] = useState<DivisionItem[]>(INITIAL_DIVISIONS);
  const [semesters, setSemesters] = useState<SemesterItem[]>(INITIAL_SEMESTERS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceStat[]>(INITIAL_DAILY_ATTENDANCE);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>(INITIAL_LOW_ATTENDANCE);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [endedSessionForReview, setEndedSessionForReview] = useState<AttendanceSession | null>(null);
  const [isTabletModeOpen, setIsTabletModeOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Initialize Socket.io and fetch metadata
  useEffect(() => {
    // Connect to Socket.io server
    const socketClient = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketClient.on('connect', () => {
      console.log('Connected to AttendIt Socket.IO Server');
    });

    socketClient.on('session:sync', (sessionData: AttendanceSession) => {
      setActiveSession(sessionData);
    });

    socketClient.on('session:started', (sessionData: AttendanceSession) => {
      setActiveSession(sessionData);
      if (teacher) {
        setActiveTab('session');
      }
    });

    socketClient.on('session:ended', (sessionData: AttendanceSession) => {
      setActiveSession(null);
      setEndedSessionForReview(sessionData);
      setIsTabletModeOpen(false);
      if (teacher) {
        setActiveTab('review');
      }
    });

    socketClient.on('qr:tick', (data: { secondsRemaining: number; totalSeconds: number }) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          qrExpiresIn: data.secondsRemaining,
          qrTotalDuration: data.totalSeconds,
        };
      });
    });

    socketClient.on('qr:rotated', (data: { qrCodeUrl: string; qrToken: string; secondsRemaining: number }) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          qrCodeUrl: data.qrCodeUrl,
          qrToken: data.qrToken,
          qrExpiresIn: data.secondsRemaining,
        };
      });
    });

    socketClient.on('attendance:marked', (payload: { student: Student; stats: any; sessionId: string; session?: AttendanceSession }) => {
      if (payload.session) {
        setActiveSession(payload.session);
      } else {
        setActiveSession((prev) => {
          if (!prev) return null;
          const exists = prev.students.some((s) => s.id === payload.student.id || (s.rollNo && s.rollNo === payload.student.rollNo));
          const updatedStudents = exists
            ? prev.students.map((s) =>
                (s.id === payload.student.id || (s.rollNo && s.rollNo === payload.student.rollNo))
                  ? { ...s, ...payload.student }
                  : s
              )
            : [payload.student, ...prev.students];

          return {
            ...prev,
            students: updatedStudents,
            stats: payload.stats || {
              total: updatedStudents.length,
              present: updatedStudents.filter((s) => s.status === 'present').length,
              flagged: updatedStudents.filter((s) => s.status === 'flagged').length,
              absent: updatedStudents.filter((s) => s.status === 'absent').length,
            },
          };
        });
      }
    });

    socketClient.on('attendance:updated', (payload: { student: Student; stats: any; sessionId: string; session?: AttendanceSession }) => {
      if (payload.session) {
        setActiveSession(payload.session);
      } else {
        setActiveSession((prev) => {
          if (!prev) return null;
          const exists = prev.students.some((s) => s.id === payload.student.id || (s.rollNo && s.rollNo === payload.student.rollNo));
          const updatedStudents = exists
            ? prev.students.map((s) =>
                (s.id === payload.student.id || (s.rollNo && s.rollNo === payload.student.rollNo))
                  ? { ...s, ...payload.student }
                  : s
              )
            : [payload.student, ...prev.students];

          return {
            ...prev,
            students: updatedStudents,
            stats: payload.stats || {
              total: updatedStudents.length,
              present: updatedStudents.filter((s) => s.status === 'present').length,
              flagged: updatedStudents.filter((s) => s.status === 'flagged').length,
              absent: updatedStudents.filter((s) => s.status === 'absent').length,
            },
          };
        });
      }
    });

    socketClient.on('timetable:updated', (updatedTimetable: TimetableSlot[]) => {
      if (Array.isArray(updatedTimetable)) {
        setTimetable(updatedTimetable);
      }
    });

    setSocket(socketClient);

    // Initial fetch of meta data
    safeFetchJson('/api/teacher/meta')
      .then(({ ok, data }) => {
        if (ok && data) {
          if (data.classes?.length) setClasses(data.classes);
          if (data.subjects?.length) setSubjects(data.subjects);
          if (data.branches?.length) setBranches(data.branches);
          if (data.divisions?.length) setDivisions(data.divisions);
          if (data.semesters?.length) setSemesters(data.semesters);
          if (data.timetable?.length) setTimetable(data.timetable);
          if (data.dailyAttendance?.length) setDailyAttendance(data.dailyAttendance);
          if (data.lowAttendanceStudents?.length) setLowAttendanceStudents(data.lowAttendanceStudents);
          if (data.activeSession) {
            setActiveSession(data.activeSession);
          }
        }
      })
      .catch(() => {});

    return () => {
      socketClient.disconnect();
    };
  }, [teacher]);

  // Load saved session on initial load
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('attendit_active_session_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.role === 'student' && parsed.user) {
          setStudent(parsed.user);
          setToken(parsed.token || null);
          setActiveTab('student');
        } else if (parsed.role === 'teacher' && parsed.user) {
          setTeacher(parsed.user);
          setToken(parsed.token || null);
          setActiveTab('dashboard');
        } else if (parsed.role === 'admin' && parsed.user) {
          setAdmin(parsed.user);
          setToken(parsed.token || null);
          setActiveTab('admin');
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    }
  }, []);

  const handleTeacherLoginSuccess = (teacherData: Teacher, authToken: string) => {
    setTeacher(teacherData);
    setStudent(null);
    setAdmin(null);
    setToken(authToken);
    setActiveTab('dashboard');
    try {
      localStorage.setItem('attendit_active_session_auth', JSON.stringify({ role: 'teacher', user: teacherData, token: authToken }));
    } catch (e) {}
  };

  const handleStudentLoginSuccess = (studentData: any, authToken: string) => {
    setStudent(studentData);
    setTeacher(null);
    setAdmin(null);
    setToken(authToken);
    setActiveTab('student');
    try {
      localStorage.setItem('attendit_active_session_auth', JSON.stringify({ role: 'student', user: studentData, token: authToken }));
      localStorage.setItem('attendit_student_roll', studentData.rollNo);
    } catch (e) {}
  };

  const handleAdminLoginSuccess = (adminData: any, authToken: string) => {
    setAdmin(adminData);
    setTeacher(null);
    setStudent(null);
    setToken(authToken);
    setActiveTab('admin');
    try {
      localStorage.setItem('attendit_active_session_auth', JSON.stringify({ role: 'admin', user: adminData, token: authToken }));
    } catch (e) {}
  };

  const handleLogout = () => {
    setTeacher(null);
    setStudent(null);
    setAdmin(null);
    setToken(null);
    setActiveSession(null);
    setActiveTab('dashboard');
    try {
      localStorage.removeItem('attendit_active_session_auth');
      localStorage.removeItem('attendit_student_roll');
    } catch (e) {}
  };

  const handleStartSession = async (
    classId: string,
    subjectId: string,
    room: string,
    metadata?: {
      className?: string;
      classCode?: string;
      subjectName?: string;
      subjectCode?: string;
      totalStudents?: number;
      timeSlot?: string;
      branch?: string;
      semester?: number;
      section?: string;
    }
  ) => {
    setIsStartingSession(true);
    try {
      const targetClass = classes.find(
        (c) => c.id === classId || c.code === classId || c.name === classId || (metadata?.className && c.name === metadata.className)
      );
      const targetSubject = subjects.find(
        (s) => s.id === subjectId || s.code === subjectId || s.name === subjectId || (metadata?.subjectCode && s.code === metadata.subjectCode)
      );
      const targetSlot = timetable.find(
        (t) =>
          (t.classId === classId && t.subjectId === subjectId) ||
          (targetClass && targetSubject && t.classId === targetClass.id && t.subjectId === targetSubject.id) ||
          t.id === classId ||
          t.id === subjectId
      );

      const requestBody = {
        classId: targetClass?.id || classId,
        className: metadata?.className || targetClass?.name || targetSlot?.className || 'Selected Class',
        classCode: metadata?.classCode || targetClass?.code || (targetClass?.name?.split(' ')[0] || 'CLASS'),
        branch: metadata?.branch || targetClass?.branch || targetClass?.department || 'Engineering',
        semester: metadata?.semester || targetClass?.semester || 4,
        section: metadata?.section || targetClass?.section || 'A',
        totalStudents: metadata?.totalStudents || targetClass?.totalStudents || 40,
        subjectId: targetSubject?.id || subjectId,
        subjectName: metadata?.subjectName || targetSubject?.name || targetSlot?.subjectName || 'Course Lecture',
        subjectCode: metadata?.subjectCode || targetSubject?.code || targetSlot?.subjectCode || 'CS401',
        room: room || targetSlot?.room || targetClass?.defaultRoom || 'Room 301',
        timeSlot:
          metadata?.timeSlot ||
          (targetSlot ? `${targetSlot.startTime} - ${targetSlot.endTime}` : `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - Active`),
        teacherId: teacher?.id,
        teacherName: teacher?.name || 'Prof. Anjali Sharma',
      };

      const { ok, data } = await safeFetchJson('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (ok && data && (data.id || data.sessionId)) {
        const sessionObj: AttendanceSession = {
          ...data,
          id: data.id || data.sessionId,
          sessionId: data.sessionId || data.id,
        };
        setActiveSession(sessionObj);
        setActiveTab('session');
      } else {
        // Fallback generator
        const initialToken = 'STATIC_SESSION_TOKEN_' + Date.now();
        const fallbackSessionId = 'SES-' + Date.now();
        const codePrefix = requestBody.subjectCode.replace(/[^a-zA-Z0-9]/g, '');
        const fallbackSessionCode = `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        const qrUrl = await QRCode.toDataURL(
          JSON.stringify({
            app: 'AttendIt',
            sessionId: fallbackSessionId,
            sessionCode: fallbackSessionCode,
            token: initialToken,
            room: requestBody.room,
          }),
          { width: 320, margin: 2 }
        );

        const mockSession: AttendanceSession = {
          id: fallbackSessionId,
          sessionId: fallbackSessionId,
          sessionCode: fallbackSessionCode,
          classId: requestBody.classId,
          className: requestBody.className,
          subjectId: requestBody.subjectId,
          subjectName: requestBody.subjectName,
          subjectCode: requestBody.subjectCode,
          room: requestBody.room,
          timeSlot: requestBody.timeSlot,
          teacherId: teacher?.id || 't-1',
          teacherName: teacher?.name || 'Prof. Anjali Sharma',
          startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          qrExpiresIn: 15,
          qrTotalDuration: 15,
          qrCodeUrl: qrUrl,
          qrToken: initialToken,
          stats: {
            total: requestBody.totalStudents,
            totalStudents: requestBody.totalStudents,
            present: 0,
            flagged: 0,
            absent: requestBody.totalStudents,
            attendanceRate: 0,
          },
          students: [
            {
              id: `std-${requestBody.classId}-1`,
              name: 'Aditya Verma',
              rollNo: requestBody.classId.includes('it') ? '22IT001' : requestBody.classId.includes('ece') ? '22EC001' : '22CS001',
              email: 'aditya.verma.001@attendit.edu',
              avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
              classId: requestBody.classId,
              overallAttendance: 94,
              status: 'absent',
            },
            {
              id: `std-${requestBody.classId}-2`,
              name: 'Sneha Patil',
              rollNo: requestBody.classId.includes('it') ? '22IT002' : requestBody.classId.includes('ece') ? '22EC002' : '22CS002',
              email: 'sneha.patil.002@attendit.edu',
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
              classId: requestBody.classId,
              overallAttendance: 91,
              status: 'absent',
            },
          ],
        };
        setActiveSession(mockSession);
        setActiveTab('session');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async () => {
    try {
      const currentSnapshot = activeSession ? { ...activeSession } : null;
      const res = await safeFetchJson('/api/session/end', { method: 'POST' });
      const finalSession = (res.data && res.data.session) || currentSnapshot;
      if (finalSession) {
        setEndedSessionForReview(finalSession);
      }
      setActiveSession(null);
      setIsTabletModeOpen(false);
      setActiveTab('review');
    } catch (err) {
      console.error('Failed to end session:', err);
      if (activeSession) {
        setEndedSessionForReview({ ...activeSession });
      }
      setActiveSession(null);
      setIsTabletModeOpen(false);
      setActiveTab('review');
    }
  };

  const handleManualMarkPresent = async (studentId: string) => {
    if (!activeSession) return;
    try {
      await safeFetchJson('/api/session/override-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newStatus: 'present' }),
      });
      setActiveSession((prev) => {
        if (!prev) return null;
        const updatedStudents = prev.students.map((s) => {
          if (s.id === studentId) {
            return {
              ...s,
              status: 'present' as const,
              markedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              verificationMethod: 'Podium Tablet Tap-In',
            };
          }
          return s;
        });
        return {
          ...prev,
          students: updatedStudents,
          stats: {
            ...prev.stats,
            present: updatedStudents.filter((s) => s.status === 'present').length,
            absent: updatedStudents.filter((s) => s.status === 'absent').length,
          },
        };
      });
    } catch (err) {
      console.error('Failed to mark present on podium tablet:', err);
    }
  };

  const handleSaveReview = async (updatedStudents: Student[]) => {
    if (endedSessionForReview) {
      const present = updatedStudents.filter((s) => s.status === 'present').length;
      const total = updatedStudents.length || 1;
      const flagged = updatedStudents.filter((s) => s.status === 'flagged').length;

      const updatedSessionObj = {
        ...endedSessionForReview,
        students: updatedStudents,
        stats: {
          total,
          present,
          flagged,
          absent: Math.max(0, total - present - flagged),
        },
      };

      setEndedSessionForReview(updatedSessionObj);

      setTimetable((prev) =>
        prev.map((t) => {
          if (t.classId === endedSessionForReview.classId && t.subjectId === endedSessionForReview.subjectId) {
            return {
              ...t,
              isCompleted: true,
              attendanceCount: {
                present,
                total,
                percentage: Math.round((present / total) * 100),
              },
            };
          }
          return t;
        })
      );

      try {
        await safeFetchJson('/api/session/save-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: endedSessionForReview.id,
            students: updatedStudents,
          }),
        });
      } catch (err) {
        console.error('Failed to save session review to backend:', err);
      }
    }
    setActiveTab('dashboard');
  };

  const handleSimulateScan = async (studentIdOrFlag?: any) => {
    if (!activeSession) return;
    try {
      const isFlagged = typeof studentIdOrFlag === 'boolean' ? studentIdOrFlag : false;
      const targetStudent = activeSession.students.find((s) => s.status === 'absent');
      if (!targetStudent) return;

      await safeFetchJson('/api/session/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: targetStudent.id,
          rollNo: targetStudent.rollNo,
          isFlagged,
          flagReason: isFlagged ? 'Suspicious token delay or BLE beacon distance anomaly' : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to simulate scan:', err);
    }
  };

  const handleOverrideStatus = async (studentId: string, status: 'present' | 'absent' | 'flagged') => {
    if (!activeSession) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic UI update
    setActiveSession((prev) => {
      if (!prev) return null;
      const updatedStudents = prev.students.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status,
            markedAt: status === 'present' ? s.markedAt || nowTime : undefined,
            verificationMethod: status === 'present' ? 'Manual Override (Faculty)' : undefined,
            flagReason: status === 'present' ? undefined : s.flagReason,
          };
        }
        return s;
      });
      return {
        ...prev,
        students: updatedStudents,
        stats: {
          ...prev.stats,
          present: updatedStudents.filter((s) => s.status === 'present').length,
          flagged: updatedStudents.filter((s) => s.status === 'flagged').length,
          absent: updatedStudents.filter((s) => s.status === 'absent').length,
        },
      };
    });

    try {
      await safeFetchJson('/api/session/override-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newStatus: status }),
      });
    } catch (err) {
      console.error('Failed to override status:', err);
    }
  };

  // If user is not logged in, render the clean Landing Page
  if (!teacher && !student && !admin) {
    return (
      <LandingPage
        onTeacherLoginSuccess={handleTeacherLoginSuccess}
        onStudentLoginSuccess={handleStudentLoginSuccess}
        onAdminLoginSuccess={handleAdminLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-900 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Offline Sync Banner */}
      <OfflineSyncBanner />

      {/* Classroom / Podium Tablet Mode Overlay */}
      {isTabletModeOpen && (
        activeSession ? (
          <ClassroomTabletMode
            session={activeSession}
            onExit={() => setIsTabletModeOpen(false)}
            onSimulateScan={handleSimulateScan}
            onManualMarkPresent={handleManualMarkPresent}
          />
        ) : (
          <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <span className="w-4 h-4 rounded-full bg-indigo-400 animate-ping"></span>
            </div>
            <h2 className="text-xl font-bold font-['Playfair_Display',serif]">Podium Tablet Mode</h2>
            <p className="text-sm text-slate-400 text-center max-w-md">
              Start an attendance session from your schedule or classes tab first to broadcast the live dynamic QR kiosk on this tablet.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setIsTabletModeOpen(false);
                  setActiveTab('classes');
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Go to Classes & Start Session
              </button>
              <button
                onClick={() => setIsTabletModeOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-bold transition cursor-pointer"
              >
                Exit Tablet Mode
              </button>
            </div>
          </div>
        )
      )}

      {/* Persistent Navigation */}
      <Navbar
        teacher={teacher}
        student={student}
        admin={admin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSessionActive={!!activeSession}
        onOpenTabletMode={() => setIsTabletModeOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="animate-fadeIn">
        {/* If logged in as Admin */}
        {admin && (
          <AdminDashboard adminUser={admin} />
        )}

        {/* If logged in as Student */}
        {student && (
          <StudentDashboard
            loggedInStudent={student}
            activeSession={activeSession}
            socket={socket}
          />
        )}

        {/* If logged in as Teacher */}
        {teacher && activeTab === 'dashboard' && (
          <Dashboard
            teacher={teacher}
            timetable={timetable}
            dailyAttendance={dailyAttendance}
            lowAttendanceStudents={lowAttendanceStudents}
            onStartSession={handleStartSession}
            onGoToClasses={() => setActiveTab('classes')}
          />
        )}

        {teacher && activeTab === 'classes' && (
          <ClassesManagement
            classes={classes}
            subjects={subjects}
            branches={branches}
            divisions={divisions}
            semesters={semesters}
            onStartSession={handleStartSession}
            onClassesUpdated={(updated) => setClasses(updated)}
            onSubjectsUpdated={(updated) => setSubjects(updated)}
            onBranchesUpdated={(updated) => setBranches(updated)}
            isLoading={isStartingSession}
          />
        )}

        {teacher && activeTab === 'session' && (
          activeSession ? (
            <LiveAttendanceDashboard
              session={activeSession}
              onEndSession={handleEndSession}
              onSimulateScan={handleSimulateScan}
              onOverrideStatus={handleOverrideStatus}
              onEnterTabletMode={() => setIsTabletModeOpen(true)}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <span className="w-4 h-4 rounded-full bg-slate-300"></span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Playfair_Display',serif]">No Active Attendance Session</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Select a class and subject from the schedule to initiate a real-time attendance session with dynamic QR rotation.
              </p>
              <button
                onClick={() => setActiveTab('classes')}
                className="mt-4 px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Go to Classes
              </button>
            </div>
          )
        )}

        {/* Post Session Attendance Review View */}
        {teacher && activeTab === 'review' && (
          endedSessionForReview ? (
            <PostSessionAttendanceReview
              session={endedSessionForReview}
              teacher={teacher}
              onSaveAndClose={handleSaveReview}
              onGoToDashboard={() => setActiveTab('dashboard')}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
              <h3 className="text-xl font-bold text-slate-900 font-['Playfair_Display',serif]">No Session Available for Review</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Complete an active attendance session to review and audit the student records.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )
        )}

        {teacher && activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}
