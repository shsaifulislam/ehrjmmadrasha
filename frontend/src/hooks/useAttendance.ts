"use client";

// Attendance API hooks using TanStack Query v5
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  AttendanceDataResponse,
  DailyReportResponse,
  MonthlyReportResponse,
  AttendanceStatus,
} from "@/lib/types";

export function useAttendance(classId: string, date: string) {
  return useQuery<AttendanceDataResponse>({
    queryKey: ["attendance", classId, date],
    queryFn: async () => {
      const { data } = await api.get("/admin/attendance", {
        params: { classId, date },
      });
      return data.data;
    },
    enabled: !!classId && !!date,
  });
}

export function useSaveBulkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      date: string;
      classId: string;
      attendances: Array<{ studentId: string; status: AttendanceStatus }>;
    }) => api.post("/admin/attendance/bulk", body),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance", variables.classId, variables.date] });
    },
  });
}

export function useDailyAttendanceReport(classId: string, date: string) {
  return useQuery<DailyReportResponse>({
    queryKey: ["attendanceReportDaily", classId, date],
    queryFn: async () => {
      const { data } = await api.get("/admin/attendance/report/daily", {
        params: { classId, date },
      });
      return data.data;
    },
    enabled: !!classId && !!date,
  });
}

export function useMonthlyAttendanceReport(classId: string, year: number, month: number) {
  return useQuery<MonthlyReportResponse>({
    queryKey: ["attendanceReportMonthly", classId, year, month],
    queryFn: async () => {
      const { data } = await api.get("/admin/attendance/report/monthly", {
        params: { classId, year, month },
      });
      return data.data;
    },
    enabled: !!classId && !!year && !!month,
  });
}
