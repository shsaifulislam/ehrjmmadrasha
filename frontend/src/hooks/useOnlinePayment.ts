"use client";

// Online Payment TanStack Query v5 hooks
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface InitiateOnlinePaymentInput {
  invoiceId: string;
  gateway: "BKASH" | "NAGAD" | "MOCK";
  amount: number;
}

export interface InitiateOnlinePaymentResponse {
  paymentReference: string;
  gatewayPaymentID?: string;
  redirectUrl: string;
  amount: number;
}

export interface VerifyPaymentInput {
  paymentReference: string;
  gatewayPaymentID?: string;
  trxID?: string;
}

export function useInitiateOnlinePayment() {
  return useMutation({
    mutationFn: async (input: InitiateOnlinePaymentInput) => {
      const { data } = await api.post("/admin/online-payments/initiate", input);
      return data.data as InitiateOnlinePaymentResponse;
    },
  });
}

export function useVerifyOnlinePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: VerifyPaymentInput) => {
      const { data } = await api.post("/admin/online-payments/verify", input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["onlineTransactions"] });
    },
  });
}

export function useOnlineTransactions(page = 1, limit = 50) {
  return useQuery({
    queryKey: ["onlineTransactions", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/admin/online-payments/transactions", {
        params: { page, limit },
      });
      return data.data;
    },
  });
}
