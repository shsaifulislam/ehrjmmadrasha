"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useStudentCertificates(studentId: string) {
  return useQuery({
    queryKey: ["studentCertificates", studentId],
    queryFn: async () => {
      const { data } = await api.get(`/certificate/student/${studentId}`);
      return data.data;
    },
    enabled: !!studentId,
  });
}

export function useVerifyCertificate(certificateNumber: string) {
  return useQuery({
    queryKey: ["verifyCertificate", certificateNumber],
    queryFn: async () => {
      const { data } = await api.get(`/certificate/public/verify/${certificateNumber}`);
      return data.data;
    },
    enabled: !!certificateNumber,
  });
}

export function useIssueCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      studentId: string;
      type: "TESTIMONIAL" | "CHARACTER" | "ADMISSION" | "TRANSFER_CERTIFICATE" | "TRANSCRIPT";
      note?: string;
    }) => api.post("/certificate/issue", body),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["studentCertificates", studentId] });
      qc.invalidateQueries({ queryKey: ["student360"] });
    },
  });
}
