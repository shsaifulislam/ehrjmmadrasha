"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useGuardians(query: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["guardians", query],
    queryFn: async () => {
      const { data } = await api.get("/guardian", { params: query });
      return data.data;
    },
  });
}

export function useGuardian360(guardianId: string) {
  return useQuery({
    queryKey: ["guardian360", guardianId],
    queryFn: async () => {
      const { data } = await api.get(`/guardian/${guardianId}/360`);
      return data.data;
    },
    enabled: !!guardianId,
  });
}

export function useCreateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; phone: string; relation?: string; address?: string }) =>
      api.post("/guardian", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardians"] }),
  });
}

export function useLinkWard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, studentId, relation }: { guardianId: string; studentId: string; relation?: string }) =>
      api.post(`/guardian/${guardianId}/link-ward`, { studentId, relation }),
    onSuccess: (_, { guardianId }) => {
      qc.invalidateQueries({ queryKey: ["guardians"] });
      qc.invalidateQueries({ queryKey: ["guardian360", guardianId] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUnlinkWard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, studentId }: { guardianId: string; studentId: string }) =>
      api.delete(`/guardian/unlink-ward/${studentId}`),
    onSuccess: (_, { guardianId }) => {
      qc.invalidateQueries({ queryKey: ["guardians"] });
      qc.invalidateQueries({ queryKey: ["guardian360", guardianId] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
