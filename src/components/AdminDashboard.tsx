import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  Send,
  Building,
  CheckCircle,
  FileText,
  Clock,
  BookOpen,
  PieChart,
  BarChart3,
  Calendar,
  X,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Save,
  Check,
  RefreshCw,
} from 'lucide-react';
import { safeFetchJson } from '../utils/apiClient';
import { INITIAL_ADMIN_ANALYTICS } from '../data/initialData';
import { AdminAnalyticsData } from '../types';

interface TimetableSlotData {
  id: string;
  classId: string;
  className: string;
  branch?: string;
  semester?: number;
  division?: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName?: string;
  startTime: string;
  endTime: string;
  room: string;
  dayOfWeek: string;
  isToday?: boolean;
}

interface AdminDashboardProps {
  adminUser?: { name: string; title: string; email: string };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser = {
    name: 'Dr. Rajesh Iyer',
    title: 'Dean of Academic Affairs',
    email: 'rajesh.iyer@attendit.edu',
  },
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'timetable' | 'classes'>('analytics');
  const [analytics, setAnalytics] = useState<AdminAnalyticsData>(INITIAL_ADMIN_ANALYTICS);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [warningActionFeedback, setWarningActionFeedback] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Master Timetable State
  const [timetableList, setTimetableList] = useState<TimetableSlotData[]>([]);
  const [ttBranchFilter, setTtBranchFilter] = useState<string>('all');
  const [ttSemFilter, setTtSemFilter] = useState<string>('all');
  const [ttDivFilter, setTtDivFilter] = useState<string>('all');
  const [ttDayFilter, setTtDayFilter] = useState<string>('all');
  const [isTtModalOpen, setIsTtModalOpen] = useState<boolean>(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Form State for Adding/Editing Timetable Slot
  const [slotForm, setSlotForm] = useState({
    branch: 'Computer Science & Engineering',
    semester: 4,
    division: 'A',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CS401',
    teacherName: 'Prof. Anjali Sharma',
    room: 'Lab 302',
    dayOfWeek: 'Friday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
  });

  const fetchTimetable = async () => {
    try {
      const { ok, data } = await safeFetchJson('/api/timetable');
      if (ok && data?.timetable) {
        setTimetableList(data.timetable);
      }
    } catch (err) {
      console.error('Failed to load timetable', err);
    }
  };

  useEffect(() => {
    safeFetchJson('/api/admin/analytics').then(({ ok, data }) => {
      if (ok && data) {
        setAnalytics(data);
      }
    });
    fetchTimetable();
  }, []);

  const handleSendEarlyWarningAction = (studentName: string, action: string) => {
    setWarningActionFeedback(`Dispatched: ${action} to ${studentName} & academic mentor.`);
    setTimeout(() => setWarningActionFeedback(null), 4000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Timetable CRUD Handlers
  const handleOpenAddSlot = () => {
    setEditingSlotId(null);
    setSlotForm({
      branch: ttBranchFilter !== 'all' ? ttBranchFilter : 'Computer Science & Engineering',
      semester: ttSemFilter !== 'all' ? Number(ttSemFilter) : 4,
      division: ttDivFilter !== 'all' ? ttDivFilter : 'A',
      subjectName: 'Data Structures & Algorithms',
      subjectCode: 'CS401',
      teacherName: 'Prof. Anjali Sharma',
      room: 'Lab 302',
      dayOfWeek: ttDayFilter !== 'all' ? ttDayFilter : 'Friday',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
    });
    setIsTtModalOpen(true);
  };

  const handleOpenEditSlot = (slot: TimetableSlotData) => {
    setEditingSlotId(slot.id);
    setSlotForm({
      branch: slot.branch || 'Computer Science & Engineering',
      semester: slot.semester || 4,
      division: slot.division || 'A',
      subjectName: slot.subjectName,
      subjectCode: slot.subjectCode,
      teacherName: slot.teacherName || 'Prof. Faculty Member',
      room: slot.room,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setIsTtModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...slotForm,
        className: `${slotForm.branch.split(' ')[0]}-${slotForm.division} (Semester ${slotForm.semester})`,
        classId: `class-${slotForm.branch.toLowerCase().substring(0, 3)}-${slotForm.division.toLowerCase()}`,
        subjectId: `sub-${slotForm.subjectCode.toLowerCase()}`,
      };

      if (editingSlotId) {
        const { ok, data } = await safeFetchJson(`/api/timetable/${editingSlotId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (ok && data?.timetable) {
          setTimetableList(data.timetable);
        }
      } else {
        const { ok, data } = await safeFetchJson('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (ok && data?.timetable) {
          setTimetableList(data.timetable);
        }
      }

      setWarningActionFeedback(
        `Master Timetable synchronized successfully across all Faculty & Student views.`
      );
      setTimeout(() => setWarningActionFeedback(null), 4000);
      setIsTtModalOpen(false);
      fetchTimetable();
    } catch (err) {
      console.error('Failed to save slot', err);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot from the master schedule?')) return;
    try {
      const { ok, data } = await safeFetchJson(`/api/timetable/${slotId}`, {
        method: 'DELETE',
      });
      if (ok && data?.timetable) {
        setTimetableList(data.timetable);
      } else {
        setTimetableList((prev) => prev.filter((s) => s.id !== slotId));
      }
      setWarningActionFeedback('Slot removed and timetable updated across campus.');
      setTimeout(() => setWarningActionFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to delete slot', err);
    }
  };

  const filteredTimetable = timetableList.filter((slot) => {
    if (ttBranchFilter !== 'all') {
      const match =
        (slot.branch && slot.branch.toLowerCase().includes(ttBranchFilter.toLowerCase())) ||
        (slot.className && slot.className.toLowerCase().includes(ttBranchFilter.toLowerCase()));
      if (!match) return false;
    }
    if (ttSemFilter !== 'all') {
      const semNum = Number(ttSemFilter);
      if (slot.semester !== semNum && !slot.className.includes(`Semester ${semNum}`)) {
        return false;
      }
    }
    if (ttDivFilter !== 'all') {
      if (slot.division && slot.division.toUpperCase() !== ttDivFilter.toUpperCase()) {
        return false;
      }
    }
    if (ttDayFilter !== 'all') {
      if (slot.dayOfWeek && slot.dayOfWeek.toLowerCase() !== ttDayFilter.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  const filteredEarlyWarningStudents = analytics.earlyWarningStudents.filter((s) => {
    if (selectedBranchFilter === 'all') return true;
    return s.branch.toLowerCase().includes(selectedBranchFilter.toLowerCase());
  });

  return (
    <div
      id="admin-dashboard-root"
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[11px] sm:text-xs border border-indigo-100">
              Institutional Predictive Center
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">|</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">NEP-2020 Compliance Engine</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 font-['Playfair_Display',serif] tracking-tight">
            Academic Administration & Schedule Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Logged in as <strong className="text-slate-700">{adminUser.name}</strong> ({adminUser.title}). Full master timetable management, cohort synchronization, and dropout risk prevention.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Institutional Report</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-slate-100/80 rounded-2xl overflow-x-auto no-scrollbar max-w-full border border-slate-200/60">
        <button
          id="admin-tab-analytics"
          onClick={() => setActiveAdminTab('analytics')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
            activeAdminTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
          <span>Institutional Analytics & Risk</span>
        </button>

        <button
          id="admin-tab-timetable"
          onClick={() => setActiveAdminTab('timetable')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
            activeAdminTab === 'timetable'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          <span>Master Timetable Management</span>
        </button>
      </div>

      {/* Warning / Success Feedback Toast */}
      {warningActionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{warningActionFeedback}</span>
          </div>
          <button onClick={() => setWarningActionFeedback(null)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER TIMETABLE MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeAdminTab === 'timetable' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Bar with Filter & Add Slot CTA */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                  Master Class Schedule Controller
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Configure real schedules across branches, years/semesters, divisions, and subjects.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={fetchTimetable}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
                <button
                  id="admin-add-slot-btn"
                  onClick={handleOpenAddSlot}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Slot</span>
                </button>
              </div>
            </div>

            {/* Filter Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              {/* Branch Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 text-[11px] sm:text-xs">Branch</label>
                <select
                  value={ttBranchFilter}
                  onChange={(e) => setTtBranchFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="all">All Branches</option>
                  <option value="Computer Science">CSE</option>
                  <option value="Information Technology">IT</option>
                  <option value="Artificial Intelligence">AI&DS</option>
                  <option value="Electronics">ECE</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              {/* Semester / Year Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 text-[11px] sm:text-xs">Semester</label>
                <select
                  value={ttSemFilter}
                  onChange={(e) => setTtSemFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="all">All Semesters</option>
                  <option value="1">Sem 1</option>
                  <option value="2">Sem 2</option>
                  <option value="3">Sem 3</option>
                  <option value="4">Sem 4</option>
                  <option value="5">Sem 5</option>
                  <option value="6">Sem 6</option>
                  <option value="7">Sem 7</option>
                  <option value="8">Sem 8</option>
                </select>
              </div>

              {/* Division Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 text-[11px] sm:text-xs">Division</label>
                <select
                  value={ttDivFilter}
                  onChange={(e) => setTtDivFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="all">All Divisions</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                </select>
              </div>

              {/* Day Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 text-[11px] sm:text-xs">Day of Week</label>
                <select
                  value={ttDayFilter}
                  onChange={(e) => setTtDayFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="all">All Days (Mon-Sat)</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday (Today)</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timetable Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTimetable.map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold text-xs">
                      {slot.dayOfWeek}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {slot.room}
                    </span>
                  </div>

                  {/* Subject Name & Code */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-900 transition">
                    {slot.subjectName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-indigo-600 font-mono">
                      {slot.subjectCode}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">
                      {slot.className || `${slot.branch} Div ${slot.division}`}
                    </span>
                  </div>

                  {/* Faculty */}
                  <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Faculty: <strong className="text-slate-800">{slot.teacherName || 'Prof. Anjali Sharma'}</strong></span>
                  </div>

                  {/* Time */}
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.startTime} – {slot.endTime}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditSlot(slot)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="Edit Slot"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredTimetable.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Timetable Slots Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No slots match the current filter combination. Click "Add Timetable Slot" to create a new lecture period.
                </p>
                <button
                  onClick={handleOpenAddSlot}
                  className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create New Slot
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER TIMETABLE ADD/EDIT MODAL */}
      {/* ========================================================================= */}
      {isTtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                  {editingSlotId ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
                </h3>
              </div>
              <button
                onClick={() => setIsTtModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Branch */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Academic Branch</label>
                <select
                  value={slotForm.branch}
                  onChange={(e) => setSlotForm({ ...slotForm, branch: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Artificial Intelligence & Data Science">AI & Data Science (AI&DS)</option>
                  <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              {/* Semester & Division */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Semester / Year</label>
                  <select
                    value={slotForm.semester}
                    onChange={(e) => setSlotForm({ ...slotForm, semester: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
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

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Division / Section</label>
                  <select
                    value={slotForm.division}
                    onChange={(e) => setSlotForm({ ...slotForm, division: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                    <option value="D">Division D</option>
                  </select>
                </div>
              </div>

              {/* Subject Name & Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={slotForm.subjectName}
                    onChange={(e) => setSlotForm({ ...slotForm, subjectName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Operating Systems"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={slotForm.subjectCode}
                    onChange={(e) => setSlotForm({ ...slotForm, subjectCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="CS402"
                  />
                </div>
              </div>

              {/* Teacher & Venue Room */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Faculty In-Charge</label>
                  <input
                    type="text"
                    required
                    value={slotForm.teacherName}
                    onChange={(e) => setSlotForm({ ...slotForm, teacherName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="Prof. Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Classroom / Lab Room</label>
                  <input
                    type="text"
                    required
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Lab 302 / Room 204"
                  />
                </div>
              </div>

              {/* Day & Timings */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Day of Week</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Time</label>
                  <input
                    type="text"
                    required
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="09:00 AM"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Time</label>
                  <input
                    type="text"
                    required
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    placeholder="10:00 AM"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTtModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSlotId ? 'Save Changes' : 'Create Timetable Slot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSTITUTIONAL ANALYTICS & RISK TAB */}
      {/* ========================================================================= */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-5 sm:space-y-8 animate-fadeIn">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Total Students */}
            <div className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
                <span className="font-semibold uppercase tracking-wider">Total Enrolled</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                {analytics.kpis.totalStudents}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate">4 Departments</span>
              </div>
            </div>

            {/* Today's Campus Attendance */}
            <div className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
                <span className="font-semibold uppercase tracking-wider">Campus Attendance</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                {analytics.kpis.todayAttendancePercent}%
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="truncate">+{analytics.kpis.attendanceDeltaPercent}% vs last wk</span>
              </div>
            </div>

            {/* Free-Period Utilization */}
            <div className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
                <span className="font-semibold uppercase tracking-wider">Free-Period Usage</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Playfair_Display',serif]">
                {analytics.kpis.freePeriodUsagePercent}%
              </div>
              <div className="text-[10px] sm:text-[11px] text-indigo-600 font-medium truncate">
                NEP-2020 SEC/VAC
              </div>
            </div>

            {/* Students At-Risk */}
            <div className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
                <span className="font-semibold uppercase tracking-wider">At-Risk Alerts</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600 font-['Playfair_Display',serif]">
                {analytics.earlyWarningStudents.length} Students
              </div>
              <div className="text-[10px] sm:text-[11px] text-rose-500 font-medium truncate">
                Drop &gt; 15% detected
              </div>
            </div>
          </div>

          {/* Early Warning Detection Table */}
          <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Playfair_Display',serif]">
                  Predictive Early-Warning Table
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Identifies students with <strong className="text-rose-600">&gt;15% attendance drop</strong> between consecutive weeks.
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setSelectedBranchFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedBranchFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedBranchFilter('Computer')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedBranchFilter === 'Computer' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  CSE
                </button>
                <button
                  onClick={() => setSelectedBranchFilter('Information')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedBranchFilter === 'Information' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  IT
                </button>
                <button
                  onClick={() => setSelectedBranchFilter('Electronics')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedBranchFilter === 'Electronics' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  ECE
                </button>
              </div>
            </div>

            {/* Table with responsive horizontal scroll */}
            <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs text-slate-700 min-w-[620px]">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-l-xl">Student</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Branch & Sem</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Last Wk</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">This Wk</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Drop Delta</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Intervention</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-r-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEarlyWarningStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">{s.rollNo}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600">
                        <div>{s.branch}</div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400">Semester {s.semester}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-mono font-medium text-slate-600">
                        {s.attendanceLastWeek}%
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold text-slate-900">
                        {s.attendanceThisWeek}%
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                          {s.deltaPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-[11px] text-slate-600 max-w-xs">
                        {s.suggestedAction}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <button
                          onClick={() => handleSendEarlyWarningAction(s.name, s.suggestedAction)}
                          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                          title="Dispatch Intervention"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Trends & Department Breakdown Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Trend Chart */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                    Weekly Attendance Trajectory
                  </h3>
                  <p className="text-xs text-slate-500">Day-by-day attendance rates across Monday – Friday</p>
                </div>
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-3 h-48 items-end pt-8 pb-2 border-b border-slate-100">
                  {analytics.weeklyTrends.map((wt, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-700 opacity-80 group-hover:opacity-100 transition">
                        {wt.overall}%
                      </span>
                      <div className="w-full max-w-[40px] bg-indigo-50 rounded-t-xl overflow-hidden h-full flex items-end">
                        <div
                          className="w-full bg-indigo-600 group-hover:bg-indigo-700 transition-all rounded-t-xl"
                          style={{ height: `${(wt.overall - 60) * 2.5}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 truncate max-w-[65px]">
                        {wt.day}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                    <span>Campus Average</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Target Baseline (85%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Free Period Usage Distribution */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                    Free-Period Activity Allocation
                  </h3>
                  <p className="text-xs text-slate-500">How students utilize gaps between scheduled lectures</p>
                </div>
                <PieChart className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <div className="text-xs font-semibold text-indigo-900">Skill Development (SEC)</div>
                  <div className="text-2xl font-bold text-indigo-700 font-['Playfair_Display',serif]">
                    {analytics.freePeriodUsage.skillDevelopment}%
                  </div>
                  <p className="text-[11px] text-indigo-600">Coding labs & algorithm visualizers</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <div className="text-xs font-semibold text-emerald-900">Curriculum Revision</div>
                  <div className="text-2xl font-bold text-emerald-700 font-['Playfair_Display',serif]">
                    {analytics.freePeriodUsage.revision}%
                  </div>
                  <p className="text-[11px] text-emerald-600">Subject sprints & quick drills</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                  <div className="text-xs font-semibold text-amber-900">Project / Sandbox</div>
                  <div className="text-2xl font-bold text-amber-700 font-['Playfair_Display',serif]">
                    {analytics.freePeriodUsage.projectLabs}%
                  </div>
                  <p className="text-[11px] text-amber-600">Group labs & query testing</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="text-xs font-semibold text-slate-700">Idle / Off-Campus</div>
                  <div className="text-2xl font-bold text-slate-500 font-['Playfair_Display',serif]">
                    {analytics.freePeriodUsage.idle}%
                  </div>
                  <p className="text-[11px] text-slate-400">Down from historical 60% baseline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                  Attendit — Institutional Report Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 print:p-0">
              {/* Document Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-bold font-['Playfair_Display',serif] text-slate-950">
                    ATTENDIT INSTITUTIONAL AUDIT REPORT
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Academic Year 2026-2027 • Semester IV & VI Review
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Status: NEP-2020 Compliant ✓</div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  1. Executive Summary & KPIs
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Overall Campus Attendance</div>
                    <div className="text-lg font-bold text-slate-900">
                      {analytics.kpis.todayAttendancePercent}%
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Free-Period NEP Engagement</div>
                    <div className="text-lg font-bold text-indigo-700">
                      {analytics.kpis.freePeriodUsagePercent}%
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-slate-500">Flagged Drop Risk Cases</div>
                    <div className="text-lg font-bold text-rose-600">
                      {analytics.earlyWarningStudents.length} Students
                    </div>
                  </div>
                </div>
              </div>

              {/* Departmental Performance */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  2. Departmental Attendance Audit
                </h4>
                <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Enrolled</th>
                      <th className="p-2.5">Present Today</th>
                      <th className="p-2.5">Attendance Rate</th>
                      <th className="p-2.5">Free-Period Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {analytics.departmentBreakdown.map((d, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium">{d.department} ({d.code})</td>
                        <td className="p-2.5">{d.enrolled}</td>
                        <td className="p-2.5">{d.present}</td>
                        <td className="p-2.5 font-bold text-indigo-700">{d.attendancePercent}%</td>
                        <td className="p-2.5 text-emerald-700">{d.freePeriodActivePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* At-Risk Intervention Schedule */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  3. Early-Warning Intervention Registry (&gt;15% Drop Threshold)
                </h4>
                <div className="space-y-1.5 text-xs">
                  {analytics.earlyWarningStudents.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <strong>{s.name}</strong> ({s.rollNo}) — {s.branch}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-rose-600 font-bold">Drop: {s.deltaPercent}%</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Action: {s.suggestedAction}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Signature */}
              <div className="pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                <div>Generated via Attendit Academic Core</div>
                <div className="text-right">Authorized Signatory: {adminUser.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
