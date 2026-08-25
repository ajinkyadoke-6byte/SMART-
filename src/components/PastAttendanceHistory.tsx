import React, { useState, useMemo } from 'react';
import { AttendanceSession, Student } from '../types';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Download,
  Eye,
  FileSpreadsheet,
  ChevronRight,
  User,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

interface PastLectureRecord {
  id: string;
  sessionId?: string;
  sessionCode: string;
  className: string;
  classId?: string;
  subjectName: string;
  subjectCode: string;
  subjectId?: string;
  room: string;
  date: string;
  timeSlot: string;
  teacherName: string;
  stats: {
    total: number;
    present: number;
    flagged: number;
    absent: number;
    attendanceRate: number;
  };
  students: Student[];
}

interface PastAttendanceHistoryProps {
  pastSessions: AttendanceSession[];
  onOpenSessionReview?: (session: AttendanceSession) => void;
}

export const PastAttendanceHistory: React.FC<PastAttendanceHistoryProps> = ({
  pastSessions,
  onOpenSessionReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedLecture, setSelectedLecture] = useState<AttendanceSession | null>(
    pastSessions.length > 0 ? pastSessions[0] : null
  );
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'present' | 'flagged' | 'absent'>('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Extract unique subjects, classes, dates for filters
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    pastSessions.forEach((s) => s.subjectName && subs.add(s.subjectName));
    return Array.from(subs);
  }, [pastSessions]);

  const uniqueClasses = useMemo(() => {
    const cls = new Set<string>();
    pastSessions.forEach((s) => s.className && cls.add(s.className));
    return Array.from(cls);
  }, [pastSessions]);

  const filteredLectures = useMemo(() => {
    return pastSessions.filter((s) => {
      if (selectedSubjectFilter !== 'all' && s.subjectName !== selectedSubjectFilter) {
        return false;
      }
      if (selectedClassFilter !== 'all' && s.className !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = s.subjectName.toLowerCase().includes(q);
        const matchCode = (s.subjectCode || '').toLowerCase().includes(q);
        const matchClass = s.className.toLowerCase().includes(q);
        const matchRoom = (s.room || '').toLowerCase().includes(q);
        if (!matchSubject && !matchCode && !matchClass && !matchRoom) return false;
      }
      return true;
    });
  }, [pastSessions, selectedSubjectFilter, selectedClassFilter, searchQuery]);

  // Keep selected lecture synchronized if current selection is not in filtered list
  const activeLecture = selectedLecture || (filteredLectures.length > 0 ? filteredLectures[0] : null);

  // Filter students within the active lecture detail view
  const activeStudents = useMemo(() => {
    if (!activeLecture || !activeLecture.students) return [];
    return activeLecture.students.filter((st) => {
      if (studentStatusFilter !== 'all' && st.status !== studentStatusFilter) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchRoll = (st.rollNo || '').toLowerCase().includes(q);
        const matchEmail = (st.email || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchEmail) return false;
      }
      return true;
    });
  }, [activeLecture, studentStatusFilter, studentSearch]);

  // Export lecture attendance to CSV
  const handleExportCsv = (sessionToExport: AttendanceSession) => {
    try {
      const todayDate = sessionToExport.date || new Date().toISOString().split('T')[0];
      const filename = `Attendance_${sessionToExport.subjectCode || 'LECTURE'}_${sessionToExport.className.replace(/\s+/g, '_')}_${todayDate}.csv`;

      const headers = [
        'Roll Number',
        'Student Name',
        'Email',
        'Class',
        'Subject Code',
        'Subject Name',
        'Room',
        'Date',
        'Time Slot',
        'Status',
        'Marked Time',
        'Verification Method',
        'Edit Reason / Note',
      ];

      const rows = (sessionToExport.students || []).map((s) => [
        `"${s.rollNo || ''}"`,
        `"${s.name || ''}"`,
        `"${s.email || ''}"`,
        `"${sessionToExport.className || ''}"`,
        `"${sessionToExport.subjectCode || ''}"`,
        `"${sessionToExport.subjectName || ''}"`,
        `"${sessionToExport.room || ''}"`,
        `"${todayDate}"`,
        `"${sessionToExport.timeSlot || ''}"`,
        `"${(s.status || 'absent').toUpperCase()}"`,
        `"${s.markedAt || 'N/A'}"`,
        `"${s.verificationMethod || 'Auto Verified'}"`,
        `"${(s.editReason || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header & Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-700">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Playfair_Display',Georgia,serif]">
                Past Lectures & Attendance Logs
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl pl-0.5">
              Review comprehensive attendance sheets, student rosters, flagged checks, and download official CSV reports for completed lecture sessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700">
              Total Logged: <strong className="text-slate-950 font-bold">{pastSessions.length} Sessions</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, code, or class..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="all">All Subjects ({uniqueSubjects.length})</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="all">All Classes / Batches ({uniqueClasses.length})</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Left (Past Lecture List Cards) & Right (Selected Lecture Student Attendance Sheet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lecture Session Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Lecture History ({filteredLectures.length})
            </h3>
            <span className="text-xs text-slate-400">Click to view student list</span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredLectures.map((lecture) => {
              const isSelected = activeLecture?.id === lecture.id;
              const rate =
                lecture.stats?.attendanceRate !== undefined
                  ? lecture.stats.attendanceRate
                  : lecture.stats?.total
                  ? Math.round((lecture.stats.present / lecture.stats.total) * 100)
                  : 0;

              return (
                <div
                  key={lecture.id}
                  onClick={() => setSelectedLecture(lecture)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden text-left ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Left Accent Stripe */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isSelected ? 'bg-indigo-600' : 'bg-emerald-500'
                    }`}
                  />

                  <div className="space-y-2 pl-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {lecture.subjectCode || 'CS401'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {lecture.date || 'Aug 21, 2026'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {lecture.subjectName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {lecture.className}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center space-x-1 font-medium">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>{lecture.timeSlot}</span>
                      </div>
                      <div className="flex items-center space-x-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{lecture.room}</span>
                      </div>
                    </div>

                    {/* Attendance Percentage Badge & Mini Counter */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-extrabold text-emerald-950 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {lecture.stats?.present || 0} / {lecture.stats?.total || (lecture.students?.length || 0)} Present
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          {rate}% Rate
                        </span>
                      </div>

                      <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredLectures.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No past lecture sessions matched.</p>
                <p className="text-slate-400">Try clearing the search query or subject filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Attendance Sheet for Selected Lecture */}
        <div className="lg:col-span-7">
          {activeLecture ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
              {/* Lecture Summary Box */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold text-slate-200">
                        {activeLecture.subjectCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-slate-200">
                        {activeLecture.className}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-['Playfair_Display',Georgia,serif] text-white">
                      {activeLecture.subjectName}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleExportCsv(activeLecture)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                    <span className="font-semibold text-slate-200">{activeLecture.date || 'Aug 21, 2026'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Timings</span>
                    <span className="font-semibold text-slate-200">{activeLecture.timeSlot}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Room</span>
                    <span className="font-semibold text-slate-200">{activeLecture.room}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                    <span className="font-bold text-emerald-400">
                      {activeLecture.stats?.attendanceRate !== undefined
                        ? `${activeLecture.stats.attendanceRate}%`
                        : `${Math.round(((activeLecture.stats?.present || 0) / (activeLecture.stats?.total || 1)) * 100)}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roster Controls: Search & Status Filter Tabs */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Student Attendance Roster ({activeStudents.length} of {activeLecture.students?.length || 0})
                  </h4>

                  {/* Quick Filters */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setStudentStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        studentStatusFilter === 'all'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({activeLecture.students?.length || 0})
                    </button>
                    <button
                      onClick={() => setStudentStatusFilter('present')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        studentStatusFilter === 'present'
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      Present ({activeLecture.students?.filter((s) => s.status === 'present').length || 0})
                    </button>
                    <button
                      onClick={() => setStudentStatusFilter('flagged')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        studentStatusFilter === 'flagged'
                          ? 'bg-amber-600 text-white font-bold shadow-2xs'
                          : 'text-amber-700 hover:text-amber-900'
                      }`}
                    >
                      Flagged ({activeLecture.students?.filter((s) => s.status === 'flagged').length || 0})
                    </button>
                    <button
                      onClick={() => setStudentStatusFilter('absent')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        studentStatusFilter === 'absent'
                          ? 'bg-rose-600 text-white font-bold shadow-2xs'
                          : 'text-rose-700 hover:text-rose-900'
                      }`}
                    >
                      Absent ({activeLecture.students?.filter((s) => s.status === 'absent').length || 0})
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by name, roll number, or email..."
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Student Attendance List Table */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-[480px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Marked At</th>
                        <th className="py-3 px-4">Method / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeStudents.map((st) => {
                        const isPresent = st.status === 'present';
                        const isFlagged = st.status === 'flagged';
                        const isAbsent = st.status === 'absent';

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <img
                                  src={
                                    st.avatar ||
                                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop'
                                  }
                                  alt={st.name}
                                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{st.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                    {st.email || 'student@attendit.edu'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                              {st.rollNo}
                            </td>
                            <td className="py-3 px-4">
                              {isPresent && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Present
                                </span>
                              )}
                              {isFlagged && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Flagged
                                </span>
                              )}
                              {isAbsent && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <UserX className="w-3 h-3 text-rose-600" />
                                  Absent
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {st.markedAt || '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {st.editReason ? (
                                <span className="text-indigo-600 font-medium" title={st.editReason}>
                                  ✏️ {st.editReason}
                                </span>
                              ) : st.flagReason ? (
                                <span className="text-amber-700 font-medium" title={st.flagReason}>
                                  ⚠️ {st.flagReason}
                                </span>
                              ) : isPresent ? (
                                <span className="text-slate-600">{st.verificationMethod || 'Dynamic QR Scan'}</span>
                              ) : (
                                <span className="text-slate-400">Unrecorded</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {activeStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            No students match the selected status or search filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Quick Review Transition */}
              {onOpenSessionReview && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onOpenSessionReview(activeLecture)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open in Full Edit & Audit Mode</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Select a Lecture Session</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click on any lecture from the history column on the left to inspect full student attendance records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
