import React, { useState, useEffect } from 'react';
import { AttendanceSession, Student } from '../types';
import {
  Maximize2,
  Minimize2,
  X,
  Radio,
  Clock,
  Users,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Search,
  Wifi,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Tv,
  Tablet,
} from 'lucide-react';

interface ClassroomTabletModeProps {
  session: AttendanceSession;
  onExit: () => void;
  onSimulateScan: (isFlagged?: boolean) => void;
  onManualMarkPresent: (studentId: string) => void;
}

export const ClassroomTabletMode: React.FC<ClassroomTabletModeProps> = ({
  session,
  onExit,
  onSimulateScan,
  onManualMarkPresent,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const [latestArrivalToast, setLatestArrivalToast] = useState<{
    name: string;
    rollNo: string;
    avatar: string;
    time: string;
  } | null>(null);

  const prevPresentRef = React.useRef(session.students.filter((s) => s.status === 'present').length);

  useEffect(() => {
    const presentList = session.students.filter((s) => s.status === 'present');
    if (presentList.length > prevPresentRef.current) {
      const sorted = [...presentList].sort((a, b) => {
        if (!a.markedAt) return 1;
        if (!b.markedAt) return -1;
        return b.markedAt.localeCompare(a.markedAt);
      });
      const newest = sorted[0];
      if (newest) {
        setLatestArrivalToast({
          name: newest.name,
          rollNo: newest.rollNo,
          avatar: newest.avatar,
          time: newest.markedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        const timer = setTimeout(() => setLatestArrivalToast(null), 5000);
        return () => clearTimeout(timer);
      }
    }
    prevPresentRef.current = presentList.length;
  }, [session.students]);

  const presentCount = session.students.filter((s) => s.status === 'present').length;
  const flaggedCount = session.students.filter((s) => s.status === 'flagged').length;
  const totalCount = session.students.length || 1;
  const attendanceRate = Math.round((presentCount / totalCount) * 100);

  const qrSeconds = session.qrExpiresIn ?? 15;
  const qrTotal = session.qrTotalDuration || 15;
  const qrProgressPercent = Math.max(0, Math.min(100, (qrSeconds / qrTotal) * 100));

  // Recent arrival feed (sorted by latest check-in)
  const recentArrivals = [...session.students]
    .filter((s) => s.status === 'present')
    .sort((a, b) => {
      if (!a.markedAt) return 1;
      if (!b.markedAt) return -1;
      return b.markedAt.localeCompare(a.markedAt);
    })
    .slice(0, 6);

  const absentStudents = session.students.filter((s) => s.status === 'absent');
  const filteredAbsent = absentStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(manualSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif] select-none overflow-hidden animate-fadeIn">
      {/* Top Tablet Header */}
      <header className="px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Tablet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                CLASSROOM PODIUM KIOSK
              </span>
              <span className="text-xs font-mono text-slate-400">
                {session.subjectCode} · {session.room}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight font-['Playfair_Display',serif]">
              {session.subjectName} — {session.className}
            </h1>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-full text-xs text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-bold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            id="tablet-manual-tap-btn"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden md:inline">Podium Manual Tap-In</span>
          </button>

          <button
            id="tablet-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition cursor-pointer border border-slate-700"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            id="tablet-exit-btn"
            onClick={onExit}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 rounded-full text-xs font-bold transition border border-slate-700 hover:border-rose-700/50 flex items-center space-x-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Exit Kiosk</span>
          </button>
        </div>
      </header>

      {/* Live Scan Notification Toast on Tablet Kiosk */}
      {latestArrivalToast && (
        <div className="absolute top-20 right-8 z-50 bg-slate-900/95 border-2 border-emerald-400 text-white px-5 py-3.5 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center space-x-3.5 animate-bounce">
          <div className="relative">
            <img
              src={latestArrivalToast.avatar}
              alt={latestArrivalToast.name}
              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-400 shrink-0"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                Attendance Recorded
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{latestArrivalToast.time}</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">{latestArrivalToast.name}</p>
            <p className="text-xs text-slate-300 font-mono">Roll: <span className="text-emerald-400 font-bold">{latestArrivalToast.rollNo}</span></p>
          </div>
        </div>
      )}

      {/* Main Kiosk Content Stage */}
      <div className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-y-auto">
        {/* Left Side: Large Prominent Dynamic Rotating QR Display (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 md:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl">
          {/* Ambient subtle glow background */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center space-x-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dynamic Scan Portal</h3>
                <p className="text-xs text-slate-400">Scan with your registered student device</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-full">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-indigo-300">
                Rotates in {qrSeconds}s
              </span>
            </div>
          </div>

          {/* Large High-Contrast White QR Box */}
          <div className="my-auto py-4 flex flex-col items-center z-10">
            <div className="relative p-5 sm:p-6 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/30">
              <img
                src={session.qrCodeUrl}
                alt="Classroom Dynamic Attendance QR"
                className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain rounded-2xl"
              />
            </div>

            {/* Countdown Progress Ring Bar */}
            <div className="w-72 sm:w-80 mt-5 space-y-1.5">
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
                <div
                  style={{ width: `${qrProgressPercent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Anti-Proxy Dynamic Token</span>
                </span>
                <span className="font-mono font-bold text-indigo-300">{qrSeconds}s remaining</span>
              </div>
            </div>
          </div>

          {/* Bottom Security / Sensor Badges */}
          <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 z-10 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus BLE Beacon Active</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onSimulateScan(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
              >
                + Quick Sim Scan
              </button>
              <button
                onClick={() => onSimulateScan(true)}
                className="px-3 py-1 bg-slate-800 hover:bg-amber-950/60 text-amber-300 rounded-full text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
              >
                + Sim Flag
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Metrics & Recent Check-In Ticker (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Present Counter */}
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Present</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
                  {presentCount}
                </span>
                <span className="text-sm font-semibold text-slate-500">/ {totalCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Turnout</span>
                <span className="font-bold text-white font-mono">{attendanceRate}%</span>
              </div>
            </div>

            {/* Flagged / Pending */}
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Pending / Absent</span>
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-rose-400">
                  {session.students.length - presentCount}
                </span>
                <span className="text-xs font-semibold text-slate-500">Students</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Flagged alerts</span>
                <span className="font-bold text-amber-400 font-mono">{flaggedCount}</span>
              </div>
            </div>
          </div>

          {/* Live Recent Arrivals Stream */}
          <div className="flex-1 bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Live Arrival Stream</h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {recentArrivals.length > 0 ? (
                  recentArrivals.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 bg-slate-800/70 border border-slate-700/70 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-800"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{student.rollNo}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                          {student.markedAt || 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                    <p>No check-ins recorded yet.</p>
                    <p className="text-[11px] text-slate-600">Students scanning the QR code will appear here instantly.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tap In Quick CTA inside right column */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>View Full Absent Roster / Manual Check-In</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Tap-In Modal for Podium Tablet */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 text-white space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold font-['Playfair_Display',serif] text-white">
                  Podium Manual Student Check-In
                </h3>
                <p className="text-xs text-slate-400">
                  Tap any absent student to manually mark them present on this podium tablet
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                placeholder="Search absent student by name or roll number..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* List of Absent Students */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px]">
              {filteredAbsent.length > 0 ? (
                filteredAbsent.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{student.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{student.rollNo}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onManualMarkPresent(student.id);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Present</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {absentStudents.length === 0
                    ? '100% Attendance! All students have checked in.'
                    : 'No absent students matched your search filter.'}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-bold transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
