"use client";

// Academic module API hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Session, Class, Department, Subject, Student, PaginationQuery } from "@/lib/types";

// ─── Sessions ───────────────────────────────────────
export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await api.get("/academic/sessions");
      return data.data;
    },
  });
}

export function usePublicSessions() {
  return useQuery<Session[]>({
    queryKey: ["publicSessions"],
    queryFn: async () => {
      const { data } = await api.get("/public/academic/sessions");
      return data.data;
    },
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { year: string; isActive?: boolean }) =>
      api.post("/academic/sessions", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/academic/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// ─── Classes ────────────────────────────────────────
export function useClasses() {
  return useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/academic/classes");
      return data.data;
    },
  });
}

export function usePublicClasses() {
  return useQuery<Class[]>({
    queryKey: ["publicClasses"],
    queryFn: async () => {
      const { data } = await api.get("/public/academic/classes");
      return data.data;
    },
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; numericValue: number }) =>
      api.post("/academic/classes", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/academic/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

// ─── Departments ────────────────────────────────────
export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get("/academic/departments");
      return data.data;
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; type: string }) =>
      api.post("/academic/departments", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

// ─── Subjects ───────────────────────────────────────
export function useSubjects(classId?: string) {
  return useQuery<Subject[]>({
    queryKey: ["subjects", classId],
    queryFn: async () => {
      const params = classId ? `?classId=${classId}` : "";
      const { data } = await api.get(`/academic/subjects${params}`);
      return data.data;
    },
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; code?: string; classId: string }) =>
      api.post("/academic/subjects", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

// ─── Students ───────────────────────────────────────
export function useStudents(query: PaginationQuery & { classId?: string; sessionId?: string } = {}) {
  return useQuery({
    queryKey: ["students", query],
    queryFn: async () => {
      const { data } = await api.get("/academic/students", { params: query });
      return { students: data.data as Student[], meta: data.meta };
    },
  });
}

export function useStudent(id: string) {
  return useQuery<Student>({
    queryKey: ["students", id],
    queryFn: async () => {
      const { data } = await api.get(`/academic/students/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/academic/students", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.put(`/academic/students/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/academic/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}
