import React, { useState } from 'react';
import { AttendanceSession, Student, Teacher } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import {
  Download,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Clock,
  MapPin,
  Sparkles,
  ArrowLeft,
  Info,
  Calendar,
  Save,
} from 'lucide-react';

interface PostSessionAttendanceReviewProps {
  session: AttendanceSession;
  teacher: Teacher;
  onSaveAndClose: (updatedStudents: Student[]) => void;
  onGoToDashboard: () => void;
}

export const PostSessionAttendanceReview: React.FC<PostSessionAttendanceReviewProps> = ({
  session,
  teacher,
  onSaveAndClose,
  onGoToDashboard,
}) => {
  const [students, setStudents] = useState<Student[]>(session.students || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'flagged' | 'absent' | 'edited'>('all');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'flagged' | 'absent'>('present');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Common quick reasons for editing attendance
  const QUICK_REASONS = [
    'Medical certificate submitted & approved by HOD',
    'Student physically present; device BLE beacon out of range',
    'Official college event / on-duty sports representation',
    'Late classroom entry permitted by course instructor',
    'Network connectivity failure during dynamic QR scan',
    'Wrong student ID or token discrepancy manually verified',
  ];

  // Counts
  const presentCount = students.filter((s) => s.status === 'present').length;
  const flaggedCount = students.filter((s) => s.status === 'flagged').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const editedCount = students.filter((s) => !!s.editReason).length;
  const totalCount = students.length || 1;
  const attendanceRate = Math.round((presentCount / totalCount) * 100);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'present') return s.status === 'present';
    if (statusFilter === 'flagged') return s.status === 'flagged';
    if (statusFilter === 'absent') return s.status === 'absent';
    if (statusFilter === 'edited') return !!s.editReason;

    return true;
  });

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setNewStatus(student.status || 'present');
    setEditReason(student.editReason || '');
    setEditError(null);
  };

  const handleQuickMarkPresent = async (student: Student) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const editorName = teacher.name || 'Faculty Instructor';
    const reason = 'Manual attendance approval by faculty';

    const updated = students.map((s) => {
      if (s.id === student.id) {
        return {
          ...s,
          status: 'present' as const,
          markedAt: s.markedAt || timestamp,
          editReason: reason,
          editedAt: timestamp,
          editedBy: editorName,
          verificationMethod: `Manual Override (${editorName})`,
        };
      }
      return s;
    });

    setStudents(updated);
    setHasUnsavedChanges(true);

    try {
      await safeFetchJson('/api/session/edit-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          studentId: student.id,
          newStatus: 'present',
          editReason: reason,
          editedBy: editorName,
        }),
      });
    } catch (err) {
      console.error('Failed to sync edit-record:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    const finalReason = editReason.trim() || 'Manual attendance adjustment by faculty';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const editorName = teacher.name || 'Faculty Instructor';

    const updated = students.map((s) => {
      if (s.id === editingStudent.id) {
        return {
          ...s,
          status: newStatus,
          markedAt: newStatus === 'present' ? s.markedAt || timestamp : undefined,
          editReason: finalReason,
          editedAt: timestamp,
          editedBy: editorName,
          verificationMethod: `Manual Override (${editorName})`,
        };
      }
      return s;
    });

    setStudents(updated);
    setHasUnsavedChanges(true);
    setEditingStudent(null);

    try {
      await safeFetchJson('/api/session/edit-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          studentId: editingStudent.id,
          newStatus,
          editReason: finalReason,
          editedBy: editorName,
        }),
      });
    } catch (err) {
      console.error('Failed to sync edit-record:', err);
    }
  };

  // Export to CSV Function
  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const subjectCode = session.subjectCode || 'LECTURE';
      const filename = `Attendance_${subjectCode}_${session.className.replace(/\s+/g, '_')}_${todayDate}.csv`;

      // CSV Header
      const headers = [
        'Roll Number',
        'Student Name',
        'Email',
        'Class',
        'Subject Code',
        'Subject Name',
        'Room',
        'Date',
        'Status',
        'Marked Time',
        'Verification Method',
        'Edited Flag',
        'Edit Reason / Note',
        'Edited By',
        'Edited At',
      ];

      // CSV Rows
      const rows = students.map((s) => [
        `"${s.rollNo}"`,
        `"${s.name}"`,
        `"${s.email || ''}"`,
        `"${session.className}"`,
        `"${session.subjectCode || ''}"`,
        `"${session.subjectName}"`,
        `"${session.room}"`,
        `"${todayDate}"`,
        `"${(s.status || 'absent').toUpperCase()}"`,
        `"${s.markedAt || 'N/A'}"`,
        `"${s.verificationMethod || 'N/A'}"`,
        `"${s.editReason ? 'YES' : 'NO'}"`,
        `"${(s.editReason || '').replace(/"/g, '""')}"`,
        `"${s.editedBy || ''}"`,
        `"${s.editedAt || ''}"`,
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
      console.error('Error generating CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                {session.subjectCode || 'SESSION COMPLETED'}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full border border-emerald-200">
                Session Ended & Saved
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">
              {session.subjectName} — Post-Session Review
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="font-bold text-slate-900 bg-slate-100 px-3 py-0.5 rounded-full">
                Branch: {session.className}
              </span>
              <div className="flex items-center space-x-1.5 font-medium text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Slot: {session.timeSlot || 'Active Lecture'}</span>
              </div>
              <div className="flex items-center space-x-1.5 font-medium text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{session.room}</span>
              </div>
              <span className="text-slate-600 font-medium">Faculty: {teacher.name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-3 shrink-0">
            <button
              id="export-csv-btn"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-full font-bold text-xs shadow-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExporting ? 'Generating...' : 'Export.csv'}</span>
            </button>

            <button
              id="save-review-btn"
              onClick={() => onSaveAndClose(students)}
              className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-full font-bold text-xs shadow-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-indigo-400" />
              <span>{hasUnsavedChanges ? 'Save Edits & Finish' : 'Done & Return'}</span>
            </button>
          </div>
        </div>

        {/* 2. Key Session Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Overall Turnout
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-slate-900">{attendanceRate}%</span>
              <span className="text-xs text-slate-500 font-medium">({presentCount}/{totalCount})</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Verified Present
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-emerald-700">{presentCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Students</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Recorded Absent
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-rose-700">{absentCount}</span>
              <span className="text-xs text-rose-600 font-medium">Students</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
              Manual Overrides
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-indigo-700">{editedCount}</span>
              <span className="text-xs text-indigo-600 font-medium">Audited</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Attendance Table & Override Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-['Playfair_Display',serif] text-slate-900">
              Student Attendance Register & Audit Log
            </h2>
            <p className="text-xs text-slate-500">
              Review final records or edit any student attendance with an audit explanation note
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center flex-wrap gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200/80">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                statusFilter === 'present' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setStatusFilter('flagged')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                statusFilter === 'flagged' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flagged ({flaggedCount})
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                statusFilter === 'absent' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absent ({absentCount})
            </button>
            <button
              onClick={() => setStatusFilter('edited')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                statusFilter === 'edited' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Edited ({editedCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by name or roll number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Final Status</th>
                <th className="py-3 px-4">Verification & Check-in</th>
                <th className="py-3 px-4">Audit Trail / Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[10px] text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {student.rollNo}
                    </td>

                    <td className="py-3.5 px-4">
                      {student.status === 'present' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Present
                        </span>
                      ) : student.status === 'flagged' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <UserX className="w-3 h-3 mr-1" />
                          Absent
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {student.status === 'present' ? (
                        <div className="space-y-0.5">
                          <div className="text-slate-900 font-medium">Checked in at {student.markedAt || '10:05 AM'}</div>
                          <div className="text-[10px] text-slate-400">{student.verificationMethod || 'BLE & Dynamic QR'}</div>
                        </div>
                      ) : student.status === 'flagged' ? (
                        <div className="text-amber-700 font-medium text-[11px]">
                          {student.flagReason || 'Token / distance anomaly'}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Not marked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {student.editReason ? (
                        <div className="p-2 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-[11px] space-y-0.5 max-w-xs">
                          <div className="font-bold text-indigo-900 flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-indigo-600" />
                            <span>Modified by {student.editedBy || teacher.name}</span>
                          </div>
                          <p className="text-indigo-800 italic">"{student.editReason}"</p>
                          <div className="text-[10px] text-indigo-600">at {student.editedAt || 'Session end'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {student.status !== 'present' && (
                          <button
                            type="button"
                            onClick={() => handleQuickMarkPresent(student)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200/80 rounded-full font-bold text-[11px] transition cursor-pointer flex items-center space-x-1"
                            title="Quick mark present"
                          >
                            <Check className="w-3 h-3" />
                            <span>Make Present</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(student)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-950 hover:text-white text-slate-700 rounded-full font-bold text-xs transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No students matched the selected status and search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Edit Attendance with Audit Note Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Playfair_Display',serif]">
                    Edit Student Attendance
                  </h3>
                  <p className="text-[11px] text-slate-500">Provide official reason for compliance audit</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Student Header */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3">
              <img
                src={editingStudent.avatar}
                alt={editingStudent.name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div>
                <div className="font-bold text-xs text-slate-900">{editingStudent.name}</div>
                <div className="text-[11px] font-mono text-slate-500">
                  {editingStudent.rollNo} · {session.className}
                </div>
              </div>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">New Attendance Status</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus('present')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${
                    newStatus === 'present'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('flagged')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${
                    newStatus === 'flagged'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flagged</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('absent')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${
                    newStatus === 'absent'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Absent</span>
                </button>
              </div>
            </div>

            {/* Reason / Note Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Note / Reason (Optional)
                </label>
                <span className="text-[10px] text-slate-400">Recorded in audit log</span>
              </div>
              <textarea
                value={editReason}
                onChange={(e) => {
                  setEditReason(e.target.value);
                  setEditError(null);
                }}
                rows={2}
                placeholder="Optional reason (defaults to: Manual attendance adjustment by faculty)..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Quick Reason Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Reason Templates
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEditReason(reason);
                      setEditError(null);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-left transition cursor-pointer"
                  >
                    + {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-6 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Attendance Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
