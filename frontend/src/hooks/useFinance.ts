"use client";

// Finance API hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { FeeType, Invoice, Expense, Donation, PaginationQuery } from "@/lib/types";

// ─── Fee Types ──────────────────────────────────────
export function useFeeTypes() {
  return useQuery<FeeType[]>({
    queryKey: ["feeTypes"],
    queryFn: async () => {
      const { data } = await api.get("/admin/fee-types");
      return data.data;
    },
  });
}

export function useCreateFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; defaultAmount: number }) =>
      api.post("/admin/fee-types", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feeTypes"] }),
  });
}

export function useUpdateFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.put(`/admin/fee-types/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feeTypes"] }),
  });
}

export function useDeleteFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/fee-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feeTypes"] }),
  });
}

// ─── Invoices ───────────────────────────────────────
export function useInvoices(query: PaginationQuery & { studentId?: string; status?: string; year?: number } = {}) {
  return useQuery({
    queryKey: ["invoices", query],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/invoices", { params: query });
      return { invoices: data.data as Invoice[], meta: data.meta };
    },
  });
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/finance/invoices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/admin/finance/invoices", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Payments ───────────────────────────────────────
export function useCollectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { invoiceId: string; amountPaid: number; method: string }) =>
      api.post("/admin/finance/collect", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Expenses ───────────────────────────────────────
export function useExpenses(query: PaginationQuery = {}) {
  return useQuery({
    queryKey: ["expenses", query],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/expenses", { params: query });
      return { expenses: data.data as Expense[], meta: data.meta };
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/admin/finance/expenses", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Donations ──────────────────────────────────────
export function useDonations(query: PaginationQuery = {}) {
  return useQuery({
    queryKey: ["donations", query],
    queryFn: async () => {
      const { data } = await api.get("/admin/finance/donations", { params: query });
      return { donations: data.data as Donation[], meta: data.meta };
    },
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/admin/finance/donations", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
