"use client";

// Exam & Result API hooks using TanStack Query v5
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  Exam,
  MarksEntrySheetResponse,
  ClassResultSheetResponse,
  StudentResultCardResponse,
} from "@/lib/types";

// ─── EXAMS CRUD ──────────────────────────────────────
export function useExams(sessionId?: string) {
  return useQuery<Exam[]>({
    queryKey: ["exams", sessionId],
    queryFn: async () => {
      const params = sessionId ? { sessionId } : undefined;
      const { data } = await api.get("/admin/results/exams", { params });
      return data.data;
    },
  });
}

export function usePublicExams(sessionId?: string) {
  return useQuery<Exam[]>({
    queryKey: ["publicExams", sessionId],
    queryFn: async () => {
      const params = sessionId ? { sessionId } : undefined;
      const { data } = await api.get("/public/results/exams", { params });
      return data.data;
    },
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; sessionId: string; isPublished?: boolean }) =>
      api.post("/admin/results/exams", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; isPublished?: boolean } }) =>
      api.put(`/admin/results/exams/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/results/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

// ─── MARKS ENTRY ─────────────────────────────────────
export function useMarksSheet(examId: string, classId: string, subjectId: string) {
  return useQuery<MarksEntrySheetResponse>({
    queryKey: ["marksSheet", examId, classId, subjectId],
    queryFn: async () => {
      const { data } = await api.get("/admin/results/marks-sheet", {
        params: { examId, classId, subjectId },
      });
      return data.data;
    },
    enabled: !!examId && !!classId && !!subjectId,
  });
}

export function useSaveBulkMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      examId: string;
      classId: string;
      subjectId: string;
      marks: Array<{ studentId: string; marks: number }>;
    }) => api.post("/admin/results/marks/bulk", body),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["marksSheet", variables.examId, variables.classId, variables.subjectId],
      });
      qc.invalidateQueries({ queryKey: ["resultSheet", variables.examId, variables.classId] });
    },
  });
}

// ─── RESULT SHEETS & CARDS ────────────────────────────
export function useClassResultSheet(examId: string, classId: string) {
  return useQuery<ClassResultSheetResponse>({
    queryKey: ["resultSheet", examId, classId],
    queryFn: async () => {
      const { data } = await api.get("/admin/results/result-sheet", {
        params: { examId, classId },
      });
      return data.data;
    },
    enabled: !!examId && !!classId,
  });
}

export function useStudentResultCard(examId: string, studentId: string) {
  return useQuery<StudentResultCardResponse>({
    queryKey: ["resultCard", examId, studentId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/results/result-card/${examId}/${studentId}`);
      return data.data;
    },
    enabled: !!examId && !!studentId,
  });
}

// ─── PUBLIC RESULT SEARCH ──────────────────────────────
export function usePublicResultSearch(query: {
  sessionId: string;
  examId: string;
  roll: number;
  studentId?: string;
}) {
  return useQuery<StudentResultCardResponse>({
    queryKey: ["publicResultSearch", query],
    queryFn: async () => {
      const { data } = await api.get("/public/results/search", { params: query });
      return data.data;
    },
    enabled: !!query.sessionId && !!query.examId && !!query.roll,
  });
}
