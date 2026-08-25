import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import {
  QrCode,
  LogOut,
  Calendar,
  Clock,
  Building,
  GraduationCap,
  Tablet,
} from 'lucide-react';

interface NavbarProps {
  teacher: Teacher | null;
  student?: any | null;
  admin?: any | null;
  activeTab: 'dashboard' | 'classes' | 'session' | 'student' | 'admin' | 'review' | 'tablet';
  setActiveTab: (tab: 'dashboard' | 'classes' | 'session' | 'student' | 'admin' | 'review' | 'tablet') => void;
  isSessionActive: boolean;
  onOpenTabletMode?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  teacher,
  student,
  admin,
  activeTab,
  setActiveTab,
  isSessionActive,
  onOpenTabletMode,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Portal Title */}
            <div
              className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group shrink-0"
              onClick={() =>
                setActiveTab(teacher ? 'dashboard' : admin ? 'admin' : 'student')
              }
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-xs shrink-0">
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
              </div>
              <div>
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 font-['Playfair_Display',serif]">
                  attendit
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none hidden xs:block">
                  {admin
                    ? 'Dean / Admin'
                    : teacher
                    ? 'Faculty Portal'
                    : student
                    ? 'Student Portal'
                    : 'Smart Core'}
                </p>
              </div>
            </div>

            {/* Core Navigation Tabs (Only for Teacher - Desktop) */}
            {teacher && (
              <nav className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'classes'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Classes
                </button>
                <button
                  onClick={() => setActiveTab('session')}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'session'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Live Session</span>
                  {isSessionActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            )}

            {/* Right Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Classroom / Tablet Mode Quick Button for Teachers */}
              {teacher && onOpenTabletMode && (
                <button
                  id="navbar-tablet-mode-btn"
                  onClick={onOpenTabletMode}
                  title="Classroom / Podium Tablet Mode"
                  className="px-2.5 sm:px-3.5 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-full text-[11px] sm:text-xs font-bold transition flex items-center space-x-1 sm:space-x-1.5 cursor-pointer border border-slate-200 shrink-0"
                >
                  <Tablet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">Tablet Mode</span>
                </button>
              )}

              {/* Time / Date */}
              <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200/80 rounded-full text-xs text-slate-600 shadow-2xs shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
                <span className="text-slate-300">·</span>
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-mono font-semibold text-slate-900">{formattedTime}</span>
              </div>

              {/* Profile & Logout */}
              {admin ? (
                <div className="flex items-center space-x-2 sm:space-x-2.5 pl-1 sm:pl-2 border-l border-slate-200">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                    <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                      {admin.name}
                    </p>
                    <span className="text-[10px] text-indigo-600 font-semibold">Institutional Dean</span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Logout"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : teacher ? (
                <div className="flex items-center space-x-2 sm:space-x-2.5 pl-1 sm:pl-2 border-l border-slate-200">
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                      {teacher.name}
                    </p>
                    <span className="text-[10px] text-indigo-600 font-semibold">Faculty</span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Logout"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : student ? (
                <div className="flex items-center space-x-2 sm:space-x-2.5 pl-1 sm:pl-2 border-l border-slate-200">
                  <img
                    src={
                      student.avatar ||
                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop'
                    }
                    alt={student.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                      {student.name}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                      {student.rollNo || 'Student'}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Logout"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-semibold text-rose-600 hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-950 text-white rounded-full text-xs font-semibold hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Tabs for Teacher */}
          {teacher && (
            <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-100 overflow-x-auto no-scrollbar gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition ${
                  activeTab === 'dashboard' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition ${
                  activeTab === 'classes' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Classes
              </button>
              <button
                onClick={() => setActiveTab('session')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 flex items-center space-x-1 transition ${
                  activeTab === 'session' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                <span>Live Session</span>
                {isSessionActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition ${
                  activeTab === 'admin' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Analytics
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
