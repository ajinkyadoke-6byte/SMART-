export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  branch?: string;
  avatar: string;
  designation?: string;
  facultyCode?: string;
  activeSubject?: string;
  activeRoom?: string;
  stats?: {
    todayClasses?: number;
    totalClassesToday?: number;
    activeSessions?: number;
    totalStudents?: number;
    avgAttendance?: number;
    averageAttendancePercent?: number;
    proxyAlertsFlagged?: number;
    [key: string]: any;
  };
  timings?: {
    start: string;
    finish: string;
  };
  shiftStart?: string;
  shiftFinish?: string;
}

export interface BranchItem {
  id: string;
  code: string;
  name: string;
  department?: string;
}

export interface DivisionItem {
  id: string;
  name: string;
  code?: string;
  capacity?: number;
}

export interface SemesterItem {
  id: string;
  semesterNumber: number;
  label: string;
  number?: number;
  name?: string;
  academicYear?: string;
}

export interface ClassItem {
  id: string;
  code?: string;
  name: string;
  department?: string;
  branch?: string;
  branchId?: string;
  branchName?: string;
  semester?: number;
  semesterId?: string;
  semesterName?: string;
  section?: string;
  divisionId?: string;
  divisionName?: string;
  totalStudents: number;
  defaultRoom?: string;
  currentRoom?: string;
  batchYear?: number;
  subjectIds?: string[];
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  department?: string;
  branch?: string;
  colorTheme?: string;
  type?: string;
}

export interface LowAttendanceStudent {
  id: string;
  rollNo: string;
  rollNumber?: string;
  name: string;
  email?: string;
  avatar?: string;
  classId?: string;
  className?: string;
  branch: string;
  section?: string;
  semester?: number;
  overallAttendance: number;
  missedLectures?: number;
  totalLectures?: number;
  totalClasses?: number;
  attendedClasses?: number;
  consecutiveAbsences?: number;
  parentEmail?: string;
  parentPhone?: string;
  status?: string;
  statusRisk?: 'critical' | 'warning' | 'borderline';
  lastAttended?: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  className?: string;
  class?: string;
  subjectId: string;
  subjectName?: string;
  subject?: string;
  subjectCode?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  room: string;
  dayOfWeek?: string;
  day?: string;
  status?: string;
  isToday?: boolean;
  isCompleted?: boolean;
  attendancePercent?: number;
  attendanceCount?: {
    present: number;
    total: number;
    flagged?: number;
    percentage: number;
  };
}

export interface DailyAttendanceStat {
  day: string;
  date: string;
  percentage?: number;
  attendance?: number;
  totalPresent?: number;
  totalEnrolled?: number;
  total?: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  avatar: string;
  classId: string;
  className?: string;
  enrolledSubjectIds?: string[];
  overallAttendance: number;
  status?: 'present' | 'flagged' | 'absent';
  markedAt?: string;
  flagReason?: string;
  verificationMethod?: string;
  editReason?: string;
  editedAt?: string;
  editedBy?: string;
}

export interface AttendanceSession {
  id?: string;
  sessionId?: string;
  sessionCode: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  room: string;
  timeSlot?: string;
  teacherId?: string;
  teacherName?: string;
  startedAt: string;
  status?: 'active' | 'ended';
  qrCodeUrl: string;
  qrExpiresIn: number;
  qrTotalDuration: number;
  qrToken: string;
  stats: {
    present: number;
    flagged: number;
    absent: number;
    total?: number;
    totalStudents?: number;
    attendanceRate?: number;
  };
  students: Student[];
}

export interface AttendanceEventPayload {
  sessionId: string;
  student: Student;
  stats: {
    present: number;
    flagged: number;
    absent: number;
    total: number;
  };
}

export interface StudentOnboardingProfile {
  studentId: string;
  careerGoal: string; // e.g., 'Full Stack Developer', 'Data Scientist', 'AI/ML Engineer'
  interests: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  learningStyle: 'hands_on' | 'quizzes' | 'video' | 'notes';
  freeTimeMinutes: number; // e.g., 15, 30, 45, 60
  xp: number;
  streakDays: number;
  completedActivitiesCount: number;
  lastActivityDate?: string;
  badges?: string[];
}

export interface FreePeriodActivity {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  category: 'Skill Dev' | 'Revision' | 'Project Lab' | 'Quiz Challenge';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  nepCreditLabel: string; // e.g., 'Counts toward Skill Enhancement Credit (SEC-202)'
  xpReward: number;
  tags: string[];
  matchReasons?: {
    weakSubjectMatched?: boolean;
    careerGoalMatched?: boolean;
    timeFitMatched?: boolean;
    learningStyleMatched?: boolean;
    explanation: string;
  };
  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'xp' | 'attendance' | 'skill';
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
  requirement: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  rollNo: string;
  avatar: string;
  className: string;
  xp: number;
  streakDays: number;
  badgesCount: number;
  attendancePercent: number;
  isCurrentUser?: boolean;
}

export interface AdminAnalyticsData {
  kpis: {
    totalStudents: number;
    todayAttendancePercent: number;
    attendanceDeltaPercent: number;
    freePeriodUsagePercent: number;
    studentsAtRiskCount: number;
  };
  earlyWarningStudents: {
    id: string;
    name: string;
    rollNo: string;
    branch: string;
    semester: number;
    attendanceLastWeek: number;
    attendanceThisWeek: number;
    deltaPercent: number;
    riskCategory: 'High Risk (>15% drop)' | 'Moderate Risk' | 'Critical Threshold';
    suggestedAction: string;
  }[];
  weeklyTrends: {
    day: string;
    cse: number;
    it: number;
    aids: number;
    ece: number;
    overall: number;
  }[];
  departmentBreakdown: {
    department: string;
    code: string;
    enrolled: number;
    present: number;
    attendancePercent: number;
    freePeriodActivePercent: number;
  }[];
  freePeriodUsage: {
    skillDevelopment: number;
    revision: number;
    projectLabs: number;
    idle: number;
  };
  topRequestedSkills: {
    skill: string;
    demandPercent: number;
    category: string;
  }[];
  careerCounselorInsights: {
    title: string;
    statistic: string;
    description: string;
    recommendation: string;
  }[];
}

export interface OfflineAttendanceQueueItem {
  id: string;
  timestamp: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  classId?: string;
  subjectId?: string;
  rawQrData: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  deviceInfo: string;
  verificationPassed: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
}

