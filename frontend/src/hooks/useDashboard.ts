"use client";

// Dashboard API hooks
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { DashboardStats } from "@/lib/types";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard/stats");
      return data.data;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 min
  });
}
