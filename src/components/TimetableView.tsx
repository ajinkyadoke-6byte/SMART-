import React, { useState } from 'react';
import { TimetableSlot } from '../types';
import { Calendar, Clock, MapPin, Play, BookOpen, UserCheck, Filter } from 'lucide-react';

interface TimetableViewProps {
  timetable: TimetableSlot[];
  onStartSession: (classId: string, subjectId: string, room: string, metadata?: any) => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({ timetable, onStartSession }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const filteredTimetable = timetable.filter((slot) => {
    if (selectedBranch !== 'all') {
      const bMatch =
        (slot as any).branch?.toLowerCase().includes(selectedBranch.toLowerCase()) ||
        slot.className?.toLowerCase().includes(selectedBranch.toLowerCase()) ||
        (slot as any).class?.toLowerCase().includes(selectedBranch.toLowerCase());
      if (!bMatch) return false;
    }
    if (selectedSemester !== 'all') {
      const semNum = Number(selectedSemester);
      const semMatch =
        (slot as any).semester === semNum ||
        slot.className?.includes(`Semester ${semNum}`) ||
        (slot as any).class?.includes(`Sem ${semNum}`);
      if (!semMatch) return false;
    }
    if (selectedDivision !== 'all') {
      const divMatch =
        (slot as any).division?.toUpperCase() === selectedDivision.toUpperCase() ||
        slot.className?.includes(`-${selectedDivision}`) ||
        slot.className?.includes(`Div ${selectedDivision}`) ||
        (slot as any).class?.includes(`-${selectedDivision}`);
      if (!divMatch) return false;
    }
    if (selectedDay !== 'all') {
      const dMatch =
        slot.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase() ||
        (slot as any).day?.toLowerCase() === selectedDay.toLowerCase();
      if (!dMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Timetable</h2>
          <p className="text-sm text-slate-500">Live synchronized teaching schedule and venue assignments</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
            Live Synchronized with Admin
          </span>
        </div>
      </div>

      {/* Cohort & Schedule Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="all">All Branches</option>
            <option value="Computer Science">Computer Science (CSE)</option>
            <option value="Information Technology">Information Technology (IT)</option>
            <option value="Artificial Intelligence">AI & Data Science (AI&DS)</option>
            <option value="Electronics">Electronics (ECE)</option>
            <option value="Mechanical">Mechanical Engineering</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Year / Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1 (Year 1)</option>
            <option value="2">Semester 2 (Year 1)</option>
            <option value="3">Semester 3 (Year 2)</option>
            <option value="4">Semester 4 (Year 2)</option>
            <option value="5">Semester 5 (Year 3)</option>
            <option value="6">Semester 6 (Year 3)</option>
            <option value="7">Semester 7 (Year 4)</option>
            <option value="8">Semester 8 (Year 4)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Division</label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="all">All Divisions</option>
            <option value="A">Division A</option>
            <option value="B">Division B</option>
            <option value="C">Division C</option>
            <option value="D">Division D</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Day of Week</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTimetable.map((slot) => (
          <div
            key={slot.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {slot.dayOfWeek || (slot as any).day}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">{slot.room}</span>
              </div>

              <h4 className="text-base font-bold text-slate-900">{slot.subjectName || (slot as any).subject}</h4>
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">{slot.subjectCode}</p>
              <p className="text-xs text-slate-500 font-medium mt-2">{slot.className || (slot as any).class}</p>

              {(slot as any).teacherName && (
                <p className="text-[11px] text-slate-400 mt-1">Faculty: {(slot as any).teacherName}</p>
              )}

              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{slot.startTime || (slot as any).time?.split(' - ')[0]} - {slot.endTime || (slot as any).time?.split(' - ')[1]}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() =>
                  onStartSession(slot.classId, slot.subjectId, slot.room, {
                    className: slot.className || (slot as any).class,
                    subjectName: slot.subjectName || (slot as any).subject,
                    subjectCode: slot.subjectCode,
                    timeSlot: `${slot.startTime || (slot as any).time?.split(' - ')[0]} - ${slot.endTime || (slot as any).time?.split(' - ')[1]}`,
                    branch: (slot as any).branch,
                    semester: (slot as any).semester,
                    section: (slot as any).division,
                  })
                }
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Launch Attendance</span>
              </button>
            </div>
          </div>
        ))}

        {filteredTimetable.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/90 p-8 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No matching timetable slots found</h4>
            <p className="text-xs text-slate-500">Try changing your Branch, Year/Semester, or Division filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
