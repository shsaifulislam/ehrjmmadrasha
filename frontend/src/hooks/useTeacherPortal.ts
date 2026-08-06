"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teacherDashboard"],
    queryFn: async () => {
      const { data } = await api.get("/teacher-portal/dashboard");
      return data.data;
    },
  });
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: ["teacherClasses"],
    queryFn: async () => {
      const { data } = await api.get("/teacher-portal/classes");
      return data.data;
    },
  });
}

export function useTeacherStudents(classId?: string) {
  return useQuery({
    queryKey: ["teacherStudents", classId],
    queryFn: async () => {
      const params = classId ? { classId } : {};
      const { data } = await api.get("/teacher-portal/students", { params });
      return data.data;
    },
  });
}

export function useSubmitClassAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { classId: string; date: string; records: { studentId: string; status: "PRESENT" | "ABSENT" | "LEAVE" }[] }) =>
      api.post("/teacher-portal/attendance", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacherDashboard"] });
      qc.invalidateQueries({ queryKey: ["attendances"] });
    },
  });
}

export function useSubmitExamMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { classId: string; subjectId: string; examId: string; marks: { studentId: string; obtainedMarks: number; highestMarks?: number }[] }) =>
      api.post("/teacher-portal/marks", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacherDashboard"] });
      qc.invalidateQueries({ queryKey: ["examResults"] });
    },
  });
}
