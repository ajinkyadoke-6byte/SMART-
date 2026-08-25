import React from 'react';
import { ClassItem, SubjectItem, TimetableSlot, Teacher } from '../types';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  Play,
  ArrowUpRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

interface TeacherOverviewProps {
  teacher: Teacher;
  classes: ClassItem[];
  subjects: SubjectItem[];
  timetable: TimetableSlot[];
  onStartSession: (classId: string, subjectId: string, room: string, metadata?: any) => void;
  onGoToSelector: () => void;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({
  teacher,
  classes,
  subjects,
  timetable,
  onStartSession,
  onGoToSelector,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Welcome & Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {teacher.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              You have <strong className="text-white">{timetable.length} scheduled lectures</strong> today.
            </p>
          </div>

          <button
            onClick={onGoToSelector}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Attendance Session</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Lectures</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {timetable.length}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">4 Batches Assigned</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">91.4%</span>
              <span className="text-xs font-bold text-emerald-600">+4.2%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Across all departments</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Security Rate</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">98.8%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Verified check-ins</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">156</span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Active CSE/IT Roster</p>
          </div>
        </div>
      </div>

      {/* 3. Today's Lectures & Quick Launch Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Class Schedule</h3>
            <p className="text-xs text-slate-500">Select any lecture to launch the dynamic attendance engine</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600">Friday Schedule</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timetable.map((slot, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={slot.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isFirst
                    ? 'border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700">
                      {slot.room}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{slot.subjectName}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">{slot.className}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {slot.subjectCode}
                  </span>
                  <button
                    onClick={() =>
                      onStartSession(slot.classId, slot.subjectId, slot.room, {
                        className: slot.className,
                        subjectName: slot.subjectName,
                        subjectCode: slot.subjectCode,
                        timeSlot: `${slot.startTime} - ${slot.endTime}`,
                        branch: slot.branch,
                        semester: slot.semester,
                        section: slot.division,
                      })
                    }
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Launch Session</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
