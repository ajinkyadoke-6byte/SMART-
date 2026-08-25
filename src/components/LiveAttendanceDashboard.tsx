import React, { useState, useEffect, useRef } from 'react';
import { AttendanceSession, Student } from '../types';
import {
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserX,
  Search,
  CheckCircle2,
  StopCircle,
  Zap,
  Radio,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Tablet,
  Sparkles,
  Bell,
  Activity,
} from 'lucide-react';

interface LiveAttendanceDashboardProps {
  session: AttendanceSession;
  onEndSession: () => void;
  onSimulateScan: (isFlagged?: boolean) => void;
  onOverrideStatus?: (studentId: string, newStatus: 'present' | 'flagged' | 'absent') => void;
  onEnterTabletMode?: () => void;
}

export const LiveAttendanceDashboard: React.FC<LiveAttendanceDashboardProps> = ({
  session,
  onEndSession,
  onSimulateScan,
  onOverrideStatus,
  onEnterTabletMode,
}) => {
  // Tab for filtering student roster: 'attendees' (present), 'flagged', 'absent'
  const [activeListTab, setActiveListTab] = useState<'attendees' | 'flagged' | 'absent'>('attendees');
  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Toast for newly arrived student
  const [latestScanToast, setLatestScanToast] = useState<{
    student: Student;
    timestamp: string;
  } | null>(null);

  const prevPresentCountRef = useRef<number>(
    session.students.filter((s) => s.status === 'present').length
  );

  // Time elapsed live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect newly scanned students and display banner toast
  useEffect(() => {
    const presentList = session.students.filter((s) => s.status === 'present');
    if (presentList.length > prevPresentCountRef.current) {
      // Find newly marked student (most recent markedAt or last in array)
      const sortedByMarked = [...presentList].sort((a, b) => {
        if (!a.markedAt) return 1;
        if (!b.markedAt) return -1;
        return b.markedAt.localeCompare(a.markedAt);
      });
      const newest = sortedByMarked[0];
      if (newest) {
        setLatestScanToast({
          student: newest,
          timestamp: newest.markedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });

        // Auto-clear toast after 6 seconds
        const toastTimer = setTimeout(() => {
          setLatestScanToast(null);
        }, 6000);
        return () => clearTimeout(toastTimer);
      }
    }
    prevPresentCountRef.current = presentList.length;
  }, [session.students]);

  const formatElapsed = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Group students & sort attendees by most recent check-in
  const presentStudents = [...session.students]
    .filter((s) => s.status === 'present')
    .sort((a, b) => {
      if (!a.markedAt) return 1;
      if (!b.markedAt) return -1;
      return b.markedAt.localeCompare(a.markedAt);
    });

  const flaggedStudents = session.students.filter((s) => s.status === 'flagged');
  const absentStudents = session.students.filter((s) => s.status === 'absent');

  // Filtered roster based on tab & search
  const currentList =
    activeListTab === 'attendees'
      ? presentStudents
      : activeListTab === 'flagged'
      ? flaggedStudents
      : absentStudents;

  const filteredStudents = currentList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const qrSeconds = session.qrExpiresIn ?? 15;
  const qrTotal = session.qrTotalDuration || 15;
  const qrProgressPercent = Math.max(0, Math.min(100, (qrSeconds / qrTotal) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Live Scan Notification Toast Banner */}
      {latestScanToast && (
        <div
          id="live-scan-toast"
          className="fixed top-20 right-6 z-50 max-w-sm bg-slate-950/95 border-2 border-emerald-500/80 text-white p-4 rounded-3xl shadow-2xl backdrop-blur-xl animate-bounce flex items-center space-x-3.5"
        >
          <div className="relative">
            <img
              src={latestScanToast.student.avatar}
              alt={latestScanToast.student.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-400 shrink-0"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Live Scan Recorded
              </span>
              <span className="text-[10px] font-mono text-slate-400">{latestScanToast.timestamp}</span>
            </div>
            <h4 className="text-sm font-bold text-white truncate mt-0.5">
              {latestScanToast.student.name}
            </h4>
            <p className="text-xs text-slate-300 font-mono">
              Roll No: <span className="text-emerald-400 font-bold">{latestScanToast.student.rollNo}</span> · {latestScanToast.student.verificationMethod || 'Verified'}
            </p>
          </div>
          <button
            onClick={() => setLatestScanToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header: Class Details, Time Elapsed, and End Session */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Class Details */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {session.subjectCode}
            </span>
            <h1 className="text-xl sm:text-2xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">
              {session.subjectName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-900 bg-slate-100 px-3 py-0.5 rounded-full">
              Branch: {session.className}
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-50 text-slate-800 px-3 py-0.5 rounded-full font-medium border border-slate-200/80">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>Timings:</span>
              <span className="font-bold text-slate-900">
                {session.timeSlot ? session.timeSlot : `Start: ${session.startedAt || '10:00 AM'} → Finish: Active`}
              </span>
            </div>
            <div className="flex items-center space-x-1 font-medium text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{session.room}</span>
            </div>
            <span className="text-slate-600 font-medium">Faculty: {session.teacherName}</span>
          </div>
        </div>

        {/* Time Elapsed, Tablet Mode & End Session Button */}
        <div className="flex items-center space-x-3 shrink-0 flex-wrap gap-2">
          {/* Time Elapsed */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Time Elapsed
            </span>
            <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>

          {/* Classroom / Tablet Mode Button */}
          {onEnterTabletMode && (
            <button
              id="enter-tablet-mode-btn"
              onClick={onEnterTabletMode}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Tablet className="w-4 h-4 text-indigo-400" />
              <span>Classroom / Tablet Mode</span>
            </button>
          )}

          {/* End Session Button */}
          <button
            onClick={onEndSession}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-full font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <StopCircle className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* 2. Main Live Layout: Dynamic QR (Left) and Lists of Attendees, Flagged, Absent (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (lg:col-span-5): Dynamic QR Code & Live Activity Stream */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-slate-700" />
                <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Dynamic Rotating QR</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                Rotates in {qrSeconds}s
              </span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
                <img
                  src={session.qrCodeUrl}
                  alt="Dynamic Attendance QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
                />
              </div>

              {/* Rotation Countdown Bar */}
              <div className="w-full max-w-xs mt-5 space-y-1.5">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${qrProgressPercent}%` }}
                    className="h-full bg-slate-950 transition-all duration-1000 ease-linear rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Auto-refreshes every 15s</span>
                  <span className="font-mono font-bold text-slate-800">{qrSeconds}s remaining</span>
                </div>
              </div>
            </div>

            {/* Test / Simulation Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Simulation Controls
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onSimulateScan(false)}
                  className="py-2.5 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200/80 rounded-full font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simulate Student Scan</span>
                </button>
                <button
                  onClick={() => onSimulateScan(true)}
                  className="py-2.5 px-3 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200/80 rounded-full font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulate Proxy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Live Arrivals Feed Widget */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Live Scanned Stream</h4>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                {presentStudents.length} Verified
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {presentStudents.slice(0, 5).map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{st.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Roll: {st.rollNo}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {st.markedAt || 'Just now'}
                    </span>
                  </div>
                </div>
              ))}

              {presentStudents.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Awaiting student scans... Dynamic QR is broadcasting.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-7): Student Lists (Attendees, Flagged, Absent) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Student Attendance Roster</h3>
                <p className="text-xs text-slate-500">Live roster updates instantly as students scan</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-900 font-mono font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  {presentStudents.length} / {session.students.length} Present ({Math.round((presentStudents.length / (session.students.length || 1)) * 100)}%)
                </span>
              </div>
            </div>

            {/* Filter Tabs: Attendees (Present), Flagged, Absent */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200/60">
              <button
                onClick={() => setActiveListTab('attendees')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeListTab === 'attendees'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attendees ({presentStudents.length})</span>
              </button>

              <button
                onClick={() => setActiveListTab('flagged')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeListTab === 'flagged'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Flagged ({flaggedStudents.length})</span>
              </button>

              <button
                onClick={() => setActiveListTab('absent')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeListTab === 'absent'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>Absent ({absentStudents.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeListTab} by name or roll number...`}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Student List Container */}
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredStudents.map((student, idx) => (
              <div
                key={student.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  student.status === 'present' && idx === 0
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200/60'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    {student.status === 'present' && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-white text-[8px]">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {student.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {student.rollNo}
                      </span>
                    </div>

                    {student.status === 'present' && (
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                        <span className="font-bold">Marked at {student.markedAt || 'Just now'}</span>
                        <span>·</span>
                        <span className="text-slate-500">{student.verificationMethod || 'BLE & QR Verified'}</span>
                      </p>
                    )}

                    {student.status === 'flagged' && (
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        {student.flagReason || 'Proximity / Token discrepancy'}
                      </p>
                    )}

                    {student.status === 'absent' && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Not checked in yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Status Badge & Manual Actions */}
                <div className="shrink-0 flex items-center space-x-2">
                  {student.status === 'present' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Present
                    </span>
                  )}

                  {student.status === 'flagged' && onOverrideStatus && (
                    <button
                      onClick={() => onOverrideStatus(student.id, 'present')}
                      className="px-3.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-full text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  )}

                  {student.status === 'absent' && onOverrideStatus && (
                    <button
                      onClick={() => onOverrideStatus(student.id, 'present')}
                      className="px-3.5 py-1 bg-slate-200 hover:bg-slate-950 hover:text-white text-slate-700 rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Mark Present
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No students found in {activeListTab} list.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
