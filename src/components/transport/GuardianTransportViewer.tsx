"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Send,
  User,
  CreditCard,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  FileText
} from "lucide-react";

export default function GuardianTransportViewer() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Request Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyForm, setApplyForm] = useState({
    routeId: "",
    pickupStopId: "",
    dropStopId: "",
    preferredStartDate: new Date().toISOString().split("T")[0],
    guardianNotes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/transport");
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.students && json.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(json.students[0].id);
        }
      } else {
        setError(json.error || "পরিবহন তথ্য লোড করতে ব্যর্থ।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !applyForm.routeId || !applyForm.pickupStopId) {
      setActionMsg({ text: "শিক্ষার্থী, রুট ও পিকআপ স্টপ নির্বাচন আবশ্যক।", type: "error" });
      return;
    }

    setApplying(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/portal/transport/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          ...applyForm,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMsg({ text: "আবেদন সফলভাবে জমা হয়েছে। প্রশাসন শীঘ্রই পর্যালোচনা করবে।", type: "success" });
        setShowApplyModal(false);
        setApplyForm({
          routeId: "",
          pickupStopId: "",
          dropStopId: "",
          preferredStartDate: new Date().toISOString().split("T")[0],
          guardianNotes: "",
        });
        fetchData();
      } else {
        setActionMsg({ text: json.error || "আবেদন জমা দেওয়া যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium">পরিবহন তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800">তথ্য পাওয়া যায়নি</h3>
        <p className="text-sm text-slate-600">{error || "আপনার অ্যাকাউন্টে কোনো শিক্ষার্থী সংযুক্ত নেই।"}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  const currentStudent = data.students?.find((s: any) => s.id === selectedStudentId) || data.students?.[0];
  const activeEnrollment = data.activeEnrollments?.find((e: any) => e.studentId === currentStudent?.id);
  const studentRequests = data.requests?.filter((r: any) => r.studentId === currentStudent?.id) || [];
  const selectedRouteObj = data.availableRoutes?.find((r: any) => r.id === applyForm.routeId);

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            actionMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Child Switcher */}
      {data.students && data.students.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            সন্তান নির্বাচন:
          </span>
          <div className="flex items-center gap-2">
            {data.students.map((st: any) => {
              const isSelected = st.id === currentStudent?.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{st.fullNameBn}</span>
                  <span className="text-[10px] opacity-75">({st.studentIdNumber})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Child Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
            শিক্ষার্থী প্রোফাইল
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">{currentStudent?.fullNameBn}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            আইডি: {currentStudent?.studentIdNumber} • জামাত/শ্রেণি: {currentStudent?.enrollment?.className || "N/A"}
          </p>
        </div>
        {!activeEnrollment && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>পরিবহন সেবার আবেদন করুন</span>
          </button>
        )}
      </div>

      {/* Active Transport Details Card */}
      {activeEnrollment ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <Bus className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <span className="text-xs text-emerald-200 uppercase font-semibold">সক্রিয় পরিবহন সেবা</span>
                <h3 className="text-lg font-bold">{activeEnrollment.route?.routeName}</h3>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold border border-emerald-400">
              সক্রিয় (ACTIVE)
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stops */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">পিকআপ ও ড্রপ স্টপ</span>
              <div className="font-bold text-slate-800 text-sm">
                {activeEnrollment.pickupStop?.stopName || "নির্দিষ্ট নেই"}
              </div>
              <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" />
                পিকআপ সময়: {activeEnrollment.pickupStop?.pickupTime || "N/A"}
              </p>
              <p className="text-xs text-slate-500">
                ড্রপ সময়: {activeEnrollment.dropStop?.dropTime || activeEnrollment.pickupStop?.dropTime || "N/A"}
              </p>
            </div>

            {/* Vehicle */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">গাড়ির বিবরণ</span>
              <div className="font-bold text-slate-800 text-sm">
                {activeEnrollment.route?.vehicle?.vehicleNumber || "গাড়ি নির্ধারিত নেই"}
              </div>
              <p className="text-xs text-slate-500">
                মডেল: {activeEnrollment.route?.vehicle?.model || "Toyota HiAce"}
              </p>
              <p className="text-xs text-slate-500">
                ক্যাপাসিটি: {activeEnrollment.route?.vehicle?.capacity || 0} আসন
              </p>
            </div>

            {/* Driver */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">নির্ধারিত চালক</span>
              <div className="font-bold text-slate-800 text-sm">
                {activeEnrollment.route?.vehicle?.driver?.fullName || "তথ্য নেই"}
              </div>
              {activeEnrollment.route?.vehicle?.driver?.phone && (
                <a
                  href={`tel:${activeEnrollment.route.vehicle.driver.phone}`}
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {activeEnrollment.route.vehicle.driver.phone}
                </a>
              )}
            </div>

            {/* Fee */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">মাসিক পরিবহন ফি</span>
              <div className="text-xl font-bold text-emerald-700">
                ৳{activeEnrollment.monthlyFee}
              </div>
              <p className="text-xs text-slate-500">
                কার্যকর শুরু: {new Date(activeEnrollment.startDate).toLocaleDateString("bn-BD")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
          <Bus className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">বর্তমানে কোনো পরিবহন সেবা সক্রিয় নেই</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            আপনার সন্তানের নিরাপদ যাতায়াতের জন্য ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার নিয়মিত পরিবহন সার্ভিসের আবেদন করতে নিচের বাটনে চাপুন।
          </p>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পরিবহন আবেদন</span>
          </button>
        </div>
      )}

      {/* Request Tracking History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>পরিবহন আবেদনের ইতিহাস (Application History)</span>
        </h3>

        {studentRequests.length > 0 ? (
          <div className="space-y-3">
            {studentRequests.map((req: any) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded">
                      {req.requestNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        req.status === "SUBMITTED"
                          ? "bg-amber-100 text-amber-800"
                          : req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {req.status === "SUBMITTED"
                        ? "পর্যালোচনাধীন"
                        : req.status === "APPROVED"
                        ? "অনুমোদিত"
                        : "বাতিল"}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-800 mt-1">
                    {req.route?.routeName} • স্টপ: {req.pickupStop?.stopName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    আবেদনের তারিখ: {new Date(req.createdAt).toLocaleDateString("bn-BD")}
                  </div>
                  {req.rejectionReason && (
                    <div className="text-xs text-rose-600 mt-1 font-medium">
                      বাতিলের কারণ: {req.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 sm:text-right">
                  পছন্দনীয় শুরু: {req.preferredStartDate ? new Date(req.preferredStartDate).toLocaleDateString("bn-BD") : "তাৎক্ষণিক"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">কোনো পূর্ববর্তী আবেদন নেই।</p>
        )}
      </div>

      {/* Available Routes Directory Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>উপলব্ধ সকল পরিবহন রুট ও স্টপেজ তালিকা</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.availableRoutes?.map((rt: any) => (
            <div key={rt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  {rt.routeCode}
                </span>
                <span className="font-bold text-xs text-slate-700">মাসিক: ৳{rt.monthlyFee}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-800">{rt.routeName}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{rt.startPoint}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span>{rt.endPoint}</span>
              </p>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">স্টপসমূহ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {rt.stops?.map((st: any) => (
                    <span key={st.id} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[11px]">
                      {st.stopName} ({st.pickupTime})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: SUBMIT TRANSPORT APPLICATION */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">পরিবহন সেবার আবেদন</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">শিক্ষার্থী</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  {currentStudent?.fullNameBn} ({currentStudent?.studentIdNumber})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">রুট নির্বাচন করুন *</label>
                <select
                  required
                  value={applyForm.routeId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const r = data.availableRoutes?.find((rt: any) => rt.id === rId);
                    setApplyForm({
                      ...applyForm,
                      routeId: rId,
                      pickupStopId: r?.stops?.[0]?.id || "",
                      dropStopId: r?.stops?.[r?.stops?.length - 1]?.id || "",
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">রুট নির্বাচন করুন</option>
                  {data.availableRoutes?.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.routeCode} — {rt.routeName} (মাসিক: ৳{rt.monthlyFee})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRouteObj && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">পিকআপ স্টপ *</label>
                    <select
                      required
                      value={applyForm.pickupStopId}
                      onChange={(e) => setApplyForm({ ...applyForm, pickupStopId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      <option value="">পিকআপ স্টপ</option>
                      {selectedRouteObj.stops?.map((st: any) => (
                        <option key={st.id} value={st.id}>
                          {st.sequenceOrder}. {st.stopName} ({st.pickupTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">ড্রপ স্টপ</label>
                    <select
                      value={applyForm.dropStopId}
                      onChange={(e) => setApplyForm({ ...applyForm, dropStopId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      <option value="">ড্রপ স্টপ</option>
                      {selectedRouteObj.stops?.map((st: any) => (
                        <option key={st.id} value={st.id}>
                          {st.sequenceOrder}. {st.stopName} ({st.dropTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">পছন্দনীয় শুরুর তারিখ</label>
                <input
                  type="date"
                  value={applyForm.preferredStartDate}
                  onChange={(e) => setApplyForm({ ...applyForm, preferredStartDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">মন্তব্য বা বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: বাস স্ট্যান্ডের পশ্চিম পাশে অপেক্ষা করবে..."
                  value={applyForm.guardianNotes}
                  onChange={(e) => setApplyForm({ ...applyForm, guardianNotes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {applying ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
