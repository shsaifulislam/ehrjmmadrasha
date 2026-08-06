"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useTrialBalance(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["trialBalance", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/accounting/reports/trial-balance", { params });
      return data.data;
    },
  });
}

export function useIncomeStatement(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["incomeStatement", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/accounting/reports/income-statement", { params });
      return data.data;
    },
  });
}

export function useBalanceSheet(params?: { asOfDate?: string }) {
  return useQuery({
    queryKey: ["balanceSheet", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/accounting/reports/balance-sheet", { params });
      return data.data;
    },
  });
}
