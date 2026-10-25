"use client";

// Notification API hooks using TanStack Query v5
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface NotificationLogItem {
  id: string;
  eventType: "FEE_PAYMENT_SUCCESS" | "STUDENT_ABSENCE" | "ADMISSION_APPROVED" | "EMERGENCY_NOTICE" | "BULK_NOTICE";
  recipientPhone: string;
  recipientName: string | null;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  provider: string;
  providerMsgId: string | null;
  failureReason: string | null;
  retryCount: number;
  sentAt: string | null;
  referenceId: string | null;
  campaignId: string | null;
  createdAt: string;
}

export interface NotificationLogsResponse {
  logs: NotificationLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useNotificationLogs(page = 1, limit = 50) {
  return useQuery<NotificationLogsResponse>({
    queryKey: ["notificationLogs", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/admin/notifications/logs", {
        params: { page, limit },
      });
      return data.data;
    },
  });
}

export function useSendBulkSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      recipientType: "ALL_STUDENTS" | "CLASS" | "ALL_TEACHERS" | "CUSTOM";
      classId?: string;
      customNumbers?: string[];
      message: string;
    }) => api.post("/admin/notifications/bulk", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificationLogs"] });
    },
  });
}

export function useRetryNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/notifications/${id}/retry`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificationLogs"] });
    },
  });
}
