"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  User,
  Users,
  BookOpen,
  FileCheck,
  Printer,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicClasses } from "@/hooks/useAcademic";
import { useSubmitPublicAdmission } from "@/hooks/useCms";
import { toast } from "sonner";

const DEPARTMENTS_LIST = [
  { id: "all", nameBn: "সকল বিভাগ" },
  { id: "nurani", nameBn: "নূরানী / মক্তব বিভাগ" },
  { id: "nazera", nameBn: "নাযেরা বিভাগ" },
  { id: "hifz", nameBn: "হিফজ বিভাগ" },
  { id: "kitab", nameBn: "কিতাব বিভাগ" },
  { id: "takhassus", nameBn: "তাখাস্সুস / উচ্চতর বিভাগ" },
];

export function AdmissionClient() {
  const searchParams = useSearchParams();
  const initialDept = searchParams.get("dept") || "all";

  const { data: classes, isLoading: loadingClasses } = usePublicClasses();
  const submitAdmission = useSubmitPublicAdmission();

  // Wizard Step State (1: Student, 2: Guardian, 3: Academic, 4: Review)
  const [step, setStep] = useState(1);

  // Form Fields
  const [applicantName, setApplicantName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [brn, setBrn] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [religion, setReligion] = useState("ISLAM");
  const [guardianNid, setGuardianNid] = useState("");
  const [previousInstitution, setPreviousInstitution] = useState("");
  const [quota, setQuota] = useState("GENERAL");
  const [village, setVillage] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [upazila, setUpazila] = useState("");
  const [district, setDistrict] = useState("");
  const [applicantNameEn, setApplicantNameEn] = useState("");
  const [fatherNameEn, setFatherNameEn] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [motherNameEn, setMotherNameEn] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [studentType, setStudentType] = useState("RESIDENTIAL");
  const [lastClassResult, setLastClassResult] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [permanentAddress, setPermanentAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [trxId, setTrxId] = useState("");
  const [paymentSenderPhone, setPaymentSenderPhone] = useState("");
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [classId, setClassId] = useState("");

  const [confirmed, setConfirmed] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const [phoneError, setPhoneError] = useState("");
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Check Local Storage for Saved Draft on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ehrj_admission_draft");
      if (saved) {
        setHasSavedDraft(true);
      }
    } catch (e) {}
  }, []);

  // Restore Draft Function
  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem("ehrj_admission_draft");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.applicantName) setApplicantName(data.applicantName);
        if (data.fatherName) setFatherName(data.fatherName);
        if (data.motherName) setMotherName(data.motherName);
        if (data.phone) setPhone(data.phone);
        if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
        if (data.gender) setGender(data.gender);
        if (data.address) setAddress(data.address);
        if (data.classId) setClassId(data.classId);
        toast.success("অসমাপ্ত ভর্তি ড্রাফট পুনরুদ্ধার করা হয়েছে!");
        setHasSavedDraft(false);
      }
    } catch (e) {
      toast.error("ড্রাফট লোড করতে ব্যর্থ হয়েছে");
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("ehrj_admission_draft");
    setHasSavedDraft(false);
    toast.info("ড্রাফট মুছে ফেলা হয়েছে");
  };

  // Auto-Save Draft to LocalStorage when fields change
  useEffect(() => {
    if (applicantName || phone || fatherName) {
      try {
        const draft = {
          applicantName,
          fatherName,
          motherName,
          phone,
          dateOfBirth,
          gender,
          address,
          classId,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("ehrj_admission_draft", JSON.stringify(draft));
      } catch (e) {}
    }
  }, [applicantName, phone, fatherName, motherName, dateOfBirth, gender, address, classId]);

  useEffect(() => {
    if (initialDept && DEPARTMENTS_LIST.some((d) => d.id === initialDept)) {
      setSelectedDept(initialDept);
    }
  }, [initialDept]);


  // Handle Photo Preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("ছবি ৫ মেগাবাইটের (5MB) কম হতে হবে");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Validate Phone
  const validatePhone = (value: string) => {
    setPhone(value);
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (value.length > 0 && !bdPhoneRegex.test(value)) {
      setPhoneError("সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (যেমন: 018XXXXXXXX)");
    } else {
      setPhoneError("");
    }
  };

  // Step Navigation Validators
  const canGoToStep2 = () => applicantName.trim().length >= 2;
  const canGoToStep3 = () => phone.trim().length >= 11 && !phoneError && emergencyPhone.trim().length >= 11 && guardianNid.trim().length >= 10 && village.trim() !== "" && district.trim() !== "";
  const canGoToStep4 = () => Boolean(classId);

  const handleNext = () => {
    if (step === 1 && !canGoToStep2()) {
      toast.error("শিক্ষার্থীর নাম সঠিকভাবে লিখুন");
      return;
    }
    if (step === 2 && !canGoToStep3()) {
      toast.error("সঠিক মোবাইল নম্বর, অভিভাবকের NID এবং বর্তমান ঠিকানা (গ্রাম, জেলা) প্রদান করুন");
      return;
    }
    if (step === 3 && !canGoToStep4()) {
      toast.error("ভর্তির জন্য জামায়াত/শ্রেণী নির্বাচন করুন");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      toast.error("তথ্য সঠিক বলে নিশ্চিতকরণ বক্সে টিক দিন");
      return;
    }

    const formData = new FormData();
    formData.append("applicantName", applicantName.trim());
    formData.append("fatherName", fatherName.trim());
    formData.append("motherName", motherName.trim());
    formData.append("phone", phone.trim());
    if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
    formData.append("gender", gender);
    if (address.trim()) formData.append("address", address.trim());
    if (brn.trim()) formData.append("brn", brn.trim());
    if (bloodGroup.trim()) formData.append("bloodGroup", bloodGroup.trim());
    formData.append("religion", religion);
    if (guardianNid.trim()) formData.append("guardianNid", guardianNid.trim());
    if (previousInstitution.trim()) formData.append("previousInstitution", previousInstitution.trim());
    formData.append("quota", quota);
    if (village.trim()) formData.append("village", village.trim());
    if (postOffice.trim()) formData.append("postOffice", postOffice.trim());
    if (upazila.trim()) formData.append("upazila", upazila.trim());
    if (district.trim()) formData.append("district", district.trim());
    formData.append("classId", classId);
    if (applicantNameEn.trim()) formData.append("applicantNameEn", applicantNameEn.trim());
    if (fatherNameEn.trim()) formData.append("fatherNameEn", fatherNameEn.trim());
    if (fatherOccupation.trim()) formData.append("fatherOccupation", fatherOccupation.trim());
    if (motherNameEn.trim()) formData.append("motherNameEn", motherNameEn.trim());
    if (motherPhone.trim()) formData.append("motherPhone", motherPhone.trim());
    if (emergencyPhone.trim()) formData.append("emergencyPhone", emergencyPhone.trim());
    formData.append("studentType", studentType);
    if (lastClassResult.trim()) formData.append("lastClassResult", lastClassResult.trim());
    if (permanentAddress.trim()) formData.append("permanentAddress", permanentAddress.trim());
    if (paymentMethod) formData.append("paymentMethod", paymentMethod);
    if (trxId.trim()) formData.append("trxId", trxId.trim());
    if (paymentSenderPhone.trim()) formData.append("paymentSenderPhone", paymentSenderPhone.trim());

    try {
      const response = await submitAdmission.mutateAsync(formData);
      const trackingNo =
        response?.data?.data?.id ||
        `EHRJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const verificationToken = response?.data?.data?.verificationToken || "";

      setSubmittedData({
        trackingNo,
        verificationToken,
        applicantName,
        phone,
        className: classes?.find((c) => c.id === classId)?.name || "মনোনীত শ্রেণী",
        applicationDate: new Date().toLocaleDateString("bn-BD"),
      });

      toast.success("ভর্তি আবেদন সফলভাবে জমা হয়েছে!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "আবেদন জমা দেয়া সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট কানেকশন বা তথ্য চেক করুন।"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Printable Area Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-summary,
          #printable-summary * {
            visibility: visible;
          }
          #printable-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-emerald-600 bg-white p-0.5 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার লোগো"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-400 block leading-tight">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">
                জমিরীয়া মাদ্রাসা (স্থাপিত: ২০২১)
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> মূল পাতায় ফিরে যান
          </Link>
        </div>
      </header>

      {hasSavedDraft && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-3 no-print">
          <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>আপনার একটি সংরক্ষণ করা অসমাপ্ত ভর্তি ড্রাফট পাওয়া গেছে।</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={restoreDraft} className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs px-3">
                পুনরুদ্ধার করুন
              </Button>
              <Button size="sm" variant="ghost" onClick={clearDraft} className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 h-7 text-xs px-2">
                বাতিল
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Page Title Header */}
        <div className="text-center space-y-2 no-print">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>অনলাইন ভর্তি আবেদন ফরম</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            নতুন ছাত্র/ছাত্রী ভর্তি ফরম
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-base max-w-xl mx-auto">
            সহজ ৪টি ধাপে শিক্ষার্থীর তথ্য পূরণ করে অনলাইনে ভর্তি নিশ্চিত করুন।
          </p>
        </div>

        {/* Success Screen */}
        {submittedData ? (
          <div id="printable-summary">
            <Card className="border-emerald-300 bg-white dark:bg-slate-900 shadow-lg">
              <CardContent className="pt-8 p-6 sm:p-10 space-y-6 text-center">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                    ভর্তি আবেদন সফলভাবে জমা হয়েছে!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসায় আবেদনের জন্য ধন্যবাদ।
                  </p>
                </div>

                {/* Printable Summary Ticket */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md mx-auto text-left space-y-3">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-semibold uppercase">
                      ট্র্যাকিং নম্বর:
                    </span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                      {submittedData.trackingNo}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">শিক্ষার্থীর নাম:</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {submittedData.applicantName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">ভর্তি যোগ্য শ্রেণী:</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {submittedData.className}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">অভিভাবক ফোন:</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {submittedData.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">আবেদনের তারিখ:</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {submittedData.applicationDate}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 italic text-center border-t">
                    মাদ্রাসা কর্তৃপক্ষ রিভিউ শেষে SMS এর মাধ্যমে ফলাফল জানাবে।
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-4 no-print">
                  {submittedData.verificationToken && (
                    <Link href={`/admission/verify/${submittedData.verificationToken}`}>
                      <Button
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <FileCheck className="h-4 w-4 mr-2" /> এডমিশন স্লিপ দেখুন / ডাউনলোড
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => {
                      setSubmittedData(null);
                      setStep(1);
                      setApplicantName("");
                      setFatherName("");
                      setMotherName("");
                      setPhone("");
                      setAddress("");
                      setBrn("");
                      setBloodGroup("");
                      setGuardianNid("");
                      setVillage("");
                      setPostOffice("");
                      setUpazila("");
                      setDistrict("");
                      setPreviousInstitution("");
                      setClassId("");
                      setPhoto(null);
                      setPhotoPreview(null);
                      setConfirmed(false);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                  >
                    নতুন আবেদন করুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Wizard Form */
          <div className="space-y-6">
            {/* Step Progress Bar Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm no-print">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div
                  className={`py-2 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    step >= 1
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">১. শিক্ষার্থীর তথ্য</span>
                  <span className="sm:hidden">১. শিক্ষার্থী</span>
                </div>

                <div
                  className={`py-2 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    step >= 2
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">২. অভিভাবকের তথ্য</span>
                  <span className="sm:hidden">২. অভিভাবক</span>
                </div>

                <div
                  className={`py-2 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    step >= 3
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">৩. একাডেমিক তথ্য</span>
                  <span className="sm:hidden">৩. শ্রেণী</span>
                </div>

                <div
                  className={`py-2 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    step >= 4
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                >
                  <FileCheck className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">৪. পর্যালোচনা</span>
                  <span className="sm:hidden">৪. জমা দিন</span>
                </div>
              </div>
            </div>

            {/* Form Steps Card */}
            <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="pt-6 sm:pt-8 p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* STEP 1: Applicant Info */}
                  {step === 1 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="border-b pb-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <User className="h-5 w-5 text-emerald-600" /> ১. শিক্ষার্থীর ব্যক্তিগত তথ্য
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="applicantName" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              শিক্ষার্থীর পূর্ণ নাম (বাংলায়) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="applicantName"
                              value={applicantName}
                              onChange={(e) => setApplicantName(e.target.value)}
                              placeholder="যেমন: আব্দুল্লাহ আল মামুন"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="applicantNameEn" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              Student's Full Name (In English)
                            </label>
                            <Input
                              id="applicantNameEn"
                              value={applicantNameEn}
                              onChange={(e) => setApplicantNameEn(e.target.value)}
                              placeholder="e.g. Abdullah Al Mamun"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="genderSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              লিঙ্গ <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="genderSelect"
                              value={gender}
                              onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
                              className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="MALE">ছাত্র (Male)</option>
                              <option value="FEMALE">ছাত্রী (Female)</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="dobInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              জন্ম তারিখ (ঐচ্ছিক)
                            </label>
                            <Input
                              id="dobInput"
                              type="date"
                              value={dateOfBirth}
                              onChange={(e) => setDateOfBirth(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="brnInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              জন্ম নিবন্ধন নম্বর (BRN)
                            </label>
                            <Input
                              id="brnInput"
                              type="text"
                              placeholder="17 ডিজিট"
                              value={brn}
                              onChange={(e) => setBrn(e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="bloodGroupSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              রক্তের গ্রুপ
                            </label>
                            <select
                              id="bloodGroupSelect"
                              value={bloodGroup}
                              onChange={(e) => setBloodGroup(e.target.value)}
                              className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="">নির্বাচন করুন</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="religionSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              ধর্ম <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="religionSelect"
                              value={religion}
                              onChange={(e) => setReligion(e.target.value)}
                              className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="ISLAM">ইসলাম</option>
                              <option value="HINDUISM">হিন্দু</option>
                              <option value="OTHER">অন্যান্য</option>
                            </select>
                          </div>
                        </div>

                        {/* Photo Upload */}
                        <div>
                          <label htmlFor="photoUpload" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            শিক্ষার্থীর ছবি (মেগাবাইট সর্বোচ্চ 5MB, ঐচ্ছিক)
                          </label>
                          <div className="flex items-center gap-4">
                            {photoPreview ? (
                              <div className="h-20 w-20 rounded-lg overflow-hidden border-2 border-emerald-600 relative shrink-0">
                                <img
                                  src={photoPreview}
                                  alt="ছবি প্রিভিউ"
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0">
                                <Upload className="h-6 w-6 mb-1" />
                                <span className="text-[10px]">ছবি আপলোড</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <Input
                                id="photoUpload"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="text-xs"
                              />
                              <p className="text-[11px] text-slate-500 mt-1">
                                JPG, PNG বা WebP ফরম্যাটে ছবি সিলেক্ট করুন।
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Guardian Info */}
                  {step === 2 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="border-b pb-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Users className="h-5 w-5 text-emerald-600" /> ২. অভিভাবকের তথ্য ও যোগাযোগ
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="fatherName" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              পিতার নাম (বাংলায়) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="fatherName"
                              value={fatherName}
                              onChange={(e) => setFatherName(e.target.value)}
                              placeholder="পিতার পূর্ণ নাম"
                            />
                          </div>
                          <div>
                            <label htmlFor="fatherNameEn" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              Father's Name (In English)
                            </label>
                            <Input
                              id="fatherNameEn"
                              value={fatherNameEn}
                              onChange={(e) => setFatherNameEn(e.target.value)}
                              placeholder="Father's full name"
                            />
                          </div>
                          <div>
                            <label htmlFor="fatherOccupation" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              পিতার পেশা
                            </label>
                            <Input
                              id="fatherOccupation"
                              value={fatherOccupation}
                              onChange={(e) => setFatherOccupation(e.target.value)}
                              placeholder="ব্যবসা / চাকরি / শিক্ষকতা..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="motherName" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              মাতার নাম (বাংলায়)
                            </label>
                            <Input
                              id="motherName"
                              value={motherName}
                              onChange={(e) => setMotherName(e.target.value)}
                              placeholder="মাতার পূর্ণ নাম"
                            />
                          </div>
                          <div>
                            <label htmlFor="motherNameEn" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              Mother's Name (In English)
                            </label>
                            <Input
                              id="motherNameEn"
                              value={motherNameEn}
                              onChange={(e) => setMotherNameEn(e.target.value)}
                              placeholder="Mother's full name"
                            />
                          </div>
                          <div>
                            <label htmlFor="motherPhone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              মাতার মোবাইল নম্বর
                            </label>
                            <Input
                              id="motherPhone"
                              type="tel"
                              value={motherPhone}
                              onChange={(e) => setMotherPhone(e.target.value)}
                              placeholder="017XXXXXXXX"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="phoneInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              পিতার/অভিভাবকের মোবাইল <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="phoneInput"
                              type="tel"
                              value={phone}
                              onChange={(e) => validatePhone(e.target.value)}
                              placeholder="018XXXXXXXX"
                              required
                            />
                            {phoneError && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> {phoneError}
                              </p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="emergencyPhone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              জরুরি যোগাযোগের নম্বর <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="emergencyPhone"
                              type="tel"
                              value={emergencyPhone}
                              onChange={(e) => setEmergencyPhone(e.target.value)}
                              placeholder="019XXXXXXXX"
                            />
                          </div>
                          <div>
                            <label htmlFor="guardianNid" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              অভিভাবকের এনআইডি (NID) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              id="guardianNid"
                              type="text"
                              value={guardianNid}
                              onChange={(e) => setGuardianNid(e.target.value)}
                              placeholder="১০ বা ১৭ ডিজিট"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                            বর্তমান ঠিকানা <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Input placeholder="গ্রাম/মহল্লা" value={village} onChange={e => setVillage(e.target.value)} />
                            <Input placeholder="ডাকঘর" value={postOffice} onChange={e => setPostOffice(e.target.value)} />
                            <Input placeholder="উপজেলা/থানা" value={upazila} onChange={e => setUpazila(e.target.value)} />
                            <Input placeholder="জেলা" value={district} onChange={e => setDistrict(e.target.value)} />
                          </div>
                          <textarea
                            id="addressInput"
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="বিস্তারিত ঠিকানা..."
                          />

                          <div className="pt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id="sameAddressCheck"
                                checked={sameAddress}
                                onChange={(e) => {
                                  setSameAddress(e.target.checked);
                                  if (e.target.checked) {
                                    setPermanentAddress([village, postOffice, upazila, district, address].filter(Boolean).join(', '));
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <label htmlFor="sameAddressCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                বর্তমান ঠিকানা ও স্থায়ী ঠিকানা একই
                              </label>
                            </div>
                            {!sameAddress && (
                              <textarea
                                rows={2}
                                value={permanentAddress}
                                onChange={(e) => setPermanentAddress(e.target.value)}
                                className="w-full border rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="স্থায়ী ঠিকানা (গ্রাম, ডাকঘর, থানা, জেলা)..."
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Academic Info */}
                  {step === 3 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="border-b pb-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-emerald-600" /> ৩. একাডেমিক বিভাগ ও শ্রেণী নির্বাচন
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="deptSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            শিক্ষা বিভাগ ফিল্টার করুন
                          </label>
                          <select
                            id="deptSelect"
                            value={selectedDept}
                            onChange={(e) => {
                              setSelectedDept(e.target.value);
                              setClassId("");
                            }}
                            className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                          >
                            {DEPARTMENTS_LIST.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.nameBn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="classSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            আবেদনকৃত জামায়াত / শ্রেণী <span className="text-red-500">*</span>
                          </label>
                          {loadingClasses ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> জামায়াত তালিকা লোড হচ্ছে...
                            </div>
                          ) : (
                            <select
                              id="classSelect"
                              value={classId}
                              onChange={(e) => setClassId(e.target.value)}
                              className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900 dark:text-slate-100"
                              required
                            >
                              <option value="">-- শ্রেণী নির্বাচন করুন --</option>
                              {classes?.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            শিক্ষার্থীর ধরন (Student Type) <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'RESIDENTIAL', label: 'আবাসিক (Residential)' },
                              { id: 'NON_RESIDENTIAL', label: 'অনাবাসিক (Non-Residential)' },
                              { id: 'DAY_CARE', label: 'ডে-কেয়ার (Day Care)' },
                            ].map((type) => (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => setStudentType(type.id)}
                                className={`p-2.5 rounded-lg border text-xs font-bold transition-colors ${
                                  studentType === type.id
                                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                          <div>
                            <label htmlFor="previousInstitution" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              পূর্ববর্তী শিক্ষা প্রতিষ্ঠান (যদি থাকে)
                            </label>
                            <Input
                              id="previousInstitution"
                              type="text"
                              value={previousInstitution}
                              onChange={(e) => setPreviousInstitution(e.target.value)}
                              placeholder="প্রতিষ্ঠানের নাম"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastClassResult" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              সর্বশেষ শ্রেণী ও ফলাফল
                            </label>
                            <Input
                              id="lastClassResult"
                              type="text"
                              value={lastClassResult}
                              onChange={(e) => setLastClassResult(e.target.value)}
                              placeholder="যেমন: ৫ম শ্রেণী (GPA 5.00)"
                            />
                          </div>
                          <div>
                            <label htmlFor="quotaSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                              কোটা (যদি থাকে)
                            </label>
                            <select
                              id="quotaSelect"
                              value={quota}
                              onChange={(e) => setQuota(e.target.value)}
                              className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="GENERAL">সাধারণ (General)</option>
                              <option value="ORPHAN">এতিম (Orphan)</option>
                              <option value="POOR">দরিদ্র (Poor)</option>
                              <option value="TEACHER_CHILD">শিক্ষক/কর্মচারী সন্তান</option>
                              <option value="SPECIAL_NEEDS">বিশেষ চাহিদা সম্পন্ন</option>
                              <option value="OTHER">অন্যান্য</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Review & Payment & Submit */}
                  {step === 4 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="border-b pb-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-emerald-600" /> ৪. আবেদন তথ্য পর্যালোচনা ও অনলাইন ফি যাচাই
                        </h2>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block">শিক্ষার্থীর নাম:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {applicantName} {applicantNameEn ? `(${applicantNameEn})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">লিঙ্গ ও ধরন:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {gender === "MALE" ? "ছাত্র (Male)" : "ছাত্রী (Female)"} | {studentType === 'RESIDENTIAL' ? 'আবাসিক' : studentType === 'NON_RESIDENTIAL' ? 'অনাবাসিক' : 'ডে-কেয়ার'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">অভিভাবকের মোবাইল:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                              {phone}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">আবেদনকৃত শ্রেণী:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                              {classes?.find((c) => c.id === classId)?.name || "নির্বাচন করা হয়নি"}
                            </span>
                          </div>
                          {fatherName && (
                            <div>
                              <span className="text-slate-500 block">পিতার নাম:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{fatherName}</span>
                            </div>
                          )}
                          {motherName && (
                            <div>
                              <span className="text-slate-500 block">মাতার নাম:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{motherName}</span>
                            </div>
                          )}
                        </div>

                        {/* Online Payment Information */}
                        <div className="border-t pt-4 space-y-3">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            অনলাইন আবেদন ফি প্রদান (পেমেন্ট ভেরিফিকেশন)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label htmlFor="paymentMethodSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                পেমেন্ট মাধ্যম
                              </label>
                              <select
                                id="paymentMethodSelect"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full border rounded-lg p-2 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none"
                              >
                                <option value="bKash">bKash (বিকাশ)</option>
                                <option value="Nagad">Nagad (নগদ)</option>
                                <option value="Rocket">Rocket (রকেট)</option>
                                <option value="Bank Transfer">ব্যাংক ট্রান্সফার</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="trxIdInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                ট্রানজেকশন আইডি (TrxID)
                              </label>
                              <Input
                                id="trxIdInput"
                                value={trxId}
                                onChange={(e) => setTrxId(e.target.value)}
                                placeholder="e.g. 9J28XKLM"
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <label htmlFor="paymentSenderPhoneInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                প্রেরক মোবাইল নম্বর
                              </label>
                              <Input
                                id="paymentSenderPhoneInput"
                                value={paymentSenderPhone}
                                onChange={(e) => setPaymentSenderPhone(e.target.value)}
                                placeholder="017XXXXXXXX"
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t">
                          <input
                            type="checkbox"
                            id="confirmCheck"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <label htmlFor="confirmCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                            আমি নিশ্চিত করছি যে আবেদনে প্রদত্ত সকল তথ্য সঠিক ও নির্ভুল। মাদ্রাসার সকল নিয়ম-কানুন মেনে চলতে বাধ্য থাকব।
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons Footer */}
                  <div className="flex justify-between items-center pt-6 border-t no-print">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrev}
                        className="text-xs sm:text-sm font-semibold"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী ধাপ
                      </Button>
                    ) : (
                      <div />
                    )}

                    {step < 4 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm"
                      >
                        পরবর্তী ধাপ <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitAdmission.isPending || !confirmed}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 text-xs sm:text-sm"
                      >
                        {submitAdmission.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> জমা হচ্ছে...
                          </>
                        ) : (
                          "ভর্তি আবেদন জমা দিন"
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
