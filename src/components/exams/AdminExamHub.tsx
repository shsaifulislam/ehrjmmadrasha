"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import {
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  Edit2,
  Trash2,
  BookOpen,
  Send,
  Printer,
  ShieldCheck,
  ChevronRight,
  Sliders,
  ExternalLink,
  FileText,
  X,
  Sparkles,
  Filter,
  CheckCircle2,
  GraduationCap,
  Users,
  Download,
  Eye,
  FileDown,
  Layers,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AdminExamHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    "EXAMS" | "TYPES" | "SUBJECTS" | "ROUTINE" | "TABULATION" | "RESULTS"
  >("EXAMS");

  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filter selections
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  // Search in Tabulation / Results
  const [searchTerm, setSearchTerm] = useState("");

  // Forms states for Exams
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examForm, setExamForm] = useState({
    nameBn: "",
    nameEn: "",
    examTypeId: "",
    startDate: "",
    endDate: "",
    instructions: "",
    status: "DRAFT",
  });
  const [editingExam, setEditingExam] = useState<any | null>(null);

  // Forms states for Types
  const [showCreateType, setShowCreateType] = useState(false);
  const [typeForm, setTypeForm] = useState({
    code: "",
    nameBn: "",
    nameEn: "",
    sortOrder: 0,
  });
  const [editingType, setEditingType] = useState<any | null>(null);

  // Forms states for Subjects
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    classId: "",
    nameBn: "",
    nameEn: "",
    nameAr: "",
    code: "",
    fullMarks: 100,
    passMarks: 33,
    isOptional: false,
    sortOrder: 0,
  });
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  // Forms states for Routines
  const [routines, setRoutines] = useState<any[]>([]);
  const [routineClassFilter, setRoutineClassFilter] = useState("");
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [routineForm, setRoutineForm] = useState({
    classId: "",
    sectionId: "",
    subjectId: "",
    examDate: "",
    startTime: "09:30 AM",
    endTime: "12:30 PM",
    roomNo: "",
    instructions: "",
  });
  const [editingRoutine, setEditingRoutine] = useState<any | null>(null);

  // Results & Tabulation data
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [correctingCandidate, setCorrectingCandidate] = useState<any | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    subjectId: "",
    newMarks: "",
    isAbsent: false,
    isExempt: false,
    correctionReason: "",
  });

  // Individual Marksheet Modal State
  const [selectedStudentMarksheet, setSelectedStudentMarksheet] = useState<any | null>(null);
  const [marksheetQrDataUrl, setMarksheetQrDataUrl] = useState<string | null>(null);

  // Print Tabulation Sheet Modal State
  const [showTabulationPrint, setShowTabulationPrint] = useState(false);

  // Batch Marksheets Print View State
  const [showBatchMarksheetsPrint, setShowBatchMarksheetsPrint] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [resSessions, resClasses, resTypes] = await Promise.all([
        fetch("/api/academic/sessions").then((r) => r.json()),
        fetch("/api/academic/classes").then((r) => r.json()),
        fetch("/api/admin/exams/types").then((r) => r.json()),
      ]);

      if (resSessions.sessions && resSessions.sessions.length > 0) {
        setSessions(resSessions.sessions);
        const active =
          resSessions.sessions.find(
            (s: any) => s.isCurrent || s.status === "ACTIVE" || s.isActive
          ) || resSessions.sessions[0];
        if (active) setSelectedSessionId(active.id);
      }
      if (resClasses.classes && resClasses.classes.length > 0) {
        setClasses(resClasses.classes);
        setSelectedClassId("");
      }
      if (resTypes.examTypes) {
        setExamTypes(resTypes.examTypes);
      }

      await loadExams();
      await loadSubjects();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async (sessId?: string) => {
    try {
      const targetSession = sessId || selectedSessionId;
      const url = targetSession ? `/api/admin/exams?sessionId=${targetSession}` : "/api/admin/exams";
      const res = await fetch(url);
      const data = await res.json();
      if (data.exams) {
        setExams(data.exams);
        if (data.exams.length > 0) {
          if (!selectedExamId || !data.exams.some((e: any) => e.id === selectedExamId)) {
            setSelectedExamId(data.exams[0].id);
          }
        } else {
          setSelectedExamId("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjects = async (classId?: string) => {
    try {
      const url = classId ? `/api/admin/subjects?classId=${classId}` : "/api/admin/subjects";
      const res = await fetch(url);
      const data = await res.json();
      if (data.subjects) setSubjects(data.subjects);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRoutines = async (examId: string, classId?: string) => {
    if (!examId) return;
    try {
      const url = classId
        ? `/api/admin/exams/${examId}/routine?classId=${classId}`
        : `/api/admin/exams/${examId}/routine`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routines) setRoutines(data.routines);
    } catch (err) {
      console.error(err);
    }
  };

  const loadResultsReview = async (examId: string, classId?: string) => {
    if (!examId) return;
    setLoadingResults(true);
    try {
      const url = classId
        ? `/api/admin/results?examId=${examId}&classId=${classId}`
        : `/api/admin/results?examId=${examId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setResultsData(data);
      } else {
        setMessage({ text: data.error || "ফলাফল লোড করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setLoadingResults(false);
    }
  };

  // Reactive Data Fetching on filter / tab change
  useEffect(() => {
    if ((activeSubTab === "TABULATION" || activeSubTab === "RESULTS") && selectedExamId) {
      loadResultsReview(selectedExamId, selectedClassId);
    }
  }, [selectedExamId, selectedClassId, activeSubTab]);

  useEffect(() => {
    if (activeSubTab === "ROUTINE" && selectedExamId) {
      loadRoutines(selectedExamId, routineClassFilter);
    }
  }, [selectedExamId, routineClassFilter, activeSubTab]);

  useEffect(() => {
    if (activeSubTab === "SUBJECTS") {
      loadSubjects(selectedClassId);
    }
  }, [selectedClassId, activeSubTab]);

  // Generate QR Code for Selected Student Marksheet
  useEffect(() => {
    if (!selectedStudentMarksheet) {
      setMarksheetQrDataUrl(null);
      return;
    }
    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.ehrjmadrasha.com";
    const verifyCode =
      selectedStudentMarksheet.savedResult?.verificationCode ||
      `VER-${selectedStudentMarksheet.studentIdNumber}-${selectedExamId?.slice(-4) || "2026"}`;
    const verifyUrl = `${appUrl}/verify/result/${encodeURIComponent(verifyCode)}`;

    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: { dark: "#063320", light: "#FFFFFF" },
    })
      .then((url) => setMarksheetQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [selectedStudentMarksheet, selectedExamId]);

  // Candidates with Computed Ranks
  const candidatesWithRanks = useMemo(() => {
    if (!resultsData?.candidates) return [];
    const list = [...resultsData.candidates];
    // Sort passed students descending by totalObtained
    const passed = list.filter((c: any) => c.calculated?.isPassed);
    passed.sort(
      (a: any, b: any) =>
        (b.calculated?.totalObtained || 0) - (a.calculated?.totalObtained || 0)
    );

    const rankMap = new Map<string, number>();
    passed.forEach((c: any, index: number) => {
      rankMap.set(c.studentId, index + 1);
    });

    return list.map((c: any) => ({
      ...c,
      rank: rankMap.get(c.studentId) || null,
    }));
  }, [resultsData]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return candidatesWithRanks;
    const term = searchTerm.toLowerCase().trim();
    return candidatesWithRanks.filter(
      (c: any) =>
        c.fullNameBn?.toLowerCase().includes(term) ||
        c.studentIdNumber?.toLowerCase().includes(term) ||
        String(c.rollNumber).includes(term)
    );
  }, [candidatesWithRanks, searchTerm]);

  // Grade Statistics Breakdown
  const gradeDistribution = useMemo(() => {
    const counts = {
      mumtaz: 0, // A+
      jayyidJiddan: 0, // A
      jayyid: 0, // B
      maqbool: 0, // C
      rasib: 0, // F
    };

    candidatesWithRanks.forEach((c: any) => {
      const grade = c.calculated?.letterGrade;
      if (grade === "A+") counts.mumtaz++;
      else if (grade === "A") counts.jayyidJiddan++;
      else if (grade === "B") counts.jayyid++;
      else if (grade === "C") counts.maqbool++;
      else counts.rasib++;
    });

    return counts;
  }, [candidatesWithRanks]);

  // ===================== CRUD FOR EXAMS =====================
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          ...examForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowCreateExam(false);
        setExamForm({
          nameBn: "",
          nameEn: "",
          examTypeId: "",
          startDate: "",
          endDate: "",
          instructions: "",
          status: "DRAFT",
        });
        await loadExams();
      } else {
        setMessage({ text: data.error || "পরীক্ষা তৈরি করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    try {
      const res = await fetch(`/api/admin/exams/${editingExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: editingExam.nameBn,
          nameEn: editingExam.nameEn,
          examTypeId: editingExam.examTypeId || null,
          startDate: editingExam.startDate ? new Date(editingExam.startDate).toISOString() : undefined,
          endDate: editingExam.endDate ? new Date(editingExam.endDate).toISOString() : undefined,
          instructions: editingExam.instructions,
          status: editingExam.status,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setEditingExam(null);
        await loadExams();
      } else {
        setMessage({ text: data.error || "আপডেট ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleUpdateExamStatus = async (examId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `পরীক্ষার স্ট্যাটাস পরিবর্তিত হয়েছে: ${newStatus}`, type: "success" });
        await loadExams();
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDeleteExam = async (examId: string, nameBn: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${nameBn}" পরীক্ষাটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await loadExams();
      } else {
        setMessage({ text: data.error || "পরীক্ষা মোছা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // ===================== CRUD FOR EXAM TYPES =====================
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/exams/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowCreateType(false);
        setTypeForm({ code: "", nameBn: "", nameEn: "", sortOrder: 0 });
        const resTypes = await fetch("/api/admin/exams/types").then((r) => r.json());
        if (resTypes.examTypes) setExamTypes(resTypes.examTypes);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    try {
      const res = await fetch("/api/admin/exams/types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingType.id,
          nameBn: editingType.nameBn,
          nameEn: editingType.nameEn,
          sortOrder: Number(editingType.sortOrder) || 0,
          isActive: Boolean(editingType.isActive),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setEditingType(null);
        const resTypes = await fetch("/api/admin/exams/types").then((r) => r.json());
        if (resTypes.examTypes) setExamTypes(resTypes.examTypes);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDeleteType = async (typeId: string, nameBn: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${nameBn}" ধরনটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/exams/types?id=${typeId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        const resTypes = await fetch("/api/admin/exams/types").then((r) => r.json());
        if (resTypes.examTypes) setExamTypes(resTypes.examTypes);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // ===================== CRUD FOR SUBJECTS =====================
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subjectForm,
          classId: subjectForm.classId || selectedClassId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowCreateSubject(false);
        setSubjectForm({
          classId: "",
          nameBn: "",
          nameEn: "",
          nameAr: "",
          code: "",
          fullMarks: 100,
          passMarks: 33,
          isOptional: false,
          sortOrder: 0,
        });
        await loadSubjects(selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSubject.id,
          nameBn: editingSubject.nameBn,
          nameEn: editingSubject.nameEn,
          fullMarks: Number(editingSubject.fullMarks),
          passMarks: Number(editingSubject.passMarks),
          isOptional: Boolean(editingSubject.isOptional),
          sortOrder: Number(editingSubject.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setEditingSubject(null);
        await loadSubjects(selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDeleteSubject = async (subjectId: string, nameBn: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${nameBn}" বিষয়টি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/subjects?id=${subjectId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await loadSubjects(selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // ===================== CRUD FOR ROUTINES =====================
  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/routine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...routineForm,
          classId: routineForm.classId || selectedClassId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowAddRoutine(false);
        setRoutineForm({
          classId: "",
          sectionId: "",
          subjectId: "",
          examDate: "",
          startTime: "09:30 AM",
          endTime: "12:30 PM",
          roomNo: "",
          instructions: "",
        });
        await loadRoutines(selectedExamId, routineClassFilter);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleUpdateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoutine) return;
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/routine`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: editingRoutine.id,
          examDate: editingRoutine.examDate,
          startTime: editingRoutine.startTime,
          endTime: editingRoutine.endTime,
          roomNo: editingRoutine.roomNo,
          instructions: editingRoutine.instructions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setEditingRoutine(null);
        await loadRoutines(selectedExamId, routineClassFilter);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই রুটিন এন্ট্রিটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(
        `/api/admin/exams/${selectedExamId}/routine?routineId=${routineId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await loadRoutines(selectedExamId, routineClassFilter);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Publish Results
  const handlePublishResults = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই পরীক্ষার ফলাফল সিলমোহর ও প্রকাশ করতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/results/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExamId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await loadResultsReview(selectedExamId, selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Save Marks Correction
  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/results/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: correctingCandidate.studentId,
          subjectId: correctionForm.subjectId,
          newMarks: correctionForm.newMarks,
          isAbsent: correctionForm.isAbsent,
          isExempt: correctionForm.isExempt,
          correctionReason: correctionForm.correctionReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setCorrectingCandidate(null);
        setCorrectionForm({
          subjectId: "",
          newMarks: "",
          isAbsent: false,
          isExempt: false,
          correctionReason: "",
        });
        await loadResultsReview(selectedExamId, selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // CSV Export for Tabulation Register
  const exportTabulationToCSV = () => {
    if (!resultsData || !candidatesWithRanks.length) return;
    const subHeaders = (resultsData.subjects || []).map((s: any) => `"${s.nameBn} (${s.fullMarks})"`).join(",");
    const headerRow = `"মেধাক্রম","রোল","শিক্ষার্থীর নাম","শিক্ষার্থী আইডি","জামাত",${subHeaders},"মোট প্রাপ্ত","মোট পূর্ণমান","শতকরা","ইসলামিক মান","লেটার গ্রেড","ফলাফল"\n`;

    const rows = candidatesWithRanks.map((c: any) => {
      const subMarks = (resultsData.subjects || []).map((s: any) => {
        const subRes = c.calculated?.subjects?.find((sub: any) => sub.subjectId === s.id);
        if (!subRes) return '"—"';
        if (subRes.isAbsent) return '"অনুপস্থিত"';
        if (subRes.isExempt) return '"অব্যাহতি"';
        return `"${subRes.marksObtained}"`;
      }).join(",");

      return `"${c.rank ? c.rank : "—"}","${c.rollNumber}","${c.fullNameBn}","${c.studentIdNumber}","${c.classNameBn}",${subMarks},"${c.calculated?.totalObtained || 0}","${c.calculated?.totalFullMarks || 0}","${c.calculated?.percentage || 0}%","${c.calculated?.finalGradeBn || ""}","${c.calculated?.letterGrade || ""}","${c.calculated?.isPassed ? "পাস" : "ফেল"}"`;
    }).join("\n");

    const csvContent = "\uFEFF" + headerRow + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const examName = selectedExamObj?.nameBn || "Exam";
    const className = selectedClassObj?.nameBn || "AllClasses";
    link.setAttribute("download", `Tabulation_${examName}_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedExamObj = exams.find((e) => e.id === selectedExamId);
  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Cockpit Top Header Banner */}
      <div className="bg-gradient-to-r from-[#052216] via-[#0D5C3A] to-[#083823] text-white p-6 rounded-2xl shadow-md border border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg">
              <Award className="w-4 h-4 fill-amber-300 text-amber-300" />
            </span>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              একাডেমিক পরীক্ষা, স্বয়ংক্রিয় গ্রেডিং ও ফলাফল হাব
            </span>
          </div>
          <h2 className="text-xl font-black font-display text-white">
            পরীক্ষা, টেবুলেশন রেজিস্টার ও প্রগ্রেসিভ মার্কশিট ইঞ্জিন
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            টার্ম ও বার্ষিক পরীক্ষা ব্যবস্থাপনা, বিষয়ভিত্তিক নম্বর নিরীক্ষা, ইসলামিক গ্রেডিং মানদণ্ড, পূর্ণাঙ্গ টেবুলেশন শিট এবং ডিজিটাল কিউআর মার্কশিট জেনারেশন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              loadInitialData();
              if (activeSubTab === "ROUTINE" && selectedExamId) loadRoutines(selectedExamId, routineClassFilter);
              if (
                (activeSubTab === "RESULTS" || activeSubTab === "TABULATION") &&
                selectedExamId
              )
                loadResultsReview(selectedExamId, selectedClassId);
            }}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2 rounded-xl text-xs transition border border-white/10 flex items-center gap-1.5"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold text-sm text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        {[
          { id: "EXAMS", label: "পরীক্ষা ব্যবস্থাপনা", count: exams.length },
          { id: "TABULATION", label: "টেবুলেশন শিট ও মেধা তালিকা" },
          { id: "RESULTS", label: "ফলাফল ও মার্কশিট জেনারেটর" },
          { id: "ROUTINE", label: "পরীক্ষার রুটিন", count: routines.length },
          { id: "SUBJECTS", label: "বিষয় ও পূর্ণমান", count: subjects.length },
          { id: "TYPES", label: "পরীক্ষার ধরন (Types)", count: examTypes.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveSubTab(t.id as any);
              if (t.id === "ROUTINE" && selectedExamId) loadRoutines(selectedExamId, routineClassFilter);
              if (
                (t.id === "RESULTS" || t.id === "TABULATION") &&
                selectedExamId
              ) {
                loadResultsReview(selectedExamId, selectedClassId);
              }
            }}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeSubTab === t.id
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeSubTab === t.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. TABULATION SHEET TAB                                    */}
      {/* ========================================================= */}
      {activeSubTab === "TABULATION" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">পরীক্ষা:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    loadResultsReview(e.target.value, selectedClassId);
                  }}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">জামাত / শ্রেণী:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    loadResultsReview(selectedExamId, e.target.value);
                  }}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  <option value="">সকল জামাত</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="রোল, নাম বা আইডি..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportTabulationToCSV}
                disabled={!resultsData || filteredCandidates.length === 0}
                className="bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                title="এক্সেলে এক্সপোর্ট করুন"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>CSV / এক্সেল</span>
              </button>

              <button
                onClick={() => setShowBatchMarksheetsPrint(true)}
                disabled={!resultsData || filteredCandidates.length === 0}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                title="এক ক্লিকে সকল শিক্ষার্থীর মার্কশিট প্রিন্ট করুন"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>সকল মার্কশিট প্রিন্ট</span>
              </button>

              <button
                onClick={() => setShowTabulationPrint(true)}
                disabled={!resultsData || filteredCandidates.length === 0}
                className="bg-[#0D5C3A] hover:bg-emerald-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>টেবুলেশন রেজিস্টার প্রিন্ট</span>
              </button>
            </div>
          </div>

          {loadingResults ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">টেবুলেশন শিট ও ফলাফল ডাটা তৈরি হচ্ছে...</p>
            </div>
          ) : !resultsData ? (
            <div className="py-16 text-center text-slate-400">
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">কোনো পরীক্ষা নির্বাচন করা হয়নি।</p>
              <p className="text-[11px] text-slate-400 mt-1">উপরে পরীক্ষা ও জামাত নির্বাচন করুন।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistical Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 font-bold block">মোট পরীক্ষার্থী</span>
                  <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
                    {resultsData.summary.totalCandidates} জন
                  </span>
                </div>
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                  <span className="text-[11px] text-emerald-800 font-bold block">উত্তীর্ণ (Passed)</span>
                  <span className="text-lg font-black font-mono text-[#0D5C3A] mt-0.5 block">
                    {resultsData.summary.passedCount} জন
                  </span>
                </div>
                <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200 shadow-sm">
                  <span className="text-[11px] text-rose-800 font-bold block">অনুত্তীর্ণ (Failed)</span>
                  <span className="text-lg font-black font-mono text-rose-700 mt-0.5 block">
                    {resultsData.summary.failedCount} জন
                  </span>
                </div>
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 shadow-sm">
                  <span className="text-[11px] text-blue-800 font-bold block">পাসের হার (Pass Rate)</span>
                  <span className="text-lg font-black font-mono text-blue-900 mt-0.5 block">
                    {resultsData.summary.totalCandidates > 0
                      ? (
                          (resultsData.summary.passedCount /
                            resultsData.summary.totalCandidates) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
                  <span className="text-[11px] text-amber-800 font-bold block">মুমতাজ (A+ গ্রেড)</span>
                  <span className="text-lg font-black font-mono text-amber-900 mt-0.5 block">
                    {gradeDistribution.mumtaz} জন
                  </span>
                </div>
                <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-200 shadow-sm">
                  <span className="text-[11px] text-teal-800 font-bold block">জায়্যিদ জিদ্দান (A)</span>
                  <span className="text-lg font-black font-mono text-teal-900 mt-0.5 block">
                    {gradeDistribution.jayyidJiddan} জন
                  </span>
                </div>
              </div>

              {/* Comprehensive Tabulation Grid */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm bg-white">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#052216] text-white font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 text-center w-12">মেধাক্রম</th>
                      <th className="p-3 text-center w-12">রোল</th>
                      <th className="p-3 min-w-[160px]">শিক্ষার্থীর নাম ও আইডি</th>
                      <th className="p-3">জামাত</th>
                      {/* Dynamic Subject Columns */}
                      {resultsData.subjects?.map((sub: any) => (
                        <th key={sub.id} className="p-3 text-center border-l border-emerald-800">
                          <div>{sub.nameBn}</div>
                          <div className="text-[9px] text-emerald-300 font-mono font-normal">
                            পূর্ণমান: {sub.fullMarks}
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-right border-l border-emerald-800">মোট প্রাপ্ত</th>
                      <th className="p-3 text-center">শতকরা</th>
                      <th className="p-3 text-center">ইসলামিক মান</th>
                      <th className="p-3 text-center">ফলাফল</th>
                      <th className="p-3 text-right">মার্কশিট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10 + (resultsData.subjects?.length || 0)}
                          className="py-12 text-center text-slate-400"
                        >
                          কোনো শিক্ষার্থীর ফলাফল পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c: any) => (
                        <tr key={c.studentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center">
                            {c.rank ? (
                              <span className="bg-amber-100 text-amber-900 font-black font-mono text-xs px-2 py-0.5 rounded-full">
                                #{c.rank}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {c.rollNumber}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{c.fullNameBn}</div>
                            <div className="font-mono text-[10px] text-slate-400">{c.studentIdNumber}</div>
                          </td>
                          <td className="p-3 text-slate-700">{c.classNameBn}</td>

                          {/* Dynamic Subject Marks */}
                          {resultsData.subjects?.map((sub: any) => {
                            const subRes = c.calculated?.subjects?.find(
                              (s: any) => s.subjectId === sub.id
                            );
                            return (
                              <td
                                key={sub.id}
                                className="p-3 text-center border-l border-slate-100 font-mono"
                              >
                                {subRes ? (
                                  subRes.isAbsent ? (
                                    <span className="text-red-500 font-bold text-[10px]">অনুপস্থিত</span>
                                  ) : subRes.isExempt ? (
                                    <span className="text-amber-600 font-bold text-[10px]">অব্যাহতি</span>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <span
                                        className={`font-black ${
                                          subRes.isPassed ? "text-[#0D5C3A]" : "text-rose-600"
                                        }`}
                                      >
                                        {subRes.marksObtained}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-bold">
                                        ({subRes.letterGrade})
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="p-3 text-right font-mono font-black text-slate-900 border-l border-slate-100">
                            {c.calculated?.totalObtained} / {c.calculated?.totalFullMarks}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {c.calculated?.percentage}%
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-emerald-900 font-bold text-[11px]">
                              {c.calculated?.finalGradeBn}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                c.calculated?.isPassed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {c.calculated?.isPassed ? "উত্তীর্ণ (PASS)" : "অনুত্তীর্ণ (FAIL)"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedStudentMarksheet(c)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] font-bold px-2.5 py-1 rounded-lg text-[11px] transition border border-emerald-200 inline-flex items-center gap-1 shadow-sm"
                              title="প্রগ্রেসিভ মার্কশিট দেখুন ও প্রিন্ট করুন"
                            >
                              <Award className="w-3 h-3 text-[#0D5C3A]" />
                              <span>মার্কশিট</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. RESULTS & MARKSHEET GENERATOR TAB                     */}
      {/* ========================================================= */}
      {activeSubTab === "RESULTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">পরীক্ষা:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    loadResultsReview(e.target.value, selectedClassId);
                  }}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">জামাত:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    loadResultsReview(selectedExamId, e.target.value);
                  }}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  <option value="">সকল জামাত</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="রোল, নাম বা আইডি..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>
            </div>

            <button
              onClick={handlePublishResults}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 self-start sm:self-auto transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>ফলাফল সিলমোহর ও প্রকাশ করুন</span>
            </button>
          </div>

          {loadingResults ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">ফলাফল ও মার্কশিট ডাটা লোড হচ্ছে...</p>
            </div>
          ) : !resultsData ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-xs font-semibold text-slate-600">পরীক্ষা নির্বাচন করে ফলাফল নিরীক্ষা করুন।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-600">
                  <span className="text-slate-500 block font-bold text-[11px]">মোট পরীক্ষার্থী</span>
                  <span className="font-black text-lg text-slate-900 mt-1 block">
                    {resultsData.summary.totalCandidates} জন
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
                  <span className="text-slate-500 block font-bold text-[11px]">কৃতকার্য (Passed)</span>
                  <span className="font-black text-lg text-emerald-700 mt-1 block">
                    {resultsData.summary.passedCount} জন
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-600">
                  <span className="text-slate-500 block font-bold text-[11px]">অকৃতকার্য (Failed)</span>
                  <span className="font-black text-lg text-rose-700 mt-1 block">
                    {resultsData.summary.failedCount} জন
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                  <span className="text-slate-500 block font-bold text-[11px]">অসম্পূর্ণ / পেন্ডিং</span>
                  <span className="font-black text-lg text-amber-700 mt-1 block">
                    {resultsData.summary.pendingCount} জন
                  </span>
                </div>
              </div>

              {/* Candidate Results Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto text-xs bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-3 text-center">মেধা</th>
                      <th className="p-3 text-center">রোল</th>
                      <th className="p-3">আইডি ও নাম</th>
                      <th className="p-3">জামাত</th>
                      <th className="p-3 text-right">মোট প্রাপ্ত</th>
                      <th className="p-3 text-center">শতকরা</th>
                      <th className="p-3 text-center">ইসলামিক গ্রেড</th>
                      <th className="p-3 text-center">ফলাফল</th>
                      <th className="p-3 text-center">ভেরিফিকেশন কোড</th>
                      <th className="p-3 text-right">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((c: any) => (
                      <tr key={c.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center">
                          {c.rank ? (
                            <span className="bg-amber-100 text-amber-900 font-black font-mono text-[11px] px-2 py-0.5 rounded-full">
                              #{c.rank}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {c.rollNumber}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{c.fullNameBn}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.studentIdNumber}</p>
                        </td>
                        <td className="p-3 text-slate-700">{c.classNameBn}</td>
                        <td className="p-3 text-right font-mono font-black text-[#0D5C3A]">
                          {c.calculated?.totalObtained} / {c.calculated?.totalFullMarks}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">{c.calculated?.percentage}%</td>
                        <td className="p-3 text-center font-bold text-emerald-900">
                          {c.calculated?.finalGradeBn}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.calculated?.isPassed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {c.calculated?.isPassed ? "পাস (PASS)" : "ফেল (FAIL)"}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                          {c.savedResult?.verificationCode || "—"}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedStudentMarksheet(c)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-200 transition inline-flex items-center gap-1"
                            title="অফিসিয়াল মার্কশিট দেখুন ও প্রিন্ট করুন"
                          >
                            <Award className="w-3 h-3" />
                            <span>মার্কশিট</span>
                          </button>
                          <button
                            onClick={() => {
                              setCorrectingCandidate(c);
                              if (resultsData.subjects && resultsData.subjects.length > 0) {
                                setCorrectionForm({
                                  ...correctionForm,
                                  subjectId: resultsData.subjects[0].id,
                                });
                              }
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                          >
                            নম্বর সংশোধন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Correction Modal */}
          {correctingCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-100">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#083B25]">অ্যাডমিন নম্বর সংশোধন</h3>
                    <p className="text-slate-500 mt-0.5">
                      শিক্ষার্থী: <strong>{correctingCandidate.fullNameBn}</strong> (রোল: {correctingCandidate.rollNumber})
                    </p>
                  </div>
                  <button
                    onClick={() => setCorrectingCandidate(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCorrection} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">বিষয় নির্বাচন *</label>
                    <select
                      value={correctionForm.subjectId}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, subjectId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                      required
                    >
                      {resultsData?.subjects?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.nameBn} ({s.code}) - পূর্ণমান {s.fullMarks}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সংশোধিত নম্বর *</label>
                    <input
                      type="number"
                      value={correctionForm.newMarks}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, newMarks: e.target.value })}
                      placeholder="সংশোধিত প্রাপ্ত নম্বর"
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={correctionForm.isAbsent}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, isAbsent: e.target.checked })}
                      />
                      <span>অনুপস্থিত (Absent)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={correctionForm.isExempt}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, isExempt: e.target.checked })}
                      />
                      <span>অব্যাহতি (Exempt)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      সংশোধনের অডিট কারণ (Mandatory Reason) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={correctionForm.correctionReason}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
                      placeholder="খাতা পুনঃনিরীক্ষা বা উস্তাদের আবেদন অনুযায়ী..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCorrectingCandidate(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold hover:bg-emerald-800 transition"
                    >
                      পুনর্গণনা ও অডিট সেভ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EXAMS TAB                                              */}
      {/* ========================================================= */}
      {activeSubTab === "EXAMS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">শিক্ষাবর্ষ ফিল্টার:</label>
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  loadExams(e.target.value);
                }}
                className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
              >
                <option value="">সকল শিক্ষাবর্ষ</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {(s.isCurrent || s.status === "ACTIVE" || s.isActive) && "(বর্তমান)"}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateExam(!showCreateExam)}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন পরীক্ষা তৈরি</span>
            </button>
          </div>

          {showCreateExam && (
            <form
              onSubmit={handleCreateExam}
              className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-4 text-xs"
            >
              <h4 className="font-bold text-[#083B25] text-sm">নতুন পরীক্ষার বিবরণ</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পরীক্ষার নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ১ম সাময়িক পরীক্ষা ২০২৬"
                    value={examForm.nameBn}
                    onChange={(e) => setExamForm({ ...examForm, nameBn: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পরীক্ষার নাম (ইংরেজি) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Term Examination 2026"
                    value={examForm.nameEn}
                    onChange={(e) => setExamForm({ ...examForm, nameEn: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পরীক্ষার ধরন (Type) *</label>
                  <select
                    value={examForm.examTypeId}
                    onChange={(e) => setExamForm({ ...examForm, examTypeId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                    required
                  >
                    <option value="">ধরন নির্বাচন করুন</option>
                    {examTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameBn} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">শেষের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রাথমিক স্ট্যাটাস</label>
                  <select
                    value={examForm.status}
                    onChange={(e) => setExamForm({ ...examForm, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value="DRAFT">খসড়া (DRAFT)</option>
                    <option value="UPCOMING">আসন্ন (UPCOMING)</option>
                    <option value="RUNNING">চলমান (RUNNING)</option>
                    <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">বিশেষ নির্দেশনা</label>
                <input
                  type="text"
                  placeholder="যেমন: সকল পরীক্ষার্থীকে সকাল ৯:০০ টায় উপস্থিত হতে হবে..."
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={() => setShowCreateExam(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D5C3A] text-white rounded-xl font-bold shadow-sm hover:bg-emerald-800 transition"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* Edit Exam Modal */}
          {editingExam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-100">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#083B25]">পরীক্ষার বিবরণ সম্পাদনা</h3>
                  <button onClick={() => setEditingExam(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateExam} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">পরীক্ষার নাম (বাংলা) *</label>
                    <input
                      type="text"
                      required
                      value={editingExam.nameBn}
                      onChange={(e) => setEditingExam({ ...editingExam, nameBn: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">পরীক্ষার নাম (ইংরেজি) *</label>
                    <input
                      type="text"
                      required
                      value={editingExam.nameEn}
                      onChange={(e) => setEditingExam({ ...editingExam, nameEn: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">শুরুর তারিখ</label>
                      <input
                        type="date"
                        value={editingExam.startDate ? editingExam.startDate.slice(0, 10) : ""}
                        onChange={(e) => setEditingExam({ ...editingExam, startDate: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">শেষের তারিখ</label>
                      <input
                        type="date"
                        value={editingExam.endDate ? editingExam.endDate.slice(0, 10) : ""}
                        onChange={(e) => setEditingExam({ ...editingExam, endDate: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">স্ট্যাটাস</label>
                    <select
                      value={editingExam.status}
                      onChange={(e) => setEditingExam({ ...editingExam, status: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="DRAFT">খসড়া (DRAFT)</option>
                      <option value="UPCOMING">আসন্ন (UPCOMING)</option>
                      <option value="RUNNING">চলমান (RUNNING)</option>
                      <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
                      <option value="PUBLISHED">প্রকাশিত (PUBLISHED)</option>
                      <option value="ARCHIVED">আর্কাইভ (ARCHIVED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">নির্দেশনা</label>
                    <input
                      type="text"
                      value={editingExam.instructions || ""}
                      onChange={(e) => setEditingExam({ ...editingExam, instructions: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingExam(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold hover:bg-emerald-800 transition"
                    >
                      আপডেট সেভ করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                <tr>
                  <th className="p-3">পরীক্ষার নাম</th>
                  <th className="p-3">শিক্ষাবর্ষ</th>
                  <th className="p-3">তারিখ পরিসীমা</th>
                  <th className="p-3">স্ট্যাটাস নির্বাচন</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{ex.nameBn}</div>
                      <div className="text-[10px] text-slate-400">{ex.nameEn}</div>
                    </td>
                    <td className="p-3 font-semibold">{ex.session?.name}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(ex.startDate).toLocaleDateString("bn-BD")} -{" "}
                      {new Date(ex.endDate).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-3">
                      <select
                        value={ex.status}
                        onChange={(e) => handleUpdateExamStatus(ex.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          ex.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : ex.status === "RUNNING"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : ex.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        <option value="DRAFT">খসড়া (DRAFT)</option>
                        <option value="UPCOMING">আসন্ন (UPCOMING)</option>
                        <option value="RUNNING">চলমান (RUNNING)</option>
                        <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
                        <option value="PUBLISHED">প্রকাশিত (PUBLISHED)</option>
                        <option value="ARCHIVED">আর্কাইভ (ARCHIVED)</option>
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedExamId(ex.id);
                          setActiveSubTab("TABULATION");
                          loadResultsReview(ex.id, selectedClassId);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-200"
                      >
                        টেবুলেশন
                      </button>
                      <button
                        onClick={() => {
                          setSelectedExamId(ex.id);
                          setActiveSubTab("RESULTS");
                          loadResultsReview(ex.id, selectedClassId);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-200"
                      >
                        ফলাফল
                      </button>
                      <button
                        onClick={() => setEditingExam(ex)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-block align-middle"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(ex.id, ex.nameBn)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg inline-block align-middle"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TYPES, SUBJECTS, ROUTINE TABS                         */}
      {/* ========================================================= */}
      {activeSubTab === "TYPES" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">মোট পরীক্ষার ধরন: {examTypes.length} টি</span>
            <button
              onClick={() => setShowCreateType(!showCreateType)}
              className="bg-[#0D5C3A] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন ধরন যুক্ত করুন</span>
            </button>
          </div>

          {showCreateType && (
            <form onSubmit={handleCreateType} className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-[#083B25]">পরীক্ষার ধরন তথ্য</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="কোড (e.g. TERM_1)"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white font-mono uppercase"
                />
                <input
                  type="text"
                  required
                  placeholder="নাম (বাংলা, যেমন: ১ম সাময়িক)"
                  value={typeForm.nameBn}
                  onChange={(e) => setTypeForm({ ...typeForm, nameBn: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="নাম (ইংরেজি, e.g. 1st Term)"
                  value={typeForm.nameEn}
                  onChange={(e) => setTypeForm({ ...typeForm, nameEn: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateType(false)} className="px-3 py-1.5 border rounded-xl bg-white">
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold">
                  সংরক্ষণ
                </button>
              </div>
            </form>
          )}

          {/* Edit Type Modal */}
          {editingType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-100">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#083B25]">পরীক্ষার ধরন সম্পাদনা</h3>
                  <button onClick={() => setEditingType(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateType} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">কোড</label>
                    <input
                      type="text"
                      disabled
                      value={editingType.code}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">নাম (বাংলা) *</label>
                    <input
                      type="text"
                      required
                      value={editingType.nameBn}
                      onChange={(e) => setEditingType({ ...editingType, nameBn: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">নাম (ইংরেজি) *</label>
                    <input
                      type="text"
                      required
                      value={editingType.nameEn}
                      onChange={(e) => setEditingType({ ...editingType, nameEn: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingType(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                <tr>
                  <th className="p-3">কোড</th>
                  <th className="p-3">নাম (বাংলা)</th>
                  <th className="p-3">নাম (ইংরেজি)</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">{t.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{t.nameBn}</td>
                    <td className="p-3 text-slate-500">{t.nameEn}</td>
                    <td className="p-3">
                      <span className="text-emerald-700 font-bold">সক্রিয়</span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => setEditingType(t)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-block align-middle"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(t.id, t.nameBn)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg inline-block align-middle"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">জামাত ফিল্টার:</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  loadSubjects(e.target.value);
                }}
                className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
              >
                <option value="">সকল জামাত</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateSubject(!showCreateSubject)}
              className="bg-[#0D5C3A] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন বিষয় এন্ট্রি</span>
            </button>
          </div>

          {showCreateSubject && (
            <form onSubmit={handleCreateSubject} className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-[#083B25]">নতুন পাঠ্য বিষয় এন্ট্রি</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="বিষয়ের নাম (বাংলা, যেমন: কুরআন মাজীদ)"
                  value={subjectForm.nameBn}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameBn: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="বিষয়ের নাম (ইংরেজি, e.g. Quran Majeed)"
                  value={subjectForm.nameEn}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="বিষয় কোড (e.g. QRN-101)"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white uppercase font-mono"
                />
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="পূর্ণমান (100)"
                  value={subjectForm.fullMarks}
                  onChange={(e) => setSubjectForm({ ...subjectForm, fullMarks: Number(e.target.value) })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="পাস মার্ক (33)"
                  value={subjectForm.passMarks}
                  onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: Number(e.target.value) })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <div className="flex items-center pt-2 gap-2">
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={subjectForm.isOptional}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isOptional: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0D5C3A]"
                  />
                  <label htmlFor="isOptional" className="font-bold text-slate-700">ঐচ্ছিক বিষয় (Optional)</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateSubject(false)} className="px-3 py-1.5 border rounded-xl bg-white">
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold">
                  সংরক্ষণ
                </button>
              </div>
            </form>
          )}

          {/* Edit Subject Modal */}
          {editingSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-100">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#083B25]">পাঠ্য বিষয় সম্পাদনা</h3>
                  <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateSubject} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">বিষয়ের নাম (বাংলা) *</label>
                    <input
                      type="text"
                      required
                      value={editingSubject.nameBn}
                      onChange={(e) => setEditingSubject({ ...editingSubject, nameBn: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">বিষয়ের নাম (ইংরেজি) *</label>
                    <input
                      type="text"
                      required
                      value={editingSubject.nameEn}
                      onChange={(e) => setEditingSubject({ ...editingSubject, nameEn: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পূর্ণমান *</label>
                      <input
                        type="number"
                        required
                        value={editingSubject.fullMarks}
                        onChange={(e) => setEditingSubject({ ...editingSubject, fullMarks: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পাস মার্ক *</label>
                      <input
                        type="number"
                        required
                        value={editingSubject.passMarks}
                        onChange={(e) => setEditingSubject({ ...editingSubject, passMarks: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editIsOptional"
                      checked={editingSubject.isOptional}
                      onChange={(e) => setEditingSubject({ ...editingSubject, isOptional: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0D5C3A]"
                    />
                    <label htmlFor="editIsOptional" className="font-bold text-slate-700">ঐচ্ছিক বিষয় (Optional)</label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingSubject(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold"
                    >
                      আপডেট
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                <tr>
                  <th className="p-3">বিষয় কোড</th>
                  <th className="p-3">বিষয়ের নাম</th>
                  <th className="p-3">জামাত</th>
                  <th className="p-3 text-center">পূর্ণমান</th>
                  <th className="p-3 text-center">পাস মার্ক</th>
                  <th className="p-3 text-center">ধরন</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">{sub.code}</td>
                    <td className="p-3 font-bold text-slate-900">
                      {sub.nameBn} <span className="text-slate-400 font-normal">({sub.nameEn})</span>
                    </td>
                    <td className="p-3">{sub.jamatClass?.nameBn}</td>
                    <td className="p-3 text-center font-mono font-bold">{sub.fullMarks}</td>
                    <td className="p-3 text-center font-mono text-emerald-800 font-bold">{sub.passMarks}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sub.isOptional ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                        {sub.isOptional ? "ঐচ্ছিক" : "আবশ্যিক"}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => setEditingSubject(sub)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-block align-middle"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.nameBn)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg inline-block align-middle"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "ROUTINE" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">পরীক্ষা:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    loadRoutines(e.target.value, routineClassFilter);
                  }}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">জামাত ফিল্টার:</label>
                <select
                  value={routineClassFilter}
                  onChange={(e) => {
                    setRoutineClassFilter(e.target.value);
                    loadRoutines(selectedExamId, e.target.value);
                  }}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="">সকল জামাত</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                রুটিন প্রিন্ট
              </button>
              <button
                onClick={() => setShowAddRoutine(!showAddRoutine)}
                className="bg-[#0D5C3A] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                রুটিন এন্ট্রি
              </button>
            </div>
          </div>

          {showAddRoutine && (
            <form onSubmit={handleAddRoutine} className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-[#083B25]">পরীক্ষার সময়সূচি ও রুটিন সংযোজন</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={routineForm.classId || selectedClassId}
                  onChange={(e) => {
                    setRoutineForm({ ...routineForm, classId: e.target.value });
                    loadSubjects(e.target.value);
                  }}
                  className="p-2.5 border rounded-xl bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameBn}</option>
                  ))}
                </select>
                <select
                  value={routineForm.subjectId}
                  onChange={(e) => setRoutineForm({ ...routineForm, subjectId: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                  required
                >
                  <option value="">বিষয় নির্বাচন করুন</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameBn} ({s.code})</option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={routineForm.examDate}
                  onChange={(e) => setRoutineForm({ ...routineForm, examDate: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="শুরুর সময় (e.g. 09:30 AM)"
                  value={routineForm.startTime}
                  onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="শেষের সময় (e.g. 12:30 PM)"
                  value={routineForm.endTime}
                  onChange={(e) => setRoutineForm({ ...routineForm, endTime: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
                <input
                  type="text"
                  placeholder="কক্ষ নম্বর (যেমন: ১০২)"
                  value={routineForm.roomNo}
                  onChange={(e) => setRoutineForm({ ...routineForm, roomNo: e.target.value })}
                  className="p-2.5 border rounded-xl bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddRoutine(false)} className="px-3 py-1.5 border rounded-xl bg-white">
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold">
                  রুটিনে অন্তর্ভুক্ত করুন
                </button>
              </div>
            </form>
          )}

          {/* Edit Routine Modal */}
          {editingRoutine && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-slate-100">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#083B25]">রুটিন সময়সূচি সম্পাদনা</h3>
                  <button onClick={() => setEditingRoutine(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateRoutine} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">তারিখ *</label>
                    <input
                      type="date"
                      required
                      value={editingRoutine.examDate ? editingRoutine.examDate.slice(0, 10) : ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, examDate: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">শুরুর সময় *</label>
                      <input
                        type="text"
                        required
                        value={editingRoutine.startTime}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, startTime: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">শেষের সময় *</label>
                      <input
                        type="text"
                        required
                        value={editingRoutine.endTime}
                        onChange={(e) => setEditingRoutine({ ...editingRoutine, endTime: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">কক্ষ নম্বর</label>
                    <input
                      type="text"
                      value={editingRoutine.roomNo || ""}
                      onChange={(e) => setEditingRoutine({ ...editingRoutine, roomNo: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingRoutine(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded-xl font-bold"
                    >
                      আপডেট সেভ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                <tr>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">সময়</th>
                  <th className="p-3">জামাত</th>
                  <th className="p-3">বিষয়</th>
                  <th className="p-3">পূর্ণমান</th>
                  <th className="p-3">কক্ষ</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routines.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{new Date(r.examDate).toLocaleDateString("bn-BD")}</td>
                    <td className="p-3 font-mono text-slate-700">{r.startTime} - {r.endTime}</td>
                    <td className="p-3">{r.jamatClass?.nameBn}</td>
                    <td className="p-3 font-bold text-[#0D5C3A]">{r.subject?.nameBn}</td>
                    <td className="p-3 font-mono">{r.subject?.fullMarks}</td>
                    <td className="p-3">{r.roomNo || "—"}</td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => setEditingRoutine(r)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-block align-middle"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoutine(r.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg inline-block align-middle"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: INDIVIDUAL OFFICIAL PROGRESSIVE MARKSHEET MODAL */}
      {/* ========================================================= */}
      {selectedStudentMarksheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Modal Control Bar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-[#0D5C3A] rounded-lg">
                  <Award className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  অফিসিয়াল একাডেমিক মার্কশিট ও গ্রেডকার্ড
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedStudentMarksheet.savedResult?.verificationCode && (
                  <a
                    href={`/verify/result/${encodeURIComponent(selectedStudentMarksheet.savedResult.verificationCode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>যাচাই পেজ</span>
                  </a>
                )}
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>মার্কশিট প্রিন্ট</span>
                </button>
                <button
                  onClick={() => setSelectedStudentMarksheet(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area: Institutional Academic Transcript */}
            <div className="p-6 sm:p-8 border-2 border-[#0D5C3A] rounded-2xl bg-[#FCFAF6] relative overflow-hidden mt-3 print:border-2 print:border-black print:m-0 print:p-6 print:rounded-none">
              {/* Islamic Header */}
              <div className="text-center pb-3 border-b-2 border-[#0D5C3A]/30">
                <p className="text-xs text-[#063320] font-serif mb-1 font-bold tracking-wider">
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-[#041F14] font-display">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-[11px] text-slate-700 font-medium">
                  {INSTITUTION_INFO.addressBn} • ফোন: {INSTITUTION_INFO.primaryPhone}
                </p>
                <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                  স্থাপিত: ২০২১ ইং (ESTD 2021) • ইসলামী শিক্ষা ও মানবকল্যাণ সংস্থা
                </p>
                <div className="inline-flex items-center gap-2 bg-[#0D5C3A] text-white text-[11px] font-bold px-4 py-0.5 rounded-full mt-2 shadow-sm">
                  <span>অফিসিয়াল নম্বরপত্র ও একাডেমিক ট্রান্সক্রিপ্ট (Academic Transcript)</span>
                </div>
              </div>

              {/* Exam & Session Ribbon */}
              <div className="py-2.5 text-center text-xs font-bold text-slate-800 border-b border-dashed border-slate-300">
                <span>{selectedExamObj?.nameBn || "একাডেমিক পরীক্ষা ২০২৬"}</span>
                <span className="mx-2">•</span>
                <span>শিক্ষাবর্ষ: {selectedExamObj?.session?.name || "২০২৬"}</span>
              </div>

              {/* Student Profile Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs py-3.5 border-b border-dashed border-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">শিক্ষার্থীর নাম:</span>
                  <span className="font-black text-slate-900 text-sm">{selectedStudentMarksheet.fullNameBn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">আইডি নম্বর:</span>
                  <span className="font-mono font-bold text-[#0D5C3A]">{selectedStudentMarksheet.studentIdNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">জামাত ও শাখা:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudentMarksheet.classNameBn} {selectedStudentMarksheet.sectionNameBn && `(${selectedStudentMarksheet.sectionNameBn})`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">রোল নম্বর:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{selectedStudentMarksheet.rollNumber}</span>
                </div>
              </div>

              {/* Subject-Wise Marks & Grading Table */}
              <div className="py-4">
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-[#0D5C3A] text-white font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5 text-center w-10">ক্রম</th>
                      <th className="p-2.5">পাঠ্য বিষয় (Subject)</th>
                      <th className="p-2.5 text-center">পূর্ণমান</th>
                      <th className="p-2.5 text-center">পাস মার্ক</th>
                      <th className="p-2.5 text-center">প্রাপ্ত নম্বর</th>
                      <th className="p-2.5 text-center">ইসলামিক মান</th>
                      <th className="p-2.5 text-center">লেটার গ্রেড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedStudentMarksheet.calculated?.subjects?.map((s: any, idx: number) => (
                      <tr key={s.subjectId} className="even:bg-slate-50/50">
                        <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">
                          {s.subjectNameBn}
                          {s.isOptional && <span className="text-[9px] text-amber-700 ml-1">(ঐচ্ছিক)</span>}
                        </td>
                        <td className="p-2 text-center font-mono">{s.fullMarks}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{s.passMarks}</td>
                        <td className="p-2 text-center font-mono font-black text-[#0D5C3A]">
                          {s.isAbsent ? (
                            <span className="text-red-600 text-[10px]">অনুপস্থিত</span>
                          ) : s.isExempt ? (
                            <span className="text-amber-600 text-[10px]">অব্যাহতি</span>
                          ) : (
                            s.marksObtained
                          )}
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-900">{s.gradeBn}</td>
                        <td className="p-2 text-center font-mono font-bold">{s.letterGrade}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-slate-800">সর্বমোট প্রাপ্ত নম্বর</td>
                      <td className="p-2.5 text-center font-mono">{selectedStudentMarksheet.calculated?.totalFullMarks}</td>
                      <td className="p-2.5 text-center font-mono">—</td>
                      <td className="p-2.5 text-center font-mono font-black text-[#0D5C3A] text-sm">
                        {selectedStudentMarksheet.calculated?.totalObtained}
                      </td>
                      <td colSpan={2} className="p-2.5 text-center font-mono">
                        শতকরা: {selectedStudentMarksheet.calculated?.percentage}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Result Summary & Islamic Grading Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {/* Result Box */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 font-bold">চূড়ান্ত ইসলামিক মান:</span>
                    <strong className="text-sm text-[#0D5C3A] font-black">
                      {selectedStudentMarksheet.calculated?.finalGradeBn}
                    </strong>
                    <span className="bg-emerald-100 text-[#0D5C3A] font-mono font-bold text-xs px-2 py-0.5 rounded">
                      Grade: {selectedStudentMarksheet.calculated?.letterGrade}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 font-bold">ফলাফল:</span>
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                        selectedStudentMarksheet.calculated?.isPassed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {selectedStudentMarksheet.calculated?.isPassed ? "উত্তীর্ণ (PASSED)" : "অনুত্তীর্ণ (FAILED)"}
                    </span>
                    {selectedStudentMarksheet.rank && (
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-xs">
                        মেধাক্রম: #{selectedStudentMarksheet.rank}
                      </span>
                    )}
                  </div>

                  <div className="pt-1 text-[11px] text-slate-600 italic">
                    মন্তব্য:{" "}
                    {selectedStudentMarksheet.calculated?.letterGrade === "A+"
                      ? "মাশাআল্লাহ! অত্যন্ত প্রশংসনীয় ও চমৎকার ফলাফল। আল্লাহ এলেমে প্রভূত বরকত দান করুন।"
                      : selectedStudentMarksheet.calculated?.isPassed
                      ? "আলহামদুলিল্লাহ! নিয়মিত মেহনত অব্যাহত রেখে আরও এগিয়ে যাওয়ার তাওফিক কামনা করি।"
                      : "আল্লাহর ওপর ভরসা রেখে আরও গভীর একাগ্রতা ও নিয়মিত অনুশীলনের প্রয়োজন।"}
                  </div>
                </div>

                {/* QR Code Verification Block */}
                <div className="sm:col-span-1 flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  {marksheetQrDataUrl ? (
                    <img
                      src={marksheetQrDataUrl}
                      alt="Result Verification QR"
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 rounded-lg animate-pulse" />
                  )}
                  <span className="text-[9px] text-slate-600 font-bold mt-1 block">
                    ডিজিটাল যাচাই QR কোড
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {selectedStudentMarksheet.savedResult?.verificationCode || "EHRJ-VER-RESULT"}
                  </span>
                </div>
              </div>

              {/* Triple Signatures Pad */}
              <div className="pt-10 flex items-end justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">শ্রেণী শিক্ষক</span>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">পরীক্ষা নিয়ন্ত্রক</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-900 block">{INSTITUTION_INFO.principal}</span>
                  <span className="text-[9px] text-slate-500 block">মুহতামিম / অধ্যক্ষ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FULL TABULATION REGISTER PRINT VIEW              */}
      {/* ========================================================= */}
      {showTabulationPrint && resultsData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 my-8 print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Modal Control Bar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                অফিসিয়াল পরীক্ষা সারণী ও টেবুলেশন রেজিস্টার (Tabulation Register)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>রেজিস্টার প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={() => setShowTabulationPrint(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-6 border-2 border-[#0D5C3A] rounded-2xl bg-white mt-3 print:border-none print:p-0">
              {/* Header */}
              <div className="text-center pb-3 border-b-2 border-[#0D5C3A]">
                <p className="text-xs text-[#063320] font-serif mb-1 font-bold">
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
                <h1 className="text-xl font-black text-[#041F14] font-display">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-[11px] text-slate-700 font-medium">
                  {INSTITUTION_INFO.addressBn} • প্রতিষ্ঠিত: ২০২১ ইং (ESTD 2021)
                </p>
                <div className="inline-block bg-[#0D5C3A] text-white text-[11px] font-bold px-4 py-0.5 rounded-full mt-2">
                  অফিসিয়াল পরীক্ষা ফলাফল সারণী ও টেবুলেশন রেজিস্টার (Tabulation Register)
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap justify-between items-center text-xs py-3 border-b border-slate-200 gap-2">
                <div>
                  <strong>পরীক্ষা:</strong> {selectedExamObj?.nameBn || "একাডেমিক পরীক্ষা"}
                </div>
                <div>
                  <strong>জামাত / শ্রেণী:</strong> {selectedClassObj?.nameBn || "সকল জামাত"}
                </div>
                <div>
                  <strong>শিক্ষাবর্ষ:</strong> {selectedExamObj?.session?.name || "২০২৬"}
                </div>
                <div>
                  <strong>তারিখ:</strong> {new Date().toLocaleDateString("bn-BD")}
                </div>
              </div>

              {/* Grade Distribution Bar in Print View */}
              <div className="grid grid-cols-6 gap-2 text-center text-xs py-2 bg-slate-50 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block">মোট পরীক্ষার্থী</span>
                  <span className="font-bold text-slate-900">{resultsData.summary.totalCandidates}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 block">মুমতাজ (A+)</span>
                  <span className="font-bold text-[#0D5C3A]">{gradeDistribution.mumtaz}</span>
                </div>
                <div>
                  <span className="text-[10px] text-teal-800 block">জায়্যিদ জিদ্দান (A)</span>
                  <span className="font-bold text-teal-900">{gradeDistribution.jayyidJiddan}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 block">জায়্যিদ (B)</span>
                  <span className="font-bold text-slate-900">{gradeDistribution.jayyid}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 block">মাকবুল (C)</span>
                  <span className="font-bold text-slate-900">{gradeDistribution.maqbool}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-800 block">রাসিব (F)</span>
                  <span className="font-bold text-rose-700">{gradeDistribution.rasib}</span>
                </div>
              </div>

              {/* Full Tabulation Table */}
              <div className="py-4 overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-[#052216] text-white font-bold text-[10px]">
                    <tr>
                      <th className="p-2 text-center w-8">মেধা</th>
                      <th className="p-2 text-center w-8">রোল</th>
                      <th className="p-2">শিক্ষার্থীর নাম</th>
                      <th className="p-2 font-mono">আইডি</th>
                      {resultsData.subjects?.map((sub: any) => (
                        <th key={sub.id} className="p-2 text-center border-l border-emerald-800">
                          {sub.nameBn}
                        </th>
                      ))}
                      <th className="p-2 text-right border-l border-emerald-800">মোট প্রাপ্ত</th>
                      <th className="p-2 text-center">শতকরা</th>
                      <th className="p-2 text-center">মান</th>
                      <th className="p-2 text-center">ফলাফল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {candidatesWithRanks.map((c: any) => (
                      <tr key={c.studentId} className="even:bg-slate-50/50">
                        <td className="p-2 text-center font-mono font-bold">
                          {c.rank ? `#${c.rank}` : "—"}
                        </td>
                        <td className="p-2 text-center font-mono font-bold">{c.rollNumber}</td>
                        <td className="p-2 font-bold text-slate-900">{c.fullNameBn}</td>
                        <td className="p-2 font-mono text-[10px] text-slate-500">{c.studentIdNumber}</td>

                        {resultsData.subjects?.map((sub: any) => {
                          const subRes = c.calculated?.subjects?.find(
                            (s: any) => s.subjectId === sub.id
                          );
                          return (
                            <td key={sub.id} className="p-2 text-center border-l border-slate-100 font-mono">
                              {subRes ? (
                                subRes.isAbsent ? (
                                  <span className="text-red-500 font-bold text-[9px]">অনুপস্থিত</span>
                                ) : subRes.isExempt ? (
                                  <span className="text-amber-600 font-bold text-[9px]">অব্যাহতি</span>
                                ) : (
                                  `${subRes.marksObtained} (${subRes.letterGrade})`
                                )
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}

                        <td className="p-2 text-right font-mono font-bold text-[#0D5C3A] border-l border-slate-100">
                          {c.calculated?.totalObtained}
                        </td>
                        <td className="p-2 text-center font-mono">{c.calculated?.percentage}%</td>
                        <td className="p-2 text-center font-bold text-emerald-900">{c.calculated?.letterGrade}</td>
                        <td className="p-2 text-center font-bold">
                          {c.calculated?.isPassed ? "পাস" : "ফেল"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tabulation Signatures */}
              <div className="pt-12 flex items-end justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">নিরীক্ষক / টেবুলেটর</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">প্রধান নিরীক্ষক</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">পরীক্ষা নিয়ন্ত্রক</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-900 block">{INSTITUTION_INFO.principal}</span>
                  <span className="text-[9px] text-slate-500 block">মুহতামিম / অধ্যক্ষ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: BATCH MARKSHEETS PRINT VIEW (BATCH TRANSCRIPTS)  */}
      {/* ========================================================= */}
      {showBatchMarksheetsPrint && resultsData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Modal Control Bar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                ব্যাচ মার্কশিট প্রিন্ট প্রিভিউ (মোট {filteredCandidates.length} জন শিক্ষার্থী)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>সকল মার্কশিট প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={() => setShowBatchMarksheetsPrint(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Batch Marksheet Pages */}
            <div className="space-y-8 mt-3 print:space-y-0">
              {filteredCandidates.map((cand: any, idx: number) => (
                <div
                  key={cand.studentId}
                  className="p-6 border-2 border-[#0D5C3A] rounded-2xl bg-[#FCFAF6] print:border-2 print:border-black print:p-6 print:rounded-none print:break-after-page"
                >
                  {/* Header */}
                  <div className="text-center pb-2 border-b-2 border-[#0D5C3A]/30">
                    <p className="text-xs text-[#063320] font-serif mb-1 font-bold tracking-wider">
                      بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                    </p>
                    <h2 className="text-xl font-black text-[#041F14] font-display">
                      {INSTITUTION_INFO.nameBn}
                    </h2>
                    <p className="text-[11px] text-slate-700 font-medium">
                      {INSTITUTION_INFO.addressBn} • প্রতিষ্ঠিত: ২০২১ ইং (ESTD 2021)
                    </p>
                    <div className="inline-block bg-[#0D5C3A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full mt-1.5">
                      অফিসিয়াল একাডেমিক নম্বরপত্র ও ট্রান্সক্রিপ্ট
                    </div>
                  </div>

                  {/* Ribbon */}
                  <div className="py-2 text-center text-xs font-bold text-slate-800 border-b border-dashed border-slate-300">
                    <span>{selectedExamObj?.nameBn || "একাডেমিক পরীক্ষা ২০২৬"}</span>
                    <span className="mx-2">•</span>
                    <span>শিক্ষাবর্ষ: {selectedExamObj?.session?.name || "২০২৬"}</span>
                  </div>

                  {/* Student Grid */}
                  <div className="grid grid-cols-4 gap-2 text-xs py-2.5 border-b border-dashed border-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block">শিক্ষার্থীর নাম:</span>
                      <strong className="text-slate-900">{cand.fullNameBn}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">আইডি নম্বর:</span>
                      <strong className="font-mono text-[#0D5C3A]">{cand.studentIdNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">জামাত:</span>
                      <strong className="text-slate-800">{cand.classNameBn}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">রোল নম্বর:</span>
                      <strong className="font-mono text-slate-900">{cand.rollNumber}</strong>
                    </div>
                  </div>

                  {/* Subjects Table */}
                  <div className="py-3">
                    <table className="w-full text-xs text-left border border-slate-200">
                      <thead className="bg-[#0D5C3A] text-white font-bold text-[10px]">
                        <tr>
                          <th className="p-2 text-center w-8">ক্রম</th>
                          <th className="p-2">পাঠ্য বিষয়</th>
                          <th className="p-2 text-center">পূর্ণমান</th>
                          <th className="p-2 text-center">পাস মার্ক</th>
                          <th className="p-2 text-center">প্রাপ্ত নম্বর</th>
                          <th className="p-2 text-center">মান</th>
                          <th className="p-2 text-center">গ্রেড</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {cand.calculated?.subjects?.map((s: any, i: number) => (
                          <tr key={s.subjectId} className="even:bg-slate-50/50">
                            <td className="p-1.5 text-center font-mono text-slate-500">{i + 1}</td>
                            <td className="p-1.5 font-bold text-slate-900">{s.subjectNameBn}</td>
                            <td className="p-1.5 text-center font-mono">{s.fullMarks}</td>
                            <td className="p-1.5 text-center font-mono">{s.passMarks}</td>
                            <td className="p-1.5 text-center font-mono font-bold text-[#0D5C3A]">
                              {s.isAbsent ? "অনুপস্থিত" : s.isExempt ? "অব্যাহতি" : s.marksObtained}
                            </td>
                            <td className="p-1.5 text-center font-bold text-emerald-900">{s.gradeBn}</td>
                            <td className="p-1.5 text-center font-mono font-bold">{s.letterGrade}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                        <tr>
                          <td colSpan={2} className="p-2 text-slate-800">সর্বমোট প্রাপ্ত</td>
                          <td className="p-2 text-center font-mono">{cand.calculated?.totalFullMarks}</td>
                          <td className="p-2 text-center font-mono">—</td>
                          <td className="p-2 text-center font-mono font-black text-[#0D5C3A]">
                            {cand.calculated?.totalObtained}
                          </td>
                          <td colSpan={2} className="p-2 text-center font-mono">
                            শতকরা: {cand.calculated?.percentage}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Summary & Signatures */}
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span>চূড়ান্ত মান: </span>
                      <strong className="text-[#0D5C3A]">{cand.calculated?.finalGradeBn}</strong>
                      <span className="mx-2">•</span>
                      <span>গ্রেড: </span>
                      <strong>{cand.calculated?.letterGrade}</strong>
                      <span className="mx-2">•</span>
                      <span>ফলাফল: </span>
                      <strong className={cand.calculated?.isPassed ? "text-emerald-700" : "text-rose-700"}>
                        {cand.calculated?.isPassed ? "উত্তীর্ণ (PASS)" : "অনুত্তীর্ণ (FAIL)"}
                      </strong>
                    </div>
                    {cand.rank && (
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        মেধাক্রম: #{cand.rank}
                      </span>
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 flex items-end justify-between text-xs text-slate-700">
                    <div className="text-center">
                      <div className="w-24 border-b border-slate-400 mb-1" />
                      <span className="text-[9px] text-slate-600 block">শ্রেণী শিক্ষক</span>
                    </div>
                    <div className="text-center">
                      <div className="w-24 border-b border-slate-400 mb-1" />
                      <span className="text-[9px] text-slate-600 block">পরীক্ষা নিয়ন্ত্রক</span>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-400 mb-1" />
                      <span className="text-[9px] font-bold text-slate-900 block">{INSTITUTION_INFO.principal}</span>
                      <span className="text-[8px] text-slate-500 block">মুহতামিম / অধ্যক্ষ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
