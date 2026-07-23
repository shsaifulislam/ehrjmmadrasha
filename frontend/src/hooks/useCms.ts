"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: string;
  attachmentUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoticesResponse {
  notices: NoticeItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function usePublicNotices(type?: string, page = 1) {
  return useQuery<NoticesResponse>({
    queryKey: ["publicNotices", type, page],
    queryFn: async () => {
      const { data } = await api.get("/public/notices", {
        params: { type, page },
      });
      return data.data;
    },
  });
}

export function useAdminNotices(page = 1) {
  return useQuery<NoticesResponse>({
    queryKey: ["adminNotices", page],
    queryFn: async () => {
      const { data } = await api.get("/admin/notices", {
        params: { page },
      });
      return data.data;
    },
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/admin/notices", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotices"] });
      qc.invalidateQueries({ queryKey: ["publicNotices"] });
    },
  });
}

export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.put(`/admin/notices/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotices"] });
      qc.invalidateQueries({ queryKey: ["publicNotices"] });
    },
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/notices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotices"] });
      qc.invalidateQueries({ queryKey: ["publicNotices"] });
    },
  });
}

// ─── GALLERY CMS ────────────────────────────────────
export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  uploadedAt: string;
}

export function usePublicGallery(category?: string, page = 1) {
  return useQuery<{ items: GalleryItem[]; pagination: any }>({
    queryKey: ["publicGallery", category, page],
    queryFn: async () => {
      const { data } = await api.get("/public/gallery", { params: { category, page } });
      return data.data;
    },
  });
}

export function useAdminGallery(page = 1) {
  return useQuery<{ items: GalleryItem[]; pagination: any }>({
    queryKey: ["adminGallery", page],
    queryFn: async () => {
      const { data } = await api.get("/admin/gallery", { params: { page } });
      return data.data;
    },
  });
}

export function useCreateGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/admin/gallery", formData, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminGallery"] });
      qc.invalidateQueries({ queryKey: ["publicGallery"] });
    },
  });
}

export function useDeleteGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/gallery/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminGallery"] });
      qc.invalidateQueries({ queryKey: ["publicGallery"] });
    },
  });
}

// ─── DOWNLOAD CENTER CMS ─────────────────────────────
export interface DownloadItem {
  id: string;
  title: string;
  fileUrl: string;
  category: string;
  createdAt: string;
}

export function usePublicDownloads(category?: string, page = 1) {
  return useQuery<{ items: DownloadItem[]; pagination: any }>({
    queryKey: ["publicDownloads", category, page],
    queryFn: async () => {
      const { data } = await api.get("/public/downloads", { params: { category, page } });
      return data.data;
    },
  });
}

export function useAdminDownloads(page = 1) {
  return useQuery<{ items: DownloadItem[]; pagination: any }>({
    queryKey: ["adminDownloads", page],
    queryFn: async () => {
      const { data } = await api.get("/admin/downloads", { params: { page } });
      return data.data;
    },
  });
}

export function useCreateDownloadItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/admin/downloads", formData, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminDownloads"] });
      qc.invalidateQueries({ queryKey: ["publicDownloads"] });
    },
  });
}

export function useDeleteDownloadItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/downloads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminDownloads"] });
      qc.invalidateQueries({ queryKey: ["publicDownloads"] });
    },
  });
}

// ─── ONLINE ADMISSIONS CMS ─────────────────────────────
export interface AdmissionItem {
  id: string;
  applicantName: string;
  fatherName: string | null;
  motherName: string | null;
  phone: string;
  dateOfBirth: string | null;
  gender: string;
  address: string | null;
  classId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  photoUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  class?: { id: string; name: string };
}

export function useAdminAdmissions(status?: string, page = 1) {
  return useQuery<{ admissions: AdmissionItem[]; pagination: any }>({
    queryKey: ["adminAdmissions", status, page],
    queryFn: async () => {
      const { data } = await api.get("/admin/admissions", { params: { status, page } });
      return data.data;
    },
  });
}

export function useSubmitPublicAdmission() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/public/admissions", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  });
}

export function useApproveAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/admissions/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminAdmissions"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useRejectAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/admissions/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminAdmissions"] });
    },
  });
}

export function useVerifyAdmission(token: string) {
  return useQuery<{ 
    id: string; applicantName: string; fatherName: string; motherName: string; phone: string; 
    class: { name: string }; createdAt: string; verificationToken: string; status: string;
    brn?: string; religion?: string; bloodGroup?: string;
    guardianNid?: string; previousInstitution?: string; quota?: string;
    village?: string; postOffice?: string; upazila?: string; district?: string; address?: string;
  }>({
    queryKey: ["verifyAdmission", token],
    queryFn: async () => {
      const { data } = await api.get(`/public/admissions/verify/${token}`);
      return data.data;
    },
    enabled: !!token,
  });
}
