"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileBadge,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  QrCode,
  Eye,
  FileText,
  UserCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  Award
} from "lucide-react";
import { useStudentCertificates, useIssueCertificate } from "@/hooks/useCertificate";
import { useStudents } from "@/hooks/useAcademic";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppModal } from "@/components/shared/AppModal";
import { toast } from "sonner";

export default function AdminCertificatesPage() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Form State
  const [studentId, setStudentId] = useState("");
  const [certType, setCertType] = useState<"TESTIMONIAL" | "CHARACTER" | "ADMISSION" | "TRANSFER_CERTIFICATE" | "TRANSCRIPT">("TRANSFER_CERTIFICATE");
  const [note, setNote] = useState("");

  const { data: studentsData } = useStudents({ limit: 100 });
  const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData as any)?.data || [];

  const issueCertificate = useIssueCertificate();

  // Demo issued certificates
  const [issuedCertificates, setIssuedCertificates] = useState<any[]>([
    {
      id: "c1",
      certificateNumber: "CERT-2026-881920",
      studentId: "s1",
      studentName: "মুহাম্মদ আব্দুল্লাহ",
      className: "প্রথম শ্রেণী",
      type: "TRANSFER_CERTIFICATE",
      issueDate: "2026-08-01",
      status: "ISSUED",
    },
    {
      id: "c2",
      certificateNumber: "CERT-2026-441290",
      studentId: "s2",
      studentName: "উমর ফারুক",
      className: "তৃতীয় শ্রেণী",
      type: "CHARACTER",
      issueDate: "2026-08-03",
      status: "ISSUED",
    },
  ]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("শিক্ষার্থী নির্বাচন করুন");
      return;
    }

    const selectedSt = studentsList.find((s: any) => s.id === studentId) || { nameBn: "শিক্ষার্থী", class: { name: "শ্রেণী" } };

    try {
      await issueCertificate.mutateAsync({
        studentId,
        type: certType,
        note,
      });

      const newCert = {
        id: `c_${Date.now()}`,
        certificateNumber: `CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        studentId,
        studentName: selectedSt.nameBn,
        className: selectedSt.class?.name || "শ্রেণী",
        type: certType,
        issueDate: new Date().toISOString(),
        status: "ISSUED",
      };

      setIssuedCertificates([newCert, ...issuedCertificates]);
      toast.success("অফিসিয়াল সার্টিফিকেট ডাটাবেসে সফলভাবে ইস্যু করা হয়েছে!");
      setIsIssueModalOpen(false);
      setNote("");
    } catch (err: any) {
      toast.error("সার্টিফিকেট ইস্যু করা সম্ভব হয়নি");
    }
  };

  const filteredCerts = issuedCertificates.filter((c) => {
    const matchesSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) || c.certificateNumber.includes(search);
    const matchesType = selectedType === "ALL" || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileBadge className="h-6 w-6 text-amber-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              প্রাতিষ্ঠানিক সার্টিফিকেট ও প্রশংসাপত্র সেন্টার
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ছাড়পত্র (TC), চারিত্রিক সনদ, প্রশংসাপত্র ইস্যু ও কাস্টম ক্যানভাস প্রিন্টিং হাব
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsIssueModalOpen(true)}>
            নতুন সার্টিফিকেট ইস্যু করুন
          </AppButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="সার্টিফিকেট নম্বর বা শিক্ষার্থীর নাম..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedType === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
            }`}
          >
            সবগুলো ({issuedCertificates.length})
          </button>
          <button
            onClick={() => setSelectedType("TRANSFER_CERTIFICATE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedType === "TRANSFER_CERTIFICATE" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
            }`}
          >
            ছাড়পত্র (TC)
          </button>
          <button
            onClick={() => setSelectedType("CHARACTER")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedType === "CHARACTER" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
            }`}
          >
            চারিত্রিক সনদ
          </button>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            কোনো ইস্যুকৃত সার্টিফিকেট রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredCerts.map((c) => (
              <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.studentName}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      নম্বর: {c.certificateNumber} • {c.className}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <AppBadge variant={c.type === "TRANSFER_CERTIFICATE" ? "warning" : "success"}>
                    {c.type === "TRANSFER_CERTIFICATE" ? "ছাড়পত্র (TC)" : c.type === "CHARACTER" ? "চারিত্রিক সনদ" : c.type}
                  </AppBadge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(c.issueDate).toLocaleDateString("bn-BD")}
                  </span>
                  <div className="flex items-center gap-1">
                    <AppButton
                      variant="outline"
                      size="sm"
                      icon={<Printer className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setSelectedCert(c);
                        setIsPrintModalOpen(true);
                      }}
                    >
                      প্রিন্ট
                    </AppButton>
                    <Link href={`/verify-certificate/${c.certificateNumber}`} target="_blank">
                      <AppButton variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                        যাচাই
                      </AppButton>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue Certificate Modal */}
      <AppModal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="নতুন সার্টিফিকেট ইস্যু করুন">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="">-- যেকোনো শিক্ষার্থী সিলেক্ট করুন --</option>
              {studentsList.map((st: any) => (
                <option key={st.id} value={st.id}>
                  {st.nameBn} ({st.studentId} - {st.class?.name || "শ্রেণী"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">সার্টিফিকেটের ধরন *</label>
            <select
              value={certType}
              onChange={(e: any) => setCertType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="TRANSFER_CERTIFICATE">ছাড়পত্র (Transfer Certificate / TC)</option>
              <option value="CHARACTER">চারিত্রিক সনদ (Character Certificate)</option>
              <option value="TESTIMONIAL">প্রশংসাপত্র (Testimonial)</option>
              <option value="ADMISSION">ভর্তি নিশ্চিতকরণ সনদ (Study Certificate)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">মন্তব্য বা বিশেষ নোট</label>
            <textarea
              placeholder="সার্টিফিকেটে কোনো অতিরিক্ত মন্তব্য থাকলে লিখুন..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="secondary" size="sm" type="button" onClick={() => setIsIssueModalOpen(false)}>
              বাতিল
            </AppButton>
            <AppButton variant="primary" size="sm" type="submit">
              ইস্যু ও রেকর্ড করুন
            </AppButton>
          </div>
        </form>
      </AppModal>

      {/* Printable Certificate Canvas Modal */}
      {selectedCert && (
        <AppModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="অফিসিয়াল সার্টিফিকেট প্রিন্ট প্রিভিউ">
          <div className="space-y-6 p-4 bg-amber-50/40 border-4 border-amber-950/20 rounded-3xl text-slate-900">
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-amber-900/30">
              <h2 className="text-lg font-black tracking-wide text-amber-950">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h2>
              <p className="text-[10px] text-amber-800 font-semibold">ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: চান্দিনা, জেলা: কুমিল্লা</p>
              <div className="pt-2">
                <span className="inline-block bg-amber-900 text-white font-bold text-xs px-4 py-1 rounded-full uppercase tracking-wider">
                  {selectedCert.type === "TRANSFER_CERTIFICATE" ? "অধ্যয়ন ত্যাগের ছাড়পত্র (TC)" : "চারিত্রিক সনদপত্র"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="text-xs leading-relaxed space-y-3 font-serif">
              <p>
                এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, <strong className="font-bold border-b border-dashed border-amber-950">{selectedCert.studentName}</strong>,
                শ্রেণী: <strong className="font-bold">{selectedCert.className}</strong>, আমাদের ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার একজন নিয়মিত শিক্ষার্থী ছিলেন।
              </p>
              <p>
                আমাদের জানা মতে তিনি কোনো সচ্চরিত্র ও নৈতিক পরিপন্থী কাজে লিপ্ত নন। তাঁর স্বভাব-চরিত্র অত্যন্ত সুন্দর ও প্রশংসনীয়।
              </p>
              <p>আমি তাঁর উত্তরোত্তর উজ্জ্বল ভবিষ্যৎ ও মঙ্গল কামনা করি।</p>
            </div>

            {/* Footer Signatures & QR Code */}
            <div className="flex justify-between items-end pt-6 text-[11px] font-bold">
              <div className="text-center space-y-1">
                <div className="border-t border-amber-900/50 pt-1 w-24">অফিস ইনচার্জ</div>
              </div>

              {/* Scannable QR Code Placeholder */}
              <div className="text-center">
                <div className="w-16 h-16 bg-white p-1 rounded-lg border border-amber-900/30 mx-auto flex items-center justify-center font-mono text-[8px] text-slate-500">
                  QR VERIFIED
                </div>
                <span className="text-[9px] font-mono text-amber-900 block mt-1">{selectedCert.certificateNumber}</span>
              </div>

              <div className="text-center space-y-1">
                <div className="border-t border-amber-900/50 pt-1 w-24">মুহতামিম / অধ্যক্ষ</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <AppButton variant="secondary" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                বন্ধ করুন
              </AppButton>
              <AppButton variant="primary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                প্রিন্ট নিন
              </AppButton>
            </div>
          </div>
        </AppModal>
      )}
    </div>
  );
}
