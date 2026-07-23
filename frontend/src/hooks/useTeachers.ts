"use client";

// Teacher API hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Teacher, PaginationQuery } from "@/lib/types";

export function useTeachers(query: PaginationQuery = {}) {
  return useQuery({
    queryKey: ["teachers", query],
    queryFn: async () => {
      const { data } = await api.get("/admin/teachers", { params: query });
      return { teachers: data.data as Teacher[], meta: data.meta };
    },
  });
}

export function useTeacher(id: string) {
  return useQuery<Teacher>({
    queryKey: ["teachers", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/teachers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/admin/teachers", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.put(`/admin/teachers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/teachers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}
