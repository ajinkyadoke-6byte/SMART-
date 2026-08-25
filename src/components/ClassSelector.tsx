import React, { useState } from 'react';
import { ClassItem, SubjectItem, TimetableSlot } from '../types';
import { BookOpen, Users, MapPin, Sparkles, Play, Calendar, Check, ArrowRight, Clock, GraduationCap } from 'lucide-react';

interface ClassSelectorProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  timetable: TimetableSlot[];
  onStartSession: (classId: string, subjectId: string, room: string, metadata?: any) => Promise<void> | void;
  isLoading?: boolean;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  subjects,
  timetable,
  onStartSession,
  isLoading = false,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [room, setRoom] = useState<string>(classes[0]?.defaultRoom || 'Room 301');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      setRoom(cls.defaultRoom);
    }
  };

  const handleQuickStartFromTimetable = (slot: TimetableSlot) => {
    setSelectedClassId(slot.classId);
    setSelectedSubjectId(slot.subjectId);
    setRoom(slot.room);
    onStartSession(slot.classId, slot.subjectId, slot.room, {
      className: slot.className,
      classCode: slot.subjectCode,
      subjectName: slot.subjectName,
      subjectCode: slot.subjectCode,
      timeSlot: `${slot.startTime} - ${slot.endTime}`,
    });
  };

  const handleStart = () => {
    if (!selectedClassId || !selectedSubjectId) return;
    const cls = classes.find((c) => c.id === selectedClassId) || selectedClass;
    const sub = subjects.find((s) => s.id === selectedSubjectId) || selectedSubject;
    onStartSession(selectedClassId, selectedSubjectId, room, {
      className: cls?.name,
      classCode: cls?.code,
      totalStudents: cls?.totalStudents,
      branch: cls?.branch,
      semester: cls?.semester,
      section: cls?.section,
      subjectName: sub?.name,
      subjectCode: sub?.code,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Class & Subject
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose the target batch and course to initiate an attendance session.
          </p>
        </div>
      </div>

      {/* Main Grid: Class & Subject Selector (Left) and Today's Timetable (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Selection Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Choose Class / Section */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Class</h3>
                <p className="text-xs text-slate-500">Pick the registered batch for this lecture</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {classes.length} Batches
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {classes.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleClassChange(cls.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white">
                        {cls.code}
                      </span>
                      <span className="text-xs font-medium text-slate-500">Sem {cls.semester}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{cls.name}</h4>
                    <div className="flex items-center space-x-3 mt-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.totalStudents} Students</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.defaultRoom}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Choose Subject / Course */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Subject</h3>
                <p className="text-xs text-slate-500">Select course curriculum</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800">
                        {sub.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">{sub.credits} Credits</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{sub.name}</h4>
                    <p className="text-xs text-slate-500 mt-2 font-medium">{sub.department}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Room Verification & Action */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Classroom / Lab</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 301"
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Launching Engine...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Attendance Session</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Today's Timetable Schedule */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Today's Timetable</h3>
                  <p className="text-xs text-slate-500">Scheduled classroom lectures</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Friday
              </span>
            </div>

            <div className="space-y-3">
              {timetable.map((slot, index) => {
                const isCurrentDS = slot.subjectCode === 'CS401';
                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrentDS
                        ? 'border-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200/80 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {slot.room}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{slot.subjectName}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                      <span className="text-xs font-medium text-slate-600">{slot.className}</span>
                      <button
                        onClick={() => handleQuickStartFromTimetable(slot)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        <span>Start Session</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
