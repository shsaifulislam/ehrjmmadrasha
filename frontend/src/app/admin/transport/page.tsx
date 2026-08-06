"use client";

import { useState } from "react";
import {
  Bus,
  Plus,
  Search,
  Users,
  MapPin,
  Phone,
  UserCheck,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign
} from "lucide-react";
import {
  useTransportVehicles,
  useCreateVehicle,
  useTransportRoutes,
  useCreateRoute,
  useTransportAssignments,
  useAssignStudentTransport
} from "@/hooks/useTransport";
import { useStudents } from "@/hooks/useAcademic";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppModal } from "@/components/shared/AppModal";
import { toast } from "sonner";

export default function AdminTransportPage() {
  const [activeTab, setActiveTab] = useState<"routes" | "vehicles" | "assignments" | "reports">("routes");
  const [search, setSearch] = useState("");

  // Modals
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Route Form State
  const [routeName, setRouteName] = useState("");
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("1200");

  // Vehicle Form State
  const [vehicleNo, setVehicleNo] = useState("");
  const [modelName, setModelName] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  // Assignment Form State
  const [studentId, setStudentId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [stoppageName, setStoppageName] = useState("");
  const [assignFee, setAssignFee] = useState("1200");

  // Queries
  const { data: routesData, refetch: refetchRoutes } = useTransportRoutes();
  const { data: vehiclesData, refetch: refetchVehicles } = useTransportVehicles();
  const { data: assignmentsData, refetch: refetchAssignments } = useTransportAssignments();
  const { data: studentsData } = useStudents({ limit: 100 });

  const routes = Array.isArray(routesData) ? routesData : (routesData as any)?.data || [];
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData as any)?.data || [];
  const assignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData as any)?.data || [];
  const students = Array.isArray(studentsData) ? studentsData : (studentsData as any)?.data || [];

  const createRoute = useCreateRoute();
  const createVehicle = useCreateVehicle();
  const assignTransport = useAssignStudentTransport();

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName || !startPoint || !endPoint) {
      toast.error("রুটের নাম ও স্থানসমূহ নির্বাচন করুন");
      return;
    }
    try {
      await createRoute.mutateAsync({
        routeName,
        startPoint,
        endPoint,
        vehicleId: vehicleId || undefined,
        monthlyFee: Number(monthlyFee),
      });
      toast.success("নতুন পরিবহন রুট ডাটাবেসে যোগ করা হয়েছে!");
      setIsRouteModalOpen(false);
      setRouteName("");
      setStartPoint("");
      setEndPoint("");
      refetchRoutes();
    } catch (err: any) {
      toast.error("রুট তৈরি করা সম্ভব হয়নি");
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo || !driverName || !driverPhone) {
      toast.error("গাড়ির নম্বর ও চালকের তথ্য দিন");
      return;
    }
    try {
      await createVehicle.mutateAsync({
        vehicleNo,
        modelName,
        capacity: Number(capacity),
        driverName,
        driverPhone,
      });
      toast.success("নতুন পরিবহন বাস/গাড়ি ডাটাবেসে নিবন্ধিত হয়েছে!");
      setIsVehicleModalOpen(false);
      setVehicleNo("");
      setDriverName("");
      setDriverPhone("");
      refetchVehicles();
    } catch (err: any) {
      toast.error("গাড়ি নিবন্ধন করা সম্ভব হয়নি");
    }
  };

  const handleAssignTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !routeId) {
      toast.error("শিক্ষার্থী ও পরিবহন রুট সিলেক্ট করুন");
      return;
    }
    try {
      await assignTransport.mutateAsync({
        studentId,
        routeId,
        stoppageName,
        monthlyFee: Number(assignFee),
      });
      toast.success("শিক্ষার্থীকে পরিবহন রুট ও মাসিক ফি বরাদ্দ দেওয়া হয়েছে!");
      setIsAssignModalOpen(false);
      refetchAssignments();
    } catch (err: any) {
      toast.error("পরিবহন বরাদ্দ করা সম্ভব হয়নি");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              পরিবহন ও বাস রুট ব্যবস্থাপনা (Transport Module)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            মাদ্রাসা পরিবহন রুট, গাড়ির চালক, স্টপেজ ও শিক্ষার্থী ভিত্তিক মাসিক ফি ম্যাপিং কেন্দ্র (SRS Vol 10)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsVehicleModalOpen(true)}>
            নতুন বাস যোগ করুন
          </AppButton>
          <AppButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsRouteModalOpen(true)}>
            নতুন রুট তৈরি করুন
          </AppButton>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">মোট একটিভ রুট</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{routes.length} টি</p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">নিবন্ধিত বাস/যানবাহন</span>
          <p className="text-2xl font-bold font-mono text-blue-600">{vehicles.length} টি</p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">বরাদ্দকৃত মোট শিক্ষার্থী</span>
          <p className="text-2xl font-bold font-mono text-emerald-600">{assignments.length} জন</p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">মাসিক পরিবহন আয়</span>
          <p className="text-2xl font-bold font-mono text-amber-600">
            ৳ {assignments.reduce((acc: number, a: any) => acc + Number(a.monthlyFee || 0), 0)}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("routes")}
          className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "routes"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin className="h-4 w-4" />
          রুট ও স্টপেজ তালিকা ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "vehicles"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bus className="h-4 w-4" />
          গাড়ি ও চালকের তথ্য ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "assignments"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          শিক্ষার্থী পরিবহন সংযোগ ({assignments.length})
        </button>
      </div>

      {/* Tab 1: Routes List */}
      {activeTab === "routes" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              পরিবহন রুটের বিবরণ
            </h3>
            <AppButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsRouteModalOpen(true)}>
              নতুন রুট
            </AppButton>
          </div>

          {routes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              কোনো পরিবহন রুট যোগ করা হয়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {routes.map((r: any) => (
                <div key={r.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.routeName}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      সূচনা: <strong className="text-slate-800 dark:text-slate-200">{r.startPoint}</strong> ➔ গন্তব্য: <strong className="text-slate-800 dark:text-slate-200">{r.endPoint}</strong>
                    </p>
                    {r.vehicle && (
                      <span className="text-[10px] text-blue-600 font-mono block mt-1">
                        গাড়ি: {r.vehicle.vehicleNo} (চালক: {r.vehicle.driverName} - {r.vehicle.driverPhone})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono text-emerald-600 text-sm">৳ {r.monthlyFee} / মাস</span>
                    <AppBadge variant="success">সক্রিয় রুট</AppBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vehicles List */}
      {activeTab === "vehicles" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bus className="h-4 w-4 text-blue-600" />
              নিবন্ধিত গাড়ি ও চালকদের ডাটাবেস
            </h3>
            <AppButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsVehicleModalOpen(true)}>
              নতুন গাড়ি নিবন্ধিত করুন
            </AppButton>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              কোনো পরিবহন গাড়ি রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((v: any) => (
                <div key={v.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">{v.vehicleNo}</h4>
                    <AppBadge variant="success">{v.status}</AppBadge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">মডেল: {v.modelName || "Standard Bus"} • ধারণক্ষমতা: {v.capacity} আসন</p>
                  <div className="pt-2 border-t text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[10px]">চালকের তথ্য:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{v.driverName}</strong>
                    </div>
                    <span className="font-mono text-blue-600 font-bold flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {v.driverPhone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assignments List */}
      {activeTab === "assignments" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              শিক্ষার্থী পরিবহন সংযোগ ও মাসিক ফি
            </h3>
            <AppButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsAssignModalOpen(true)}>
              শিক্ষার্থী রুট বরাদ্দ দিন
            </AppButton>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              কোনো শিক্ষার্থীকে পরিবহন বরাদ্দ দেওয়া হয়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {assignments.map((a: any) => (
                <div key={a.id} className="py-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{a.student?.nameBn}</h4>
                    <span className="text-[10px] text-slate-400">
                      রুট: {a.route?.routeName} • স্টপেজ: {a.stoppageName || "মূল স্টেশন"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-600 block">৳ {a.monthlyFee} / মাস</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.assignedDate).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Route Creation Modal */}
      <AppModal isOpen={isRouteModalOpen} onClose={() => setIsRouteModalOpen(false)} title="নতুন পরিবহন রুট যোগ করুন">
        <form onSubmit={handleCreateRoute} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">রুটের নাম *</label>
            <input
              type="text"
              placeholder="যেমন: চান্দিনা - ইলিয়টগঞ্জ মূল রুট"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">সূচনা স্থান *</label>
              <input
                type="text"
                placeholder="যেমন: চান্দিনা বাজার"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">গন্তব্য স্থান *</label>
              <input
                type="text"
                placeholder="যেমন: মাদ্রাসা ক্যাম্পাস"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">মাসিক রুট ফি (৳) *</label>
            <input
              type="number"
              placeholder="1200"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="secondary" size="sm" type="button" onClick={() => setIsRouteModalOpen(false)}>
              বাতিল
            </AppButton>
            <AppButton variant="primary" size="sm" type="submit">
              রুট সংরক্ষণ করুন
            </AppButton>
          </div>
        </form>
      </AppModal>

      {/* Vehicle Registration Modal */}
      <AppModal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title="নতুন বাস/যানবাহন নিবন্ধন করুন">
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">গাড়ির রেজিস্টার্ড নম্বর *</label>
            <input
              type="text"
              placeholder="যেমন: ঢাকা মেট্রো ছ-১১-২০২৬"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">চালকের নাম *</label>
              <input
                type="text"
                placeholder="যেমন: মুহাম্মদ আলী"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">চালকের মোবাইল নম্বর *</label>
              <input
                type="text"
                placeholder="যেমন: 01711223344"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="secondary" size="sm" type="button" onClick={() => setIsVehicleModalOpen(false)}>
              বাতিল
            </AppButton>
            <AppButton variant="primary" size="sm" type="submit">
              গাড়ি সংরক্ষণ করুন
            </AppButton>
          </div>
        </form>
      </AppModal>

      {/* Assign Transport Modal */}
      <AppModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="শিক্ষার্থী পরিবহন বরাদ্দ দিন">
        <form onSubmit={handleAssignTransport} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">শিক্ষার্থী সিলেক্ট করুন *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
              {students.map((st: any) => (
                <option key={st.id} value={st.id}>
                  {st.nameBn} ({st.studentId} - {st.class?.name || "শ্রেণী"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">পরিবহন রুট সিলেক্ট করুন *</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="">-- রুট নির্বাচন করুন --</option>
              {routes.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.routeName} (৳ {r.monthlyFee}/মাস)
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="secondary" size="sm" type="button" onClick={() => setIsAssignModalOpen(false)}>
              বাতিল
            </AppButton>
            <AppButton variant="primary" size="sm" type="submit">
              বরাদ্দ সংরক্ষণ করুন
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
