import React, { useState, useMemo } from 'react';
import { Teacher, TimetableSlot, DailyAttendanceStat, LowAttendanceStudent } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Play,
  Users,
  TrendingUp,
  AlertTriangle,
  Send,
  Search,
  Filter,
  ShieldAlert,
  Phone,
  Mail,
  Check,
  Flame,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  teacher: Teacher;
  timetable: TimetableSlot[];
  dailyAttendance?: DailyAttendanceStat[];
  lowAttendanceStudents?: LowAttendanceStudent[];
  onStartSession: (classId: string, subjectId: string, room: string, metadata?: any) => void;
  onGoToClasses: () => void;
}

const defaultDailyStats: DailyAttendanceStat[] = [
  { day: 'Mon', date: 'Aug 17', percentage: 92, totalPresent: 147, totalEnrolled: 160 },
  { day: 'Tue', date: 'Aug 18', percentage: 88, totalPresent: 141, totalEnrolled: 160 },
  { day: 'Wed', date: 'Aug 19', percentage: 95, totalPresent: 152, totalEnrolled: 160 },
  { day: 'Thu', date: 'Aug 20', percentage: 89, totalPresent: 142, totalEnrolled: 160 },
  { day: 'Fri', date: 'Aug 21 (Today)', percentage: 94, totalPresent: 150, totalEnrolled: 160 },
];

const defaultLowAttendanceStudents: LowAttendanceStudent[] = [
  {
    id: 'stud-101',
    name: 'Aarav Patel',
    rollNo: 'CS2023-014',
    rollNumber: 'CS2023-014',
    branch: 'Computer Science & Engineering',
    section: 'A',
    semester: 4,
    overallAttendance: 52,
    totalClasses: 25,
    attendedClasses: 13,
    parentEmail: 'suresh.patel@example.com',
    parentPhone: '+91 98201 54321',
    lastAttended: '2026-08-14',
  },
  {
    id: 'stud-102',
    name: 'Devika Nair',
    rollNo: 'CS2023-038',
    rollNumber: 'CS2023-038',
    branch: 'Computer Science & Engineering',
    section: 'B',
    semester: 4,
    overallAttendance: 58,
    totalClasses: 24,
    attendedClasses: 14,
    parentEmail: 'radhika.nair@example.com',
    parentPhone: '+91 98450 67890',
    lastAttended: '2026-08-15',
  },
  {
    id: 'stud-103',
    name: 'Rohan Deshmukh',
    rollNo: 'IT2023-019',
    rollNumber: 'IT2023-019',
    branch: 'Information Technology',
    section: 'A',
    semester: 4,
    overallAttendance: 64,
    totalClasses: 25,
    attendedClasses: 16,
    parentEmail: 'vijay.deshmukh@example.com',
    parentPhone: '+91 97654 32109',
    lastAttended: '2026-08-16',
  },
  {
    id: 'stud-104',
    name: 'Simran Kaur',
    rollNo: 'AIDS2023-007',
    rollNumber: 'AIDS2023-007',
    branch: 'Artificial Intelligence & Data Science',
    section: 'A',
    semester: 4,
    overallAttendance: 68,
    totalClasses: 22,
    attendedClasses: 15,
    parentEmail: 'harpreet.kaur@example.com',
    parentPhone: '+91 98112 34567',
    lastAttended: '2026-08-18',
  },
  {
    id: 'stud-105',
    name: 'Kunal Verma',
    rollNo: 'CS2023-082',
    rollNumber: 'CS2023-082',
    branch: 'Computer Science & Engineering',
    section: 'B',
    semester: 4,
    overallAttendance: 71,
    totalClasses: 25,
    attendedClasses: 17,
    parentEmail: 'manoj.verma@example.com',
    parentPhone: '+91 98990 12345',
    lastAttended: '2026-08-19',
  },
];

// Helper to convert time string like "09:00 AM" or "02:00 PM" into minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export const Dashboard: React.FC<DashboardProps> = ({
  teacher,
  timetable,
  dailyAttendance = defaultDailyStats,
  lowAttendanceStudents = defaultLowAttendanceStudents,
  onStartSession,
  onGoToClasses,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DailyAttendanceStat | null>(null);

  // Time Sorting & Filtering State
  const [sortOrder, setSortOrder] = useState<'chronological' | 'reverse' | 'status'>('chronological');

  // Low Attendance Filter & Search State
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'critical' | 'severe'>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [dispatchedNotices, setDispatchedNotices] = useState<Record<string, string>>({});
  const [isNotifyingAll, setIsNotifyingAll] = useState(false);
  const [batchNoticeSent, setBatchNoticeSent] = useState(false);

  // Current system minutes for time positioning
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Process and Sort Today's Lectures by Time of Classes
  const sortedLectures = useMemo(() => {
    const todaySlots = timetable.filter((t) => t.isToday !== false);

    return [...todaySlots].sort((a, b) => {
      const startA = parseTimeToMinutes(a.startTime);
      const startB = parseTimeToMinutes(b.startTime);

      if (sortOrder === 'chronological') {
        return startA - startB;
      } else if (sortOrder === 'reverse') {
        return startB - startA;
      } else {
        // Status sort: Live / Next first, then uncompleted, then completed
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return startA - startB;
      }
    });
  }, [timetable, sortOrder]);

  // Helper for lecture status based on time
  const getLectureTimeStatus = (slot: TimetableSlot) => {
    if (slot.isCompleted) {
      return { label: 'Completed', color: 'bg-slate-100 text-slate-700 border-slate-200', type: 'completed' };
    }

    const startMin = parseTimeToMinutes(slot.startTime);
    const endMin = parseTimeToMinutes(slot.endTime);

    // Live if within slot or marked
    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      return { label: 'Live Now', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse', type: 'live' };
    }

    if (startMin > currentMinutes && startMin - currentMinutes <= 60) {
      return {
        label: `Starts in ${startMin - currentMinutes}m`,
        color: 'bg-amber-50 text-amber-800 border-amber-200',
        type: 'soon',
      };
    }

    if (startMin > currentMinutes) {
      return { label: 'Upcoming', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', type: 'upcoming' };
    }

    return { label: 'Scheduled', color: 'bg-slate-100 text-slate-700 border-slate-200', type: 'scheduled' };
  };

  // 2. Filter Low Attendance Students
  const filteredStudents = useMemo(() => {
    return lowAttendanceStudents.filter((student) => {
      // Threshold filter
      if (attendanceFilter === 'severe' && student.overallAttendance >= 60) return false;
      if (attendanceFilter === 'critical' && student.overallAttendance >= 70) return false;

      // Search filter
      if (studentSearch.trim()) {
        const query = studentSearch.toLowerCase();
        const matchName = student.name.toLowerCase().includes(query);
        const roll = (student.rollNo || student.rollNumber || '').toLowerCase();
        const matchRoll = roll.includes(query);
        const matchBranch = (student.branch || '').toLowerCase().includes(query);
        if (!matchName && !matchRoll && !matchBranch) return false;
      }
      return true;
    });
  }, [lowAttendanceStudents, attendanceFilter, studentSearch]);

  // Handle single student warning notification
  const handleSendWarning = async (student: LowAttendanceStudent) => {
    try {
      const { ok, data } = await safeFetchJson('/api/students/send-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          message: `Official Attendance Warning: Your current attendance is ${student.overallAttendance}%. Minimum requirement is 75%.`,
          type: 'sms_email',
        }),
      });
      setDispatchedNotices((prev) => ({
        ...prev,
        [student.id]: (ok && data?.sentAt) || 'Sent Just Now',
      }));
    } catch (err) {
      setDispatchedNotices((prev) => ({
        ...prev,
        [student.id]: 'Sent Just Now',
      }));
    }
  };

  // Handle batch notify all
  const handleNotifyAllCritical = async () => {
    setIsNotifyingAll(true);
    try {
      for (const student of filteredStudents) {
        await safeFetchJson('/api/students/send-warning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            message: `Official Attendance Warning: Attendance at ${student.overallAttendance}%.`,
          }),
        });
        setDispatchedNotices((prev) => ({
          ...prev,
          [student.id]: 'Dispatched',
        }));
      }
      setBatchNoticeSent(true);
      setTimeout(() => setBatchNoticeSent(false), 4000);
    } catch (err) {
      console.error('Batch notice error:', err);
    } finally {
      setIsNotifyingAll(false);
    }
  };

  // Calculate average attendance for mini graph
  const avgAttendance = Math.round(
    dailyAttendance.reduce((acc, curr) => acc + curr.percentage, 0) / (dailyAttendance.length || 1)
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* 1. Teacher Name & Welcome Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5">
          <img
            src={teacher.avatar}
            alt={teacher.name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0 self-start sm:self-auto"
          />
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h1 className="text-xl sm:text-3xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">
                {teacher.name}
              </h1>
              <span className="px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[10px] sm:text-xs font-mono font-bold">
                {teacher.facultyCode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {teacher.designation}
            </p>

            {/* Branch and Timings (Start & Finish) */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:pt-1 text-[11px] sm:text-xs">
              <div className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-slate-700 font-medium">
                <span className="font-bold text-slate-900">Branch:</span>
                <span className="truncate max-w-[180px] sm:max-w-none">{teacher.branch || teacher.department || 'Computer Science & Engineering (CSE)'}</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 bg-indigo-50/60 border border-indigo-100 rounded-full text-indigo-950">
                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-900">Timings:</span>
                <span className="font-semibold">
                  <span className="font-bold text-indigo-700">{teacher.timings?.start || teacher.shiftStart || '09:00 AM'}</span>
                </span>
                <span className="text-indigo-300">→</span>
                <span className="font-semibold">
                  <span className="font-bold text-indigo-700">{teacher.timings?.finish || teacher.shiftFinish || '05:00 PM'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onGoToClasses}
          className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white rounded-full font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch Live Session</span>
        </button>
      </div>

      {/* 2. Main Grid: Today's Lectures (Time-Positioned) & Mini Attendance Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        {/* Left Column (lg:col-span-7): Today's Lectures with Time-Based Ordering & Position */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <div>
              <h2 className="text-base sm:text-lg font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Today's Lectures & Timetable</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Classes positioned chronologically by scheduled start & finish times
              </p>
            </div>

            {/* Time Sort Toggle */}
            <div className="flex items-center space-x-1.5 self-start sm:self-auto">
              <button
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === 'chronological' ? 'status' : prev === 'status' ? 'reverse' : 'chronological'
                  )
                }
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-full text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Toggle Time Sorting"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                <span>
                  {sortOrder === 'chronological'
                    ? 'Time (09:00 AM →)'
                    : sortOrder === 'status'
                    ? 'Active First'
                    : 'Time (Reverse)'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sortedLectures.map((lecture, index) => {
              const isDone = lecture.isCompleted;
              const count = lecture.attendanceCount;
              const timeStatus = getLectureTimeStatus(lecture);

              return (
                <div
                  key={lecture.id}
                  className={`rounded-xl sm:rounded-2xl border transition-all p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden ${
                    timeStatus.type === 'live'
                      ? 'bg-white border-rose-300 shadow-md ring-2 ring-rose-100'
                      : isDone
                      ? 'bg-white border-slate-200/80 shadow-2xs opacity-95'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Visual Left Accent Line for Position */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      timeStatus.type === 'live'
                        ? 'bg-rose-500'
                        : isDone
                        ? 'bg-emerald-500'
                        : 'bg-slate-900'
                    }`}
                  />

                  {/* Left info: Subject, Branch/Class, Timings (Start & Finish), Room */}
                  <div className="space-y-1.5 sm:space-y-2 pl-1 sm:pl-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {lecture.subjectCode}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{lecture.subjectName}</h3>

                      {/* Time Position Status Badge */}
                      <span
                        className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${timeStatus.color}`}
                      >
                        {timeStatus.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {lecture.className}
                      </span>
                      <div className="flex items-center space-x-1 sm:space-x-1.5 bg-indigo-50/70 text-indigo-900 px-2 py-0.5 rounded-md font-medium border border-indigo-100/60">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500" />
                        <span>{lecture.startTime} → {lecture.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                        <span>{lecture.room}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: If done -> attendance count block beside it. If not done -> start session button */}
                  <div className="shrink-0 flex items-center pl-1 sm:pl-0 pt-1 sm:pt-0">
                    {isDone ? (
                      /* Block beside completed lecture for Attendance Count */
                      <div className="w-full sm:w-auto bg-emerald-50/80 border border-emerald-200/90 rounded-xl sm:rounded-2xl p-2.5 sm:px-4 sm:py-2.5 flex items-center space-x-2.5 sm:space-x-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-emerald-900 font-mono">
                              {count ? `${count.present} / ${count.total}` : 'Completed'}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700">
                              ({count ? `${count.percentage}%` : 'Done'})
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">
                            Attendance Count
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Start Lecture Session Button */
                      <button
                        onClick={() =>
                          onStartSession(lecture.classId, lecture.subjectId, lecture.room, {
                            className: lecture.className,
                            subjectName: lecture.subjectName,
                            subjectCode: lecture.subjectCode,
                            timeSlot: `${lecture.startTime} - ${lecture.endTime}`,
                            branch: lecture.branch,
                            semester: lecture.semester,
                            section: lecture.division,
                          })
                        }
                        className={`w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                          timeStatus.type === 'live'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-slate-950 hover:bg-slate-900 text-white'
                        }`}
                      >
                        <Play className={`w-3.5 h-3.5 ${timeStatus.type === 'live' ? 'fill-white' : 'fill-white'}`} />
                        <span>{timeStatus.type === 'live' ? 'Launch Live' : 'Start Session'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedLectures.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No lectures scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (lg:col-span-5): Mini Graph of Attendance Throughout Days */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-lg font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Attendance Trends</h2>
              <p className="text-xs text-slate-500">5-day campus attendance rate</p>
            </div>
            <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{avgAttendance}% Avg</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
            {/* Interactive Mini Graph */}
            <div className="space-y-2">
              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                {dailyAttendance.map((stat, idx) => {
                  const isHovered = hoveredDay?.day === stat.day;
                  const isToday = stat.day.includes('Fri') || stat.date.includes('Today');

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDay(stat)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      {/* Bar Value Indicator */}
                      <span
                        className={`text-[10px] font-mono font-bold mb-1 transition-all ${
                          isHovered || isToday ? 'text-slate-950 scale-110 font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        {stat.percentage}%
                      </span>

                      {/* Bar Container */}
                      <div className="w-full max-w-[40px] bg-slate-100 rounded-xl overflow-hidden h-32 flex items-end p-1">
                        <div
                          style={{ height: `${stat.percentage}%` }}
                          className={`w-full rounded-lg transition-all duration-500 ${
                            isToday
                              ? 'bg-slate-950 shadow-xs'
                              : isHovered
                              ? 'bg-slate-800'
                              : 'bg-slate-400/80'
                          }`}
                        />
                      </div>

                      {/* Day Label */}
                      <span
                        className={`text-xs font-semibold mt-2 transition-colors ${
                          isToday ? 'text-slate-950 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {stat.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hover details / active stat summary */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {hoveredDay ? hoveredDay.date : 'Hover over a day for counts'}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {hoveredDay
                  ? `${hoveredDay.totalPresent} / ${hoveredDay.totalEnrolled} Students (${hoveredDay.percentage}%)`
                  : `Past Week Average: ${avgAttendance}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Low Attendance Alert & Student Roster */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h2 className="text-base sm:text-xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">
                Students with Low Attendance (&lt;75%)
              </h2>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] sm:text-xs font-bold border border-rose-100 shrink-0">
                {filteredStudents.length} At Risk
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 pl-9 sm:pl-10.5">
              Students falling below the mandatory 75% attendance criteria.
            </p>
          </div>

          {/* Action and Search Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student or roll no..."
                className="h-9 sm:h-10 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200/90 rounded-full font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white w-full sm:w-56"
              />
            </div>

            {/* Threshold Filter */}
            <div className="flex items-center p-1 bg-slate-100 rounded-full text-xs font-bold overflow-x-auto no-scrollbar">
              <button
                onClick={() => setAttendanceFilter('all')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  attendanceFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All (&lt;75%)
              </button>
              <button
                onClick={() => setAttendanceFilter('critical')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  attendanceFilter === 'critical' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                &lt;70%
              </button>
              <button
                onClick={() => setAttendanceFilter('severe')}
                className={`px-2.5 sm:px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                  attendanceFilter === 'severe' ? 'bg-white text-rose-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                &lt;60%
              </button>
            </div>

            {/* Batch Notify Button */}
            <button
              onClick={handleNotifyAllCritical}
              disabled={isNotifyingAll || filteredStudents.length === 0}
              className="px-3 sm:px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isNotifyingAll ? 'Dispatching...' : batchNoticeSent ? 'Dispatched!' : 'Notify Parents'}</span>
            </button>
          </div>
        </div>

        {/* Low Attendance Roster Table */}
        <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/90 text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3 px-3 sm:px-4 rounded-l-xl">Student & Roll No</th>
                <th className="py-3 px-3 sm:px-4">Branch & Division</th>
                <th className="py-3 px-3 sm:px-4">Attendance Rate</th>
                <th className="py-3 px-3 sm:px-4">Attended / Total</th>
                <th className="py-3 px-3 sm:px-4">Parent Contact</th>
                <th className="py-3 px-3 sm:px-4 text-right rounded-r-xl">Dispatch Warning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.map((student) => {
                const isCritical = student.overallAttendance < 60;
                const isDispatched = dispatchedNotices[student.id];

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Name & Roll */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{student.rollNo || student.rollNumber}</div>
                        </div>
                      </div>
                    </td>

                    {/* Branch & Division */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{student.branch}</div>
                      <div className="text-[11px] text-slate-500">
                        Div {student.section} · Sem {student.semester}
                      </div>
                    </td>

                    {/* Attendance Percentage with Visual Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 w-36">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-extrabold text-xs ${
                              isCritical ? 'text-rose-700' : 'text-amber-700'
                            }`}
                          >
                            {student.overallAttendance}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Req: 75%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${student.overallAttendance}%` }}
                            className={`h-full rounded-full ${
                              isCritical ? 'bg-rose-600' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Attended / Total Classes */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">
                        {student.attendedClasses} / {student.totalClasses}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Missed: {student.totalClasses - student.attendedClasses} sessions
                      </div>
                    </td>

                    {/* Parent Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        {student.parentPhone && (
                          <div className="flex items-center space-x-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{student.parentPhone}</span>
                          </div>
                        )}
                        {student.parentEmail && (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{student.parentEmail}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      {isDispatched ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sent ({isDispatched})</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendWarning(student)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-full text-xs font-bold transition-all border border-rose-200 hover:border-transparent cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Notice</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No students found matching the selected low attendance criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
