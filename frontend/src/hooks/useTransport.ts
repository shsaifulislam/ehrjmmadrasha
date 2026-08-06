"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useTransportVehicles() {
  return useQuery({
    queryKey: ["transportVehicles"],
    queryFn: async () => {
      const { data } = await api.get("/admin/transport/vehicles");
      return data.data;
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vehicleNo: string; modelName?: string; capacity: number; driverName: string; driverPhone: string; licenseNo?: string }) =>
      api.post("/admin/transport/vehicles", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transportVehicles"] }),
  });
}

export function useTransportRoutes() {
  return useQuery({
    queryKey: ["transportRoutes"],
    queryFn: async () => {
      const { data } = await api.get("/admin/transport/routes");
      return data.data;
    },
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { routeName: string; startPoint: string; endPoint: string; vehicleId?: string; monthlyFee: number }) =>
      api.post("/admin/transport/routes", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transportRoutes"] }),
  });
}

export function useTransportAssignments() {
  return useQuery({
    queryKey: ["transportAssignments"],
    queryFn: async () => {
      const { data } = await api.get("/admin/transport/assignments");
      return data.data;
    },
  });
}

export function useAssignStudentTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { studentId: string; routeId: string; stoppageName?: string; monthlyFee?: number }) =>
      api.post("/admin/transport/assignments", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transportAssignments"] });
      qc.invalidateQueries({ queryKey: ["student360"] });
    },
  });
}
