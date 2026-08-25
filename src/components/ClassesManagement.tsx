import React, { useState, useEffect } from 'react';
import { ClassItem, SubjectItem, BranchItem, DivisionItem, SemesterItem } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import {
  Play,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  MapPin,
  BookOpen,
  Layers,
  Sparkles,
  GitBranch,
  Calendar,
  Grid,
  Hash,
  School,
} from 'lucide-react';

interface ClassesManagementProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  branches?: BranchItem[];
  divisions?: DivisionItem[];
  semesters?: SemesterItem[];
  onStartSession: (classId: string, subjectId: string, room: string, metadata?: any) => void;
  onClassesUpdated?: (updatedClasses: ClassItem[]) => void;
  onSubjectsUpdated?: (updatedSubjects: SubjectItem[]) => void;
  onBranchesUpdated?: (updatedBranches: BranchItem[]) => void;
  isLoading?: boolean;
}

export const ClassesManagement: React.FC<ClassesManagementProps> = ({
  classes: initialClasses,
  subjects: initialSubjects,
  branches: initialBranches = [],
  divisions: initialDivisions = [],
  semesters: initialSemesters = [],
  onStartSession,
  onClassesUpdated,
  onSubjectsUpdated,
  onBranchesUpdated,
  isLoading = false,
}) => {
  const [classesList, setClassesList] = useState<ClassItem[]>(initialClasses);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(initialSubjects);
  const [branchesList, setBranchesList] = useState<BranchItem[]>(
    initialBranches.length > 0
      ? initialBranches
      : [
          { id: 'branch-cse', code: 'CSE', name: 'Computer Science & Engineering', department: 'Computer Science' },
          { id: 'branch-it', code: 'IT', name: 'Information Technology', department: 'Information Technology' },
          { id: 'branch-aids', code: 'AI&DS', name: 'Artificial Intelligence & Data Science', department: 'Computer Science' },
          { id: 'branch-ece', code: 'ECE', name: 'Electronics & Communication', department: 'Electronics' },
          { id: 'branch-mech', code: 'MECH', name: 'Mechanical Engineering', department: 'Mechanical' },
        ]
  );
  const [divisionsList, setDivisionsList] = useState<DivisionItem[]>(
    initialDivisions.length > 0
      ? initialDivisions
      : [
          { id: 'div-a', name: 'A' },
          { id: 'div-b', name: 'B' },
          { id: 'div-c', name: 'C' },
          { id: 'div-d', name: 'D' },
          { id: 'div-e', name: 'E' },
        ]
  );
  const [semestersList, setSemestersList] = useState<SemesterItem[]>(
    initialSemesters.length > 0
      ? initialSemesters
      : [
          { id: 'sem-1', semesterNumber: 1, label: 'Semester 1' },
          { id: 'sem-2', semesterNumber: 2, label: 'Semester 2' },
          { id: 'sem-3', semesterNumber: 3, label: 'Semester 3' },
          { id: 'sem-4', semesterNumber: 4, label: 'Semester 4' },
          { id: 'sem-5', semesterNumber: 5, label: 'Semester 5' },
          { id: 'sem-6', semesterNumber: 6, label: 'Semester 6' },
          { id: 'sem-7', semesterNumber: 7, label: 'Semester 7' },
          { id: 'sem-8', semesterNumber: 8, label: 'Semester 8' },
        ]
  );

  // Active Management Tab
  const [activeMgmtTab, setActiveMgmtTab] = useState<'classes' | 'branches' | 'subjects' | 'options'>('classes');

  // Sync props
  useEffect(() => {
    setClassesList(initialClasses);
  }, [initialClasses]);

  useEffect(() => {
    setSubjectsList(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    if (initialBranches.length > 0) setBranchesList(initialBranches);
  }, [initialBranches]);

  useEffect(() => {
    if (initialDivisions.length > 0) setDivisionsList(initialDivisions);
  }, [initialDivisions]);

  useEffect(() => {
    if (initialSemesters.length > 0) setSemestersList(initialSemesters);
  }, [initialSemesters]);

  // 1. Pick & Start Session Form State
  const [selectedBranch, setSelectedBranch] = useState<string>(
    initialClasses[0]?.branch || branchesList[0]?.name || 'Computer Science & Engineering'
  );
  const [selectedDivision, setSelectedDivision] = useState<string>(
    initialClasses[0]?.section || 'A'
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(
    initialClasses[0]?.semester || 4
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjects[0]?.id || ''
  );
  const [roomNumber, setRoomNumber] = useState<string>(
    initialClasses[0]?.defaultRoom || 'Room 301'
  );

  // Filtered or matched class
  const matchedClass =
    classesList.find(
      (c) =>
        (c.branch === selectedBranch || !c.branch || c.department.includes(selectedBranch.split(' ')[0])) &&
        c.section === selectedDivision &&
        c.semester === Number(selectedSemester)
    ) ||
    classesList.find((c) => c.section === selectedDivision && c.semester === Number(selectedSemester)) ||
    classesList[0];

  // Auto-update room and subject when class selection changes
  const handleBranchChange = (branchName: string) => {
    setSelectedBranch(branchName);
    // Find matching subject if available
    const branchSub = subjectsList.find(
      (s) => s.branch === branchName || (s.department && branchName.includes(s.department))
    );
    if (branchSub) {
      setSelectedSubjectId(branchSub.id);
    }
  };

  const handleStartSessionClick = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubject = subjectsList.find((s) => s.id === selectedSubjectId) || subjectsList[0];
    const targetClass = matchedClass || {
      id: `class-${Date.now()}`,
      code: `${selectedBranch.substring(0, 3).toUpperCase()}-${selectedDivision}`,
      name: `${selectedBranch} - Div ${selectedDivision} (Sem ${selectedSemester})`,
      department: selectedBranch,
      branch: selectedBranch,
      semester: Number(selectedSemester),
      section: selectedDivision,
      totalStudents: 40,
      defaultRoom: roomNumber || 'Room 301',
    };

    onStartSession(targetClass.id, targetSubject?.id || 'sub-ds', roomNumber || targetClass.defaultRoom || 'Room 301', {
      className: targetClass.name,
      classCode: targetClass.code,
      totalStudents: targetClass.totalStudents,
      branch: targetClass.branch || selectedBranch,
      semester: targetClass.semester || Number(selectedSemester),
      section: targetClass.section || selectedDivision,
      subjectName: targetSubject?.name,
      subjectCode: targetSubject?.code,
    });
  };

  // ====================================================
  // MODALS STATE FOR CRUD (Classes, Branches, Subjects, Options)
  // ====================================================

  // Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classFormData, setClassFormData] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    semester: 4,
    section: 'A',
    totalStudents: 40,
    defaultRoom: 'Room 301',
  });

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchFormData, setBranchFormData] = useState({
    code: '',
    name: '',
    department: '',
  });

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    credits: 3,
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    colorTheme: 'indigo',
  });

  // Division Modal State
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [divisionInput, setDivisionInput] = useState('');
  const [editingDivId, setEditingDivId] = useState<string | null>(null);

  // Semester Modal State
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [semesterInput, setSemesterInput] = useState(1);
  const [semesterLabelInput, setSemesterLabelInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // -------------------------
  // CLASS HANDLERS
  // -------------------------
  const handleOpenCreateClassModal = () => {
    setEditingClassId(null);
    setClassFormData({
      code: `${selectedDivision}-${selectedSemester}`,
      name: `${branchesList[0]?.code || 'CSE'}-${selectedDivision} (Semester ${selectedSemester})`,
      department: branchesList[0]?.department || 'Computer Science',
      branch: branchesList[0]?.name || 'Computer Science & Engineering',
      semester: selectedSemester,
      section: selectedDivision,
      totalStudents: 40,
      defaultRoom: 'Room 301',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClassModal = (c: ClassItem) => {
    setEditingClassId(c.id);
    setClassFormData({
      code: c.code,
      name: c.name,
      department: c.department,
      branch: c.branch || branchesList[0]?.name || 'Computer Science & Engineering',
      semester: c.semester,
      section: c.section,
      totalStudents: c.totalStudents,
      defaultRoom: c.defaultRoom,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingClassId) {
        const { ok, data } = await safeFetchJson(`/api/classes/${editingClassId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classFormData),
        });
        if (ok && data?.classes) {
          setClassesList(data.classes);
          if (onClassesUpdated) onClassesUpdated(data.classes);
        } else {
          // Fallback update local state
          const updated = classesList.map((c) =>
            c.id === editingClassId
              ? {
                  ...c,
                  name: `${classFormData.branchName} - ${classFormData.semesterName} (${classFormData.divisionName})`,
                  ...classFormData,
                }
              : c
          );
          setClassesList(updated);
          if (onClassesUpdated) onClassesUpdated(updated);
        }
      } else {
        const { ok, data } = await safeFetchJson('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classFormData),
        });
        if (ok && data?.classes) {
          setClassesList(data.classes);
          if (onClassesUpdated) onClassesUpdated(data.classes);
        } else {
          // Fallback create local state
          const newClass: ClassItem = {
            id: 'class-' + Date.now(),
            name: `${classFormData.branchName} - ${classFormData.semesterName} (${classFormData.divisionName})`,
            ...classFormData,
            totalStudents: classFormData.totalStudents || 60,
          };
          const updated = [...classesList, newClass];
          setClassesList(updated);
          if (onClassesUpdated) onClassesUpdated(updated);
        }
      }
      setIsClassModalOpen(false);
    } catch (err) {
      console.error('Failed to save class:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      const { ok, data } = await safeFetchJson(`/api/classes/${id}`, { method: 'DELETE' });
      if (ok && data?.classes) {
        setClassesList(data.classes);
        if (onClassesUpdated) onClassesUpdated(data.classes);
      } else {
        const updated = classesList.filter((c) => c.id !== id);
        setClassesList(updated);
        if (onClassesUpdated) onClassesUpdated(updated);
      }
    } catch (err) {
      const updated = classesList.filter((c) => c.id !== id);
      setClassesList(updated);
      if (onClassesUpdated) onClassesUpdated(updated);
    }
  };

  // -------------------------
  // BRANCH HANDLERS
  // -------------------------
  const handleOpenCreateBranchModal = () => {
    setEditingBranchId(null);
    setBranchFormData({ code: '', name: '', department: '' });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranchModal = (b: BranchItem) => {
    setEditingBranchId(b.id);
    setBranchFormData({ code: b.code, name: b.name, department: b.department || b.name });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingBranchId) {
        const { ok, data } = await safeFetchJson(`/api/branches/${editingBranchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchFormData),
        });
        if (ok && data?.branches) {
          setBranchesList(data.branches);
          if (onBranchesUpdated) onBranchesUpdated(data.branches);
        } else {
          const updated = branchesList.map((b) => (b.id === editingBranchId ? { ...b, ...branchFormData } : b));
          setBranchesList(updated);
          if (onBranchesUpdated) onBranchesUpdated(updated);
        }
      } else {
        const { ok, data } = await safeFetchJson('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchFormData),
        });
        if (ok && data?.branches) {
          setBranchesList(data.branches);
          if (onBranchesUpdated) onBranchesUpdated(data.branches);
        } else {
          const newBranch: BranchItem = {
            id: 'branch-' + Date.now(),
            ...branchFormData,
          };
          const updated = [...branchesList, newBranch];
          setBranchesList(updated);
          if (onBranchesUpdated) onBranchesUpdated(updated);
        }
      }
      setIsBranchModalOpen(false);
    } catch (err) {
      console.error('Failed to save branch:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm('Delete this branch option?')) return;
    try {
      const { ok, data } = await safeFetchJson(`/api/branches/${id}`, { method: 'DELETE' });
      if (ok && data?.branches) {
        setBranchesList(data.branches);
        if (onBranchesUpdated) onBranchesUpdated(data.branches);
      } else {
        const updated = branchesList.filter((b) => b.id !== id);
        setBranchesList(updated);
        if (onBranchesUpdated) onBranchesUpdated(updated);
      }
    } catch (err) {
      const updated = branchesList.filter((b) => b.id !== id);
      setBranchesList(updated);
      if (onBranchesUpdated) onBranchesUpdated(updated);
    }
  };

  // -------------------------
  // SUBJECT HANDLERS
  // -------------------------
  const handleOpenCreateSubjectModal = () => {
    setEditingSubjectId(null);
    setSubjectFormData({
      code: '',
      name: '',
      credits: 3,
      department: branchesList[0]?.department || 'Computer Science',
      branch: branchesList[0]?.name || 'Computer Science & Engineering',
      colorTheme: 'indigo',
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubjectModal = (s: SubjectItem) => {
    setEditingSubjectId(s.id);
    setSubjectFormData({
      code: s.code,
      name: s.name,
      credits: s.credits,
      department: s.department,
      branch: s.branch || branchesList[0]?.name || 'Computer Science & Engineering',
      colorTheme: s.colorTheme || 'indigo',
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSubjectId) {
        const { ok, data } = await safeFetchJson(`/api/subjects/${editingSubjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectFormData),
        });
        if (ok && data?.subjects) {
          setSubjectsList(data.subjects);
          if (onSubjectsUpdated) onSubjectsUpdated(data.subjects);
        } else {
          const updated = subjectsList.map((s) => (s.id === editingSubjectId ? { ...s, ...subjectFormData } : s));
          setSubjectsList(updated);
          if (onSubjectsUpdated) onSubjectsUpdated(updated);
        }
      } else {
        const { ok, data } = await safeFetchJson('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectFormData),
        });
        if (ok && data?.subjects) {
          setSubjectsList(data.subjects);
          if (onSubjectsUpdated) onSubjectsUpdated(data.subjects);
        } else {
          const newSub: SubjectItem = {
            id: 'sub-' + Date.now(),
            ...subjectFormData,
          };
          const updated = [...subjectsList, newSub];
          setSubjectsList(updated);
          if (onSubjectsUpdated) onSubjectsUpdated(updated);
        }
      }
      setIsSubjectModalOpen(false);
    } catch (err) {
      console.error('Failed to save subject:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      const { ok, data } = await safeFetchJson(`/api/subjects/${id}`, { method: 'DELETE' });
      if (ok && data?.subjects) {
        setSubjectsList(data.subjects);
        if (onSubjectsUpdated) onSubjectsUpdated(data.subjects);
      } else {
        const updated = subjectsList.filter((s) => s.id !== id);
        setSubjectsList(updated);
        if (onSubjectsUpdated) onSubjectsUpdated(updated);
      }
    } catch (err) {
      const updated = subjectsList.filter((s) => s.id !== id);
      setSubjectsList(updated);
      if (onSubjectsUpdated) onSubjectsUpdated(updated);
    }
  };

  // -------------------------
  // DIVISION & SEMESTER HANDLERS
  // -------------------------
  const handleSaveDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionInput.trim()) return;
    setIsSaving(true);
    try {
      if (editingDivId) {
        const { ok, data } = await safeFetchJson(`/api/divisions/${editingDivId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: divisionInput.trim().toUpperCase() }),
        });
        if (ok && data?.divisions) {
          setDivisionsList(data.divisions);
        } else {
          const updated = divisionsList.map((d) =>
            d.id === editingDivId ? { ...d, name: divisionInput.trim().toUpperCase() } : d
          );
          setDivisionsList(updated);
        }
      } else {
        const { ok, data } = await safeFetchJson('/api/divisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: divisionInput.trim().toUpperCase() }),
        });
        if (ok && data?.divisions) {
          setDivisionsList(data.divisions);
        } else {
          const newDiv: DivisionItem = {
            id: 'div-' + Date.now(),
            name: `Division ${divisionInput.trim().toUpperCase()}`,
            code: divisionInput.trim().toUpperCase(),
            capacity: 70,
          };
          setDivisionsList([...divisionsList, newDiv]);
        }
      }
      setIsDivisionModalOpen(false);
      setDivisionInput('');
      setEditingDivId(null);
    } catch (err) {
      console.error('Failed to save division:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDivision = async (id: string) => {
    if (!window.confirm('Delete this division?')) return;
    try {
      const { ok, data } = await safeFetchJson(`/api/divisions/${id}`, { method: 'DELETE' });
      if (ok && data?.divisions) setDivisionsList(data.divisions);
      else setDivisionsList(divisionsList.filter((d) => d.id !== id));
    } catch (err) {
      setDivisionsList(divisionsList.filter((d) => d.id !== id));
    }
  };

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { ok, data } = await safeFetchJson('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semesterNumber: semesterInput,
          label: semesterLabelInput || `Semester ${semesterInput}`,
        }),
      });
      if (ok && data?.semesters) setSemestersList(data.semesters);
      else {
        const newSem: SemesterItem = {
          id: 'sem-' + Date.now(),
          semesterNumber: semesterInput,
          label: semesterLabelInput || `Semester ${semesterInput}`,
          academicYear: '2024-2025',
        };
        setSemestersList([...semestersList, newSem]);
      }
      setIsSemesterModalOpen(false);
      setSemesterLabelInput('');
    } catch (err) {
      console.error('Failed to save semester:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSemester = async (id: string) => {
    if (!window.confirm('Delete this semester?')) return;
    try {
      const { ok, data } = await safeFetchJson(`/api/semesters/${id}`, { method: 'DELETE' });
      if (ok && data?.semesters) setSemestersList(data.semesters);
      else setSemestersList(semestersList.filter((s) => s.id !== id));
    } catch (err) {
      setSemestersList(semestersList.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Pick Classes & Start Session Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">
            Pick Class & Start Session
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select Branch, Division, Semester, Subject, and Room to initiate anti-proxy attendance
          </p>
        </div>

        <form onSubmit={handleStartSessionClick} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
            {/* 1. Branch Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <GitBranch className="w-3.5 h-3.5 text-slate-700" />
                <span>Branch / Stream</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                {branchesList.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.code ? `[${branch.code}] ` : ''}
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Division Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Grid className="w-3.5 h-3.5 text-slate-700" />
                <span>Class Division</span>
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                {divisionsList.map((div) => (
                  <option key={div.id} value={div.name}>
                    Division {div.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Semester Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-700" />
                <span>Semester</span>
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                {semestersList.map((sem) => (
                  <option key={sem.id} value={sem.semesterNumber}>
                    {sem.label || `Semester ${sem.semesterNumber}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                <span>Subject</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                {subjectsList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Room Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-700" />
                <span>Room No</span>
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 301"
                required
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Action Bar & Quick Match Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900">Target Batch:</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-900 rounded-full font-medium border border-indigo-100">
                {selectedBranch} · Div {selectedDivision} · Sem {selectedSemester}
              </span>
              <span className="text-slate-400">•</span>
              <span>Enrolled: ~{matchedClass ? matchedClass.totalStudents : 40} students</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 h-11 bg-slate-950 hover:bg-slate-900 active:scale-98 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isLoading ? 'Launching Session...' : 'Start Live Session'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Management & Option Configuration Hub */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-['Playfair_Display',Georgia,serif] font-bold text-slate-900 tracking-tight">Class Details & Option Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, edit, and manage options for Branches, Divisions, Semesters, Subjects, and Classes
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200/60">
            <button
              onClick={() => setActiveMgmtTab('classes')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeMgmtTab === 'classes'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Classes ({classesList.length})</span>
            </button>

            <button
              onClick={() => setActiveMgmtTab('branches')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeMgmtTab === 'branches'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Branches ({branchesList.length})</span>
            </button>

            <button
              onClick={() => setActiveMgmtTab('subjects')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeMgmtTab === 'subjects'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Subjects ({subjectsList.length})</span>
            </button>

            <button
              onClick={() => setActiveMgmtTab('options')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeMgmtTab === 'options'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Divisions & Semesters</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CLASSES MANAGEMENT */}
        {activeMgmtTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Class Batches Roster</span>
              <button
                onClick={handleOpenCreateClassModal}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Class</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Class Code & Name</th>
                    <th className="py-3 px-4">Branch / Stream</th>
                    <th className="py-3 px-4">Division</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Default Room</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {classesList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-semibold text-[11px]">
                          {item.branch || item.department}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-slate-800">Div {item.section}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">Sem {item.semester}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{item.totalStudents}</td>
                      <td className="py-3 px-4 text-slate-600">{item.defaultRoom}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              const matchSub =
                                subjectsList.find(
                                  (s) => s.branch === item.branch || (s.department && item.department && item.department.includes(s.department))
                                ) || subjectsList[0];
                              onStartSession(item.id, matchSub?.id || 'sub-ds', item.defaultRoom || 'Room 301', {
                                className: item.name,
                                classCode: item.code,
                                totalStudents: item.totalStudents,
                                branch: item.branch,
                                semester: item.semester,
                                section: item.section,
                                subjectName: matchSub?.name,
                                subjectCode: matchSub?.code,
                              });
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                            title="Start live session immediately"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Start Live</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBranch(item.branch || item.department);
                              setSelectedDivision(item.section);
                              setSelectedSemester(item.semester);
                              setRoomNumber(item.defaultRoom);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="Pick for session"
                          >
                            Pick
                          </button>
                          <button
                            onClick={() => handleOpenEditClassModal(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit class"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {classesList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No classes found. Click "Add New Class" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BRANCHES MANAGEMENT */}
        {activeMgmtTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">Academic Branches & Departments</span>
                <p className="text-[11px] text-slate-500">
                  Branches configured here populate the Branch dropdown in "Pick Class & Start Session"
                </p>
              </div>
              <button
                onClick={handleOpenCreateBranchModal}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Branch</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchesList.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between space-x-3 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-mono font-bold">
                        {branch.code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{branch.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">{branch.department || 'Academic Stream'}</p>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditBranchModal(branch)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUBJECTS MANAGEMENT */}
        {activeMgmtTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">Subjects & Course Modules</span>
                <p className="text-[11px] text-slate-500">
                  Subjects added here populate the Subject dropdown in "Pick Class & Start Session"
                </p>
              </div>
              <button
                onClick={handleOpenCreateSubjectModal}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Subject Code & Name</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {subjectsList.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono font-bold text-slate-800 text-xs">
                            {sub.code}
                          </span>
                          <span className="font-bold text-slate-900">{sub.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {sub.branch || sub.department || 'Computer Science'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{sub.department}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{sub.credits} Credits</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setSelectedSubjectId(sub.id);
                              if (sub.branch) setSelectedBranch(sub.branch);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                            title="Pick for session"
                          >
                            Pick
                          </button>
                          <button
                            onClick={() => handleOpenEditSubjectModal(sub)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DIVISIONS & SEMESTERS CONFIGURATION */}
        {activeMgmtTab === 'options' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Division Options */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <Grid className="w-4 h-4 text-slate-700" />
                    <span>Divisions / Sections</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure available division letters</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDivId(null);
                    setDivisionInput('');
                    setIsDivisionModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Div</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {divisionsList.map((div) => (
                  <div
                    key={div.id}
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full shadow-xs"
                  >
                    <span className="text-xs font-bold text-slate-900 font-mono">Division {div.name}</span>
                    <button
                      onClick={() => {
                        setEditingDivId(div.id);
                        setDivisionInput(div.name);
                        setIsDivisionModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-slate-800"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteDivision(div.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Semester Options */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-slate-700" />
                    <span>Semesters</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure academic semesters (1 to 8+)</p>
                </div>
                <button
                  onClick={() => {
                    setSemesterInput(semestersList.length + 1);
                    setSemesterLabelInput(`Semester ${semestersList.length + 1}`);
                    setIsSemesterModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sem</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {semestersList.map((sem) => (
                  <div
                    key={sem.id}
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full shadow-xs"
                  >
                    <span className="text-xs font-bold text-slate-900">{sem.label || `Semester ${sem.semesterNumber}`}</span>
                    <button
                      onClick={() => handleDeleteSemester(sem.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT CLASS */}
      {/* ==================================================== */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">
                {editingClassId ? 'Edit Class Details' : 'Add New Class Batch'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Class Code</label>
                  <input
                    type="text"
                    value={classFormData.code}
                    onChange={(e) => setClassFormData({ ...classFormData, code: e.target.value })}
                    required
                    placeholder="e.g. CSE-A"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Division / Section</label>
                  <select
                    value={classFormData.section}
                    onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {divisionsList.map((d) => (
                      <option key={d.id} value={d.name}>
                        Division {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Class Batch Name</label>
                <input
                  type="text"
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  required
                  placeholder="e.g. CSE-A (Semester 4)"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Branch / Stream</label>
                  <select
                    value={classFormData.branch}
                    onChange={(e) =>
                      setClassFormData({
                        ...classFormData,
                        branch: e.target.value,
                        department: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Semester</label>
                  <select
                    value={classFormData.semester}
                    onChange={(e) => setClassFormData({ ...classFormData, semester: Number(e.target.value) })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {semestersList.map((s) => (
                      <option key={s.id} value={s.semesterNumber}>
                        {s.label || `Semester ${s.semesterNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Total Students</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={classFormData.totalStudents}
                    onChange={(e) => setClassFormData({ ...classFormData, totalStudents: Number(e.target.value) })}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Default Room</label>
                  <input
                    type="text"
                    value={classFormData.defaultRoom}
                    onChange={(e) => setClassFormData({ ...classFormData, defaultRoom: e.target.value })}
                    required
                    placeholder="e.g. Room 301"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT BRANCH */}
      {/* ==================================================== */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">
                {editingBranchId ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Branch Code</label>
                <input
                  type="text"
                  value={branchFormData.code}
                  onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. CSE, IT, AIDS, MECH"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Branch Name</label>
                <input
                  type="text"
                  value={branchFormData.name}
                  onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Department</label>
                <input
                  type="text"
                  value={branchFormData.department}
                  onChange={(e) => setBranchFormData({ ...branchFormData, department: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingBranchId ? 'Save Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADD / EDIT SUBJECT */}
      {/* ==================================================== */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">
                {editingSubjectId ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Subject Code</label>
                  <input
                    type="text"
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="e.g. CS401"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={subjectFormData.credits}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: Number(e.target.value) })}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subject Name</label>
                <input
                  type="text"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Associated Branch</label>
                <select
                  value={subjectFormData.branch}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, branch: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                >
                  {branchesList.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingSubjectId ? 'Save Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: ADD / EDIT DIVISION */}
      {/* ==================================================== */}
      {isDivisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">
                {editingDivId ? 'Edit Division' : 'Add Division Option'}
              </h3>
              <button
                onClick={() => setIsDivisionModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDivision} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Division Identifier</label>
                <input
                  type="text"
                  value={divisionInput}
                  onChange={(e) => setDivisionInput(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. A, B, C, D, E, F"
                  maxLength={6}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDivisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Division'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: ADD SEMESTER */}
      {/* ==================================================== */}
      {isSemesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-['Playfair_Display',Georgia,serif] font-bold text-slate-900">Add Semester Option</h3>
              <button
                onClick={() => setIsSemesterModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSemester} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Semester Number</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={semesterInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSemesterInput(val);
                    setSemesterLabelInput(`Semester ${val}`);
                  }}
                  required
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Display Label</label>
                <input
                  type="text"
                  value={semesterLabelInput}
                  onChange={(e) => setSemesterLabelInput(e.target.value)}
                  placeholder="e.g. Semester 5"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSemesterModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Add Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
