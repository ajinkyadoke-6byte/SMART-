import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { io, Socket } from 'socket.io-client';
import { safeFetchJson } from '../utils/apiClient';
import {
  INITIAL_STUDENT_PROFILE,
  INITIAL_ACTIVITIES,
  INITIAL_BADGES,
  INITIAL_LEADERBOARD,
} from '../data/initialData';
import {
  FreePeriodActivity,
  GamificationBadge,
  LeaderboardEntry,
  StudentOnboardingProfile,
} from '../types';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  BookOpen,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowRight,
  Upload,
  SwitchCamera,
  Search,
  Check,
  Smartphone,
  Info,
  Flame,
  Trophy,
  Award,
  Compass,
  Sliders,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  Play,
  RotateCcw,
  Target,
  FileCheck,
  Calendar,
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  avatar: string;
  classId: string;
  className: string;
  overallAttendance: number;
  branch?: string;
  semester?: number;
  division?: string;
}

interface CurrentClassSession {
  id: string;
  sessionCode: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  room: string;
  timeSlot: string;
  teacherName: string;
  startedAt: string;
  status: string;
}

interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  reason?: string;
  code?: string;
  record?: any;
}

interface StudentDashboardProps {
  loggedInStudent?: StudentData | null;
  activeSession?: any | null;
  socket?: Socket | null;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  loggedInStudent,
  activeSession: propActiveSession,
  socket: propSocket,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'schedule' | 'recommendations' | 'gamification' | 'profile'>('attendance');

  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(loggedInStudent || null);
  const [activeSession, setActiveSession] = useState<CurrentClassSession | any | null>(propActiveSession || null);
  const [alreadyMarked, setAlreadyMarked] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(!propActiveSession);

  // Synced Timetable State
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timetableFilterDay, setTimetableFilterDay] = useState<string>('all');
  const [customBranch, setCustomBranch] = useState<string>('Computer Science');
  const [customSem, setCustomSem] = useState<number>(4);
  const [customDiv, setCustomDiv] = useState<string>('A');

  // Scanner & Background Geofence state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const bgCoordsRef = useRef<{ latitude: number; longitude: number; accuracy?: number } | undefined>(undefined);

  // Manual input state
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isSelectingProfile, setIsSelectingProfile] = useState<boolean>(false);

  // Gamification & Profile State
  const [profile, setProfile] = useState<StudentOnboardingProfile>(INITIAL_STUDENT_PROFILE);
  const [activities, setActivities] = useState<FreePeriodActivity[]>(INITIAL_ACTIVITIES);
  const [badges, setBadges] = useState<GamificationBadge[]>(INITIAL_BADGES);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // Interactive Activity Modal
  const [activeExercise, setActiveExercise] = useState<FreePeriodActivity | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [exerciseResult, setExerciseResult] = useState<{ submitted: boolean; scoreEarned: number } | null>(null);

  // Profile Edit State
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSavedToast, setProfileSavedToast] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanAnimFrameRef = useRef<number | null>(null);

  // Fetch student directory and current class
  const fetchCurrentClassData = async (studentId?: string) => {
    setIsLoadingSession(true);
    try {
      const activeId = studentId || selectedStudent?.id || loggedInStudent?.id;
      const activeRoll = selectedStudent?.rollNo || loggedInStudent?.rollNo;
      const activeName = selectedStudent?.name || loggedInStudent?.name;
      const studentQuery = activeId
        ? `?studentId=${encodeURIComponent(activeId)}&rollNo=${encodeURIComponent(activeRoll || '')}&name=${encodeURIComponent(activeName || '')}`
        : '';
      const { ok, data } = await safeFetchJson(`/api/student/current-class${studentQuery}`);
      if (ok && data) {
        if (data.student) {
          setSelectedStudent(data.student);
        }
        setActiveSession(data.activeSession || null);
        setAlreadyMarked(!!data.alreadyMarked);
        setExistingRecord(data.existingRecord || null);
      }
    } catch (err) {
      console.error('Failed to load student current class info:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async (studentId?: string) => {
    try {
      const sId = studentId || selectedStudent?.id || loggedInStudent?.id || 'std-class-cse-a-1';
      const { ok, data } = await safeFetchJson(`/api/student/activities?studentId=${encodeURIComponent(sId)}`);
      if (ok && data) {
        if (data.activities) setActivities(data.activities);
        if (data.studentProfile) setProfile(data.studentProfile);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  // Fetch live master timetable
  const fetchTimetableData = async () => {
    try {
      const { ok, data } = await safeFetchJson('/api/timetable');
      if (ok && Array.isArray(data)) {
        setTimetable(data);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
  };

  // Keep activeSession synced with prop if passed
  useEffect(() => {
    if (propActiveSession !== undefined) {
      setActiveSession(propActiveSession);
      if (propActiveSession) {
        setIsLoadingSession(false);
        const s = selectedStudent || loggedInStudent;
        if (s && Array.isArray(propActiveSession.students)) {
          const match = propActiveSession.students.find(
            (st: any) => (s.id && st.id === s.id) || (s.rollNo && st.rollNo && st.rollNo.toUpperCase() === s.rollNo.toUpperCase())
          );
          if (match && match.status === 'present') {
            setAlreadyMarked(true);
            setExistingRecord({ timestamp: match.markedAt || 'Just now', verificationMethod: match.verificationMethod });
          }
        }
      }
    }
  }, [propActiveSession, selectedStudent?.id, selectedStudent?.rollNo]);

  // Real-time WebSocket connection for student view
  useEffect(() => {
    const socketClient: Socket = propSocket || io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    const handleSessionStarted = (sessionData: any) => {
      setActiveSession(sessionData);
      setIsLoadingSession(false);
      setAlreadyMarked(false);
      setExistingRecord(null);
      setVerificationResult(null);
    };

    const handleSessionEnded = () => {
      setActiveSession(null);
      setIsLoadingSession(false);
    };

    const handleSessionSync = (sessionData: any) => {
      if (sessionData && (sessionData.status === 'active' || sessionData.id)) {
        setActiveSession(sessionData);
        setIsLoadingSession(false);
        const s = selectedStudent || loggedInStudent;
        if (s && Array.isArray(sessionData.students)) {
          const match = sessionData.students.find(
            (st: any) => (s.id && st.id === s.id) || (s.rollNo && st.rollNo && st.rollNo.toUpperCase() === s.rollNo.toUpperCase())
          );
          if (match && match.status === 'present') {
            setAlreadyMarked(true);
            setExistingRecord({ timestamp: match.markedAt || 'Just now', verificationMethod: match.verificationMethod });
          }
        }
      } else {
        setActiveSession(null);
        setIsLoadingSession(false);
      }
    };

    const handleQrTick = (data: { secondsRemaining: number; totalSeconds: number }) => {
      setActiveSession((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          qrExpiresIn: data.secondsRemaining,
          qrTotalDuration: data.totalSeconds,
        };
      });
    };

    const handleQrRotated = (data: { qrCodeUrl: string; qrToken: string; secondsRemaining: number; session?: any }) => {
      setActiveSession((prev: any) => {
        if (!prev && !data.session) return null;
        return {
          ...(data.session || prev),
          qrCodeUrl: data.qrCodeUrl,
          qrToken: data.qrToken,
          qrExpiresIn: data.secondsRemaining,
        };
      });
    };

    const handleAttendanceMarked = (payload: { student: any; stats: any; sessionId: string; session?: any }) => {
      if (payload.session) {
        setActiveSession(payload.session);
      }
      const s = selectedStudent || loggedInStudent;
      if (s && payload.student) {
        const isMatch = (s.id && payload.student.id === s.id) || 
          (s.rollNo && payload.student.rollNo && s.rollNo.toUpperCase() === payload.student.rollNo.toUpperCase());
        if (isMatch) {
          setAlreadyMarked(true);
          setExistingRecord({
            timestamp: payload.student.markedAt || 'Just now',
            verificationMethod: payload.student.verificationMethod || 'BLE & Dynamic QR Verified',
          });
          setVerificationResult({
            success: true,
            message: 'Attendance verified and recorded in live class roster ✓',
            record: {
              timestamp: payload.student.markedAt || 'Just now',
              verificationMethod: payload.student.verificationMethod,
            },
          });
        }
      }
    };

    const handleAttendanceUpdated = (payload: { student: any; stats: any; sessionId: string; session?: any }) => {
      if (payload.session) {
        setActiveSession(payload.session);
      }
      const s = selectedStudent || loggedInStudent;
      if (s && payload.student) {
        const isMatch = (s.id && payload.student.id === s.id) || 
          (s.rollNo && payload.student.rollNo && s.rollNo.toUpperCase() === payload.student.rollNo.toUpperCase());
        if (isMatch) {
          setAlreadyMarked(payload.student.status === 'present');
        }
      }
    };

    socketClient.on('session:started', handleSessionStarted);
    socketClient.on('session:ended', handleSessionEnded);
    socketClient.on('session:sync', handleSessionSync);
    socketClient.on('qr:tick', handleQrTick);
    socketClient.on('qr:rotated', handleQrRotated);
    socketClient.on('attendance:marked', handleAttendanceMarked);
    socketClient.on('attendance:updated', handleAttendanceUpdated);

    // Continuous fallback poll every 3.5 seconds
    const intervalId = setInterval(() => {
      fetchCurrentClassData(selectedStudent?.id);
    }, 3500);

    return () => {
      clearInterval(intervalId);
      socketClient.off('session:started', handleSessionStarted);
      socketClient.off('session:ended', handleSessionEnded);
      socketClient.off('session:sync', handleSessionSync);
      socketClient.off('qr:tick', handleQrTick);
      socketClient.off('qr:rotated', handleQrRotated);
      socketClient.off('attendance:marked', handleAttendanceMarked);
      socketClient.off('attendance:updated', handleAttendanceUpdated);
      if (!propSocket) {
        socketClient.disconnect();
      }
    };
  }, [propSocket, selectedStudent?.id, selectedStudent?.rollNo]);

  // Sync when loggedInStudent prop changes or initial load
  useEffect(() => {
    if (loggedInStudent) {
      setSelectedStudent(loggedInStudent);
      fetchCurrentClassData(loggedInStudent.id);
      fetchRecommendations(loggedInStudent.id);
    }
  }, [loggedInStudent?.id, loggedInStudent?.name, loggedInStudent?.rollNo]);

  // Keep leaderboard synced with active student name
  useEffect(() => {
    if (selectedStudent) {
      setLeaderboard((prev) =>
        prev.map((entry) => {
          if (entry.isCurrentUser) {
            return {
              ...entry,
              name: selectedStudent.name,
              rollNo: selectedStudent.rollNo,
              avatar: selectedStudent.avatar || entry.avatar,
              attendancePercent: selectedStudent.overallAttendance || entry.attendancePercent,
            };
          }
          return entry;
        })
      );
    }
  }, [selectedStudent?.id, selectedStudent?.name, selectedStudent?.rollNo]);

  useEffect(() => {
    fetchTimetableData();

    // Fetch students list for testing switcher
    safeFetchJson('/api/student/list')
      .then(({ ok, data }) => {
        if (ok && data?.students && data.students.length > 0) {
          let studentList = data.students;
          if (loggedInStudent && !studentList.some((s: StudentData) => s.id === loggedInStudent.id || s.rollNo === loggedInStudent.rollNo)) {
            studentList = [loggedInStudent, ...studentList];
          }
          setStudents(studentList);

          if (!loggedInStudent) {
            const savedRoll = localStorage.getItem('attendit_student_roll');
            const matched = savedRoll ? studentList.find((s: StudentData) => s.rollNo === savedRoll) : null;
            const initial = matched || studentList[0];
            setSelectedStudent(initial);
            fetchCurrentClassData(initial.id);
            fetchRecommendations(initial.id);
          }
        }
      })
      .catch(() => {
        if (!loggedInStudent) {
          fetchCurrentClassData();
          fetchRecommendations();
        }
      });

    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('t');
    const scanDataParam = params.get('scanData');
    if (tokenParam || scanDataParam) {
      triggerVerificationWorkflow(tokenParam || scanDataParam || '');
    }
  }, []);

  // Eager background geofencing without blocking attendance workflow or invalidating rotating QR
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          bgCoordsRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        },
        (err) => {
          console.debug('Background geolocation state:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    }
  }, []);

  // Handle switching active student test profile
  const handleSelectStudent = (std: StudentData) => {
    setSelectedStudent(std);
    localStorage.setItem('attendit_student_roll', std.rollNo);
    setVerificationResult(null);
    setIsSelectingProfile(false);
    fetchCurrentClassData(std.id);
    fetchRecommendations(std.id);
  };

  // Direct Verification Workflow: Instantly executes server verify without blocking modal/liveness delay
  const triggerVerificationWorkflow = (tokenOrQrData: string) => {
    if (!tokenOrQrData) return;
    executeServerVerify(tokenOrQrData);
  };

  // Final Verify Pipeline Execution
  const executeServerVerify = async (
    token: string,
    extraData?: {
      isFlagged?: boolean;
      flagReason?: string;
      coordinates?: { latitude: number; longitude: number; accuracy?: number };
    }
  ) => {
    setIsVerifying(true);
    setVerificationResult(null);

    const coordinates = extraData?.coordinates || bgCoordsRef.current;

    try {
      // Check if network is offline -> queue locally
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const queueItem = {
          id: `offline-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          studentId: selectedStudent?.id || 'std-class-cse-a-1',
          rollNo: selectedStudent?.rollNo || '22CS001',
          studentName: selectedStudent?.name || 'Student',
          classId: selectedStudent?.classId || 'class-cse-a',
          rawQrData: token,
          coordinates,
          deviceInfo: 'Offline Mobile PWA Client (Background Geofenced)',
          verificationPassed: true,
          syncStatus: 'pending' as const,
        };

        const existing = localStorage.getItem('attendit_offline_queue');
        const queue = existing ? JSON.parse(existing) : [];
        queue.push(queueItem);
        localStorage.setItem('attendit_offline_queue', JSON.stringify(queue));

        setVerificationResult({
          success: true,
          message: 'Saved to Offline Queue ✓ (Background geofenced, will auto-sync)',
          record: queueItem,
        });
        setAlreadyMarked(true);
        setProfile((prev) => ({ ...prev, xp: prev.xp + 20 }));
        return;
      }

      const { ok, status, data } = await safeFetchJson('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawQrData: token,
          token,
          studentId: selectedStudent?.id,
          rollNo: selectedStudent?.rollNo,
          metadata: {
            deviceInfo: 'Instant Camera Scanner Client',
            scannedAt: new Date().toISOString(),
            isFlagged: extraData?.isFlagged || false,
            flagReason: extraData?.flagReason,
            coordinates,
          },
        }),
      });

      if (ok && data?.success) {
        setVerificationResult({
          success: true,
          message: data.message || 'Attendance verified and marked successfully!',
          record: data.record,
        });
        setAlreadyMarked(true);
        setExistingRecord(data.record);

        // Award +20 XP for on-time verified attendance
        setProfile((prev) => {
          const updatedXp = prev.xp + 20;
          return { ...prev, xp: updatedXp };
        });
      } else {
        setVerificationResult({
          success: false,
          error: data?.error || 'Verification Failed',
          reason: data?.reason || `Server returned error status ${status}.`,
          code: data?.code || 'VERIFICATION_ERROR',
        });
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        error: 'Network / Verification Error',
        reason: err?.message || 'Could not contact verification gateway.',
        code: 'NETWORK_ERROR',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setVerificationResult(null);
    setIsScannerOpen(true);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Unable to access device camera directly. You can snap or upload a photo of the QR code below.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanAnimFrameRef.current) {
      cancelAnimationFrame(scanAnimFrameRef.current);
      scanAnimFrameRef.current = null;
    }
    setIsScannerOpen(false);
  };

  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Frame scanner loop
  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            stopCamera();
            triggerVerificationWorkflow(code.data);
            return;
          }
        }
      }
    }
    scanAnimFrameRef.current = requestAnimationFrame(tickScan);
  };

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            triggerVerificationWorkflow(code.data);
          } else {
            setVerificationResult({
              success: false,
              error: 'QR Not Detected',
              reason: 'No legible QR code found in uploaded image. Please ensure high clarity and no glare.',
              code: 'NO_QR_IN_IMAGE',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Instant Test Scan helper for Demo judges
  const handleSimulateActiveScan = () => {
    if (!activeSession) return;
    const directPayload = JSON.stringify({
      app: 'AttendIt',
      sessionId: activeSession.id || activeSession.sessionId,
      sessionCode: activeSession.sessionCode,
      token: activeSession.qrToken || activeSession.token || '',
      ts: Date.now(),
    });
    triggerVerificationWorkflow(directPayload);
  };

  // Handle Free-Period Activity Completion
  const handleStartActivity = (act: FreePeriodActivity) => {
    setActiveExercise(act);
    setSelectedAnswers({});
    setExerciseResult(null);
  };

  const handleSubmitExercise = async () => {
    if (!activeExercise) return;

    let score = activeExercise.xpReward || 50;
    try {
      const { ok, data } = await safeFetchJson('/api/student/complete-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent?.id || 'std-class-cse-a-1',
          activityId: activeExercise.id,
          scoreEarned: score,
        }),
      });

      if (ok && data?.profile) {
        setProfile(data.profile);
      } else {
        setProfile((prev) => ({
          ...prev,
          xp: prev.xp + score,
          completedActivitiesCount: prev.completedActivitiesCount + 1,
        }));
      }
    } catch {
      setProfile((prev) => ({
        ...prev,
        xp: prev.xp + score,
        completedActivitiesCount: prev.completedActivitiesCount + 1,
      }));
    }

    setExerciseResult({ submitted: true, scoreEarned: score });
  };

  // Save Onboarding Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { ok, data } = await safeFetchJson('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (ok && data?.profile) {
        setProfile(data.profile);
      }
      fetchRecommendations(selectedStudent?.id);
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 4000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div
      id="student-dashboard-root"
      className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header & Stats */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative shrink-0">
              <img
                src={
                  selectedStudent?.avatar ||
                  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop'
                }
                alt={selectedStudent?.name || 'Student'}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  {selectedStudent?.rollNo || '22CS001'}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[160px] sm:max-w-none">
                  {selectedStudent?.className || 'CSE-A (Semester 4)'}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 mt-0.5 sm:mt-1">
                {selectedStudent?.name || loggedInStudent?.name || 'Student'}
              </h2>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsSelectingProfile(!isSelectingProfile)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] sm:text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Switch Student</span>
            </button>
          </div>
        </div>

        {/* Quick Gamification Bar in Header */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Attendance</div>
              <div className="text-sm sm:text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                {selectedStudent?.overallAttendance || 94}%
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          </div>

          <div className="p-2.5 sm:p-3 bg-amber-50/70 rounded-2xl border border-amber-100 flex items-center justify-between">
            <div>
              <div className="text-amber-700 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Daily Streak</div>
              <div className="text-sm sm:text-base font-bold text-amber-900 font-['Playfair_Display',serif]">
                {profile.streakDays} Days
              </div>
            </div>
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0 fill-amber-400" />
          </div>

          <div className="p-2.5 sm:p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <div>
              <div className="text-indigo-700 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Skill XP</div>
              <div className="text-sm sm:text-base font-bold text-indigo-950 font-['Playfair_Display',serif]">
                {profile.xp} XP
              </div>
            </div>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
          </div>
        </div>

        {/* Profile Switcher Dropdown */}
        {isSelectingProfile && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-fadeIn">
            <div className="text-xs font-bold text-slate-700 px-1">Select Active Student Demo Profile:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className={`p-2 rounded-xl text-left text-xs transition flex items-center gap-2 cursor-pointer ${
                    selectedStudent?.id === s.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <img src={s.avatar} alt={s.name} className="w-6 h-6 rounded-lg object-cover" />
                  <div className="truncate">
                    <div>{s.name}</div>
                    <div className={selectedStudent?.id === s.id ? 'text-indigo-100 text-[10px]' : 'text-slate-400 text-[10px]'}>
                      {s.rollNo} • {s.overallAttendance}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-200/70 rounded-2xl text-xs font-medium text-slate-600 overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Attendance Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'schedule'
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Class Timetable</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'recommendations'
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Free-Period Growth</span>
        </button>

        <button
          onClick={() => setActiveTab('gamification')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'gamification'
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>XP & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Goals & NEP Profile</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ATTENDANCE SCANNER & CURRENT LECTURE STATUS */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Verification Result Toast/Banner */}
          {verificationResult && (
            <div
              className={`p-4 rounded-3xl border text-xs animate-fadeIn ${
                verificationResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {verificationResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">
                      {verificationResult.success ? 'Attendance Verified ✓' : verificationResult.error}
                    </h4>
                    <p className="leading-relaxed opacity-90">
                      {verificationResult.success
                        ? verificationResult.message
                        : verificationResult.reason}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setVerificationResult(null)}
                  className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-50 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Current Class Session Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-700">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">
                    Current Lecture Status
                  </h3>
                  <p className="text-xs text-slate-500">Live timetable matching</p>
                </div>
              </div>

              {activeSession ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                  Live Session Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  No Active Lecture
                </span>
              )}
            </div>

            {isLoadingSession ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-500">Polling attendance channel...</p>
              </div>
            ) : activeSession ? (
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-slate-950 text-white space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold text-slate-200">
                        {activeSession.subjectCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-slate-200">
                        {activeSession.className}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center space-x-1.5 font-medium bg-white/10 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeSession.timeSlot}</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-['Playfair_Display',Georgia,serif] font-bold tracking-tight">
                    {activeSession.subjectName}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Faculty: <strong className="text-white">{activeSession.teacherName}</strong> • Room:{' '}
                    <strong className="text-slate-200">{activeSession.room}</strong>
                  </p>
                </div>

                {alreadyMarked ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-emerald-900">Attendance Recorded ✓</h5>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Your check-in was confirmed at{' '}
                        <strong>{existingRecord?.timestamp || '10:05 AM'}</strong> via rotating QR & background geofencing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800 flex items-start space-x-3">
                    <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Scan the teacher's rotating dynamic QR code to directly record attendance and claim <strong>+20 XP</strong>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Active Attendance Session</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    When your instructor starts attendance on classroom screen, class details and scanner activate automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Scanner Triggers */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => startCamera('environment')}
                disabled={isVerifying || isScannerOpen}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Open Camera Scanner</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isVerifying || isScannerOpen}
                  className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload QR Photo</span>
                </button>

                {activeSession && (
                  <button
                    onClick={handleSimulateActiveScan}
                    disabled={isVerifying || isScannerOpen}
                    className="py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Instant Live Test Scan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: CLASS SCHEDULE & LIVE TIMETABLE SYNC */}
      {/* ======================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Cohort Details & Custom Filters */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">
                    Master Class Timetable
                  </h3>
                  <p className="text-xs text-slate-500">
                    Synchronized live with academic admin schedules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Synced with Admin
                </span>
              </div>
            </div>

            {/* Student's Cohort Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Branch
                </label>
                <select
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Computer Science">Computer Science (CSE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Artificial Intelligence">AI & Data Science (AI&DS)</option>
                  <option value="Electronics">Electronics (ECE)</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Year / Semester
                </label>
                <select
                  value={customSem}
                  onChange={(e) => setCustomSem(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value={1}>Semester 1 (Year 1)</option>
                  <option value={2}>Semester 2 (Year 1)</option>
                  <option value={3}>Semester 3 (Year 2)</option>
                  <option value={4}>Semester 4 (Year 2)</option>
                  <option value={5}>Semester 5 (Year 3)</option>
                  <option value={6}>Semester 6 (Year 3)</option>
                  <option value={7}>Semester 7 (Year 4)</option>
                  <option value={8}>Semester 8 (Year 4)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Division
                </label>
                <select
                  value={customDiv}
                  onChange={(e) => setCustomDiv(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Day of Week
                </label>
                <select
                  value={timetableFilterDay}
                  onChange={(e) => setTimetableFilterDay(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="all">All Days</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timetable Slot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timetable
              .filter((slot) => {
                if (customBranch) {
                  const bMatch =
                    slot.branch?.toLowerCase().includes(customBranch.toLowerCase()) ||
                    slot.className?.toLowerCase().includes(customBranch.toLowerCase()) ||
                    (slot as any).class?.toLowerCase().includes(customBranch.toLowerCase());
                  if (!bMatch) return false;
                }
                if (customSem) {
                  const sMatch =
                    slot.semester === customSem ||
                    slot.className?.includes(`Semester ${customSem}`) ||
                    (slot as any).class?.includes(`Sem ${customSem}`);
                  if (!sMatch) return false;
                }
                if (customDiv) {
                  const dMatch =
                    slot.division?.toUpperCase() === customDiv.toUpperCase() ||
                    slot.className?.includes(`-${customDiv}`) ||
                    slot.className?.includes(`Div ${customDiv}`) ||
                    (slot as any).class?.includes(`-${customDiv}`);
                  if (!dMatch) return false;
                }
                if (timetableFilterDay !== 'all') {
                  const dayMatch =
                    slot.dayOfWeek?.toLowerCase() === timetableFilterDay.toLowerCase() ||
                    (slot as any).day?.toLowerCase() === timetableFilterDay.toLowerCase();
                  if (!dayMatch) return false;
                }
                return true;
              })
              .map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3 hover:border-indigo-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {slot.dayOfWeek || (slot as any).day}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {slot.room}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                      {slot.subjectName || (slot as any).subject}
                    </h4>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      {slot.subjectCode} • {slot.className || (slot as any).class}
                    </p>
                    {slot.teacherName && (
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Faculty: {slot.teacherName}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {slot.startTime || (slot as any).time?.split(' - ')[0]} -{' '}
                        {slot.endTime || (slot as any).time?.split(' - ')[1]}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full">
                      Confirmed Slot
                    </span>
                  </div>
                </div>
              ))}

            {timetable.filter((slot) => {
              if (customBranch) {
                const bMatch =
                  slot.branch?.toLowerCase().includes(customBranch.toLowerCase()) ||
                  slot.className?.toLowerCase().includes(customBranch.toLowerCase()) ||
                  (slot as any).class?.toLowerCase().includes(customBranch.toLowerCase());
                if (!bMatch) return false;
              }
              if (customSem) {
                const sMatch =
                  slot.semester === customSem ||
                  slot.className?.includes(`Semester ${customSem}`) ||
                  (slot as any).class?.includes(`Sem ${customSem}`);
                if (!sMatch) return false;
              }
              if (customDiv) {
                const dMatch =
                  slot.division?.toUpperCase() === customDiv.toUpperCase() ||
                  slot.className?.includes(`-${customDiv}`) ||
                  slot.className?.includes(`Div ${customDiv}`) ||
                  (slot as any).class?.includes(`-${customDiv}`);
                if (!dMatch) return false;
              }
              if (timetableFilterDay !== 'all') {
                const dayMatch =
                  slot.dayOfWeek?.toLowerCase() === timetableFilterDay.toLowerCase() ||
                  (slot as any).day?.toLowerCase() === timetableFilterDay.toLowerCase();
                if (!dayMatch) return false;
              }
              return true;
            }).length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No timetable entries found</h4>
                <p className="text-xs text-slate-500">
                  Try adjusting the Branch, Semester, or Division filter above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FREE-PERIOD RECOMMENDATIONS & WHY ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                  <Compass className="w-4 h-4" />
                  <span>Rule-Based Learning Engine</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Playfair_Display',serif] mt-1">
                  Personalized Free-Period Activities
                </h3>
                <p className="text-xs text-slate-500">
                  Targeted micro-labs matched to your weak subjects, career goal ({profile.careerGoal}), and {profile.freeTimeMinutes}m free window.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Free Time & Goals</span>
              </button>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-indigo-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                        {act.subjectName}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                        {act.nepCreditLabel}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {act.durationMinutes} mins
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                      {act.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {act.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartActivity(act)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Activity (+{act.xpReward} XP)</span>
                  </button>
                </div>

                {/* "Why this recommendation?" Panel */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Why This Recommendation?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Target: Weak subject reinforcement</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>Goal: Aligns with {profile.careerGoal}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Time: Fits {profile.freeTimeMinutes}m period</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: GAMIFICATION, STREAKS, BADGES & CAMPUS LEADERBOARD */}
      {/* ======================================================== */}
      {activeTab === 'gamification' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Gamification Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                {profile.xp} XP
              </div>
              <div className="text-xs text-slate-500">Skill Enhancement Credits</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-6 h-6 fill-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                {profile.streakDays} Days
              </div>
              <div className="text-xs text-slate-500">Consecutive Class Streak</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                {badges.filter((b) => b.unlocked).length} / {badges.length}
              </div>
              <div className="text-xs text-slate-500">Unlocked NEP Badges</div>
            </div>
          </div>

          {/* Badges Showcase */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Playfair_Display',serif]">
                Earned Badges & Milestones
              </h3>
              <p className="text-xs text-slate-500">Unlocked through verified attendance & free-period mastery</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition space-y-2 ${
                    badge.unlocked
                      ? 'bg-indigo-50/40 border-indigo-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-bold text-indigo-600 shadow-2xs">
                      {badge.icon === 'flame' ? (
                        <Flame className="w-5 h-5 text-amber-500 fill-amber-400" />
                      ) : badge.icon === 'database' ? (
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      ) : badge.icon === 'sparkles' ? (
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    {badge.unlocked ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        Unlocked ✓
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-medium">
                        {badge.progressPercent}%
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{badge.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{badge.description}</p>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium">
                    Criteria: {badge.requirement}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Leaderboard */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Playfair_Display',serif]">
                  Campus Leaderboard
                </h3>
                <p className="text-xs text-slate-500">Semester 4 Computer Science Cohort</p>
              </div>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Streak</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">XP Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`transition ${
                        entry.isCurrentUser
                          ? 'bg-indigo-50/80 font-bold text-indigo-950'
                          : 'hover:bg-slate-50/70 text-slate-700'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {entry.rank === 1 ? '🥇 #1' : entry.rank === 2 ? '🥈 #2' : entry.rank === 3 ? '🥉 #3' : `#${entry.rank}`}
                      </td>
                      <td className="py-3.5 px-4 flex items-center gap-2.5">
                        <img src={entry.avatar} alt={entry.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold">{entry.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{entry.rollNo}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          {entry.streakDays}d
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">{entry.attendancePercent}%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600">
                        {entry.xp} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STUDENT ONBOARDING PROFILE & CAREER GOALS */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-fadeIn"
        >
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-['Playfair_Display',serif]">
              NEP-2020 Student Profile & Goal Setup
            </h3>
            <p className="text-xs text-slate-500">
              Your responses configure the rule-based recommendation engine for automated free-period activities.
            </p>
          </div>

          {profileSavedToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Preferences saved! Recommended activities have been updated.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Career Goal */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Primary Career Goal / Track</label>
              <select
                value={profile.careerGoal}
                onChange={(e) => setProfile({ ...profile, careerGoal: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-900"
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Data Scientist & AI Engineer">Data Scientist & AI Engineer</option>
                <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                <option value="Competitive Programmer">Competitive Programmer</option>
              </select>
            </div>

            {/* Free Time Available */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Daily Free Time Window Between Lectures</label>
              <select
                value={profile.freeTimeMinutes}
                onChange={(e) => setProfile({ ...profile, freeTimeMinutes: Number(e.target.value) })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-900"
              >
                <option value={15}>15 Minutes (Quick Sprint)</option>
                <option value={30}>30 Minutes (Standard Lab)</option>
                <option value={45}>45 Minutes (Deep Dive Drill)</option>
                <option value={60}>60 Minutes (Project Sandbox)</option>
              </select>
            </div>

            {/* Learning Style */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Preferred Learning Style</label>
              <select
                value={profile.learningStyle}
                onChange={(e) => setProfile({ ...profile, learningStyle: e.target.value as any })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-900"
              >
                <option value="hands_on">Hands-on Coding Labs</option>
                <option value="quizzes">Interactive Quizzes & Challenges</option>
                <option value="video">Concept Visualizers</option>
                <option value="notes">Technical Documentation</option>
              </select>
            </div>

            {/* Identified Weak Subjects */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Identified Subjects for Reinforcement</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'sub-os', name: 'Operating Systems' },
                  { id: 'sub-cn', name: 'Computer Networks' },
                  { id: 'sub-dbms', name: 'Database Systems' },
                  { id: 'sub-ds', name: 'Data Structures' },
                ].map((sub) => {
                  const isSelected = profile.weakSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? profile.weakSubjects.filter((x) => x !== sub.id)
                          : [...profile.weakSubjects, sub.id];
                        setProfile({ ...profile, weakSubjects: updated });
                      }}
                      className={`p-2.5 rounded-xl border text-left text-[11px] font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{sub.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {isSavingProfile ? 'Saving...' : 'Save & Update Growth Plan'}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* INTERACTIVE ACTIVITY / MICRO-LAB QUIZ MODAL */}
      {/* ======================================================== */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                  {activeExercise.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveExercise(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>{activeExercise.nepCreditLabel}</span>
                  <span className="text-indigo-700 font-mono">+{activeExercise.xpReward} XP Reward</span>
                </div>
                <p className="text-[11px] text-indigo-800">{activeExercise.description}</p>
              </div>

              {/* Questions */}
              {activeExercise.quizQuestions && activeExercise.quizQuestions.length > 0 ? (
                <div className="space-y-5">
                  {activeExercise.quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="font-bold text-slate-900">
                        {qIdx + 1}. {q.question}
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isChosen = selectedAnswers[qIdx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })
                              }
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                                isChosen
                                  ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{opt}</span>
                              {isChosen && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>

                      {exerciseResult?.submitted && (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] mt-2">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center space-y-3 bg-slate-50 rounded-2xl">
                  <BookOpen className="w-8 h-8 text-indigo-600 mx-auto" />
                  <p className="text-slate-600">
                    Interactive sandbox simulation completed. Review the core concepts and claim credit.
                  </p>
                </div>
              )}

              {exerciseResult?.submitted && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-center space-y-1 animate-fadeIn">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm">Challenge Completed!</h4>
                  <p className="text-xs">
                    You earned <strong>+{exerciseResult.scoreEarned} XP</strong> toward your NEP-2020 skill credit.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              {exerciseResult?.submitted ? (
                <button
                  onClick={() => setActiveExercise(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Close & Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmitExercise}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Submit & Claim +{activeExercise.xpReward} XP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CAMERA SCANNER MODAL OVERLAY */}
      {/* ======================================================== */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm">Align Classroom QR Code</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleCamera}
                title="Flip Camera"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
              <button
                onClick={stopCamera}
                title="Close Scanner"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewport Box */}
          <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden rounded-3xl bg-black border border-white/10">
            {cameraError ? (
              <div className="p-6 text-center text-white space-y-4 max-w-sm">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-200 leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => {
                    stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Snap / Upload Photo Instead
                </button>
              </div>
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target Bounding Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-64 h-64 border-2 border-indigo-400/80 rounded-2xl relative shadow-2xl">
                    <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl"></span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr"></span>
                    <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl"></span>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br"></span>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-white/10 text-white space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Point at active rotating QR code</span>
              <button
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                Upload Photo
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Or paste QR token here..."
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                className="text-xs flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  if (manualTokenInput.trim()) {
                    stopCamera();
                    triggerVerificationWorkflow(manualTokenInput.trim());
                  }
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
