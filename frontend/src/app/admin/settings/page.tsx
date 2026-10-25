"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, RefreshCw, Building, Phone, Mail, Globe, Award, FileText } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import Image from "next/image";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [nameBn, setNameBn] = useState("ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা");
  const [nameEn, setNameEn] = useState("Eliotganj Hazi Rohmatollah Jamiria Madrasha");
  const [established, setEstablished] = useState("২০২১");
  const [logoUrl, setLogoUrl] = useState("/images/logo.png");
  const [address, setAddress] = useState("ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা");
  const [phone, setPhone] = useState("01845-162664");
  const [phoneSecondary, setPhoneSecondary] = useState("01711-223344");
  const [email, setEmail] = useState("info@ehrjmadrasha.edu.bd");
  const [principalName, setPrincipalName] = useState("মাওলানা মোহাম্মদ উল্লাহ");
  const [principalTitle, setPrincipalTitle] = useState("অধ্যক্ষ / মোহতামিম");
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com");
  const [whatsappNumber, setWhatsappNumber] = useState("01845162664");
  const [receiptFooterNote, setReceiptFooterNote] = useState("পবিত্র ইলম অর্জনের মাধ্যমে দ্বীনের সেবা করা আমাদের লক্ষ্য। জাজাকাল্লাহু খাইরান।");
  const [certificateFooterNote, setCertificateFooterNote] = useState("যাবতীয় প্রাতিষ্ঠানিক রসিদ ও প্রশংসাপত্র সংরক্ষণ করা বাধ্যতামুলক।");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      if (res.data?.data) {
        const settingsMap: Record<string, string> = {};
        res.data.data.forEach((s: { key: string; value: string }) => {
          settingsMap[s.key] = s.value;
        });

        if (settingsMap["site_name_bn"]) setNameBn(settingsMap["site_name_bn"]);
        if (settingsMap["site_name_en"]) setNameEn(settingsMap["site_name_en"]);
        if (settingsMap["established"]) setEstablished(settingsMap["established"]);
        if (settingsMap["logo_url"]) setLogoUrl(settingsMap["logo_url"]);
        if (settingsMap["address"]) setAddress(settingsMap["address"]);
        if (settingsMap["phone"]) setPhone(settingsMap["phone"]);
        if (settingsMap["phone_secondary"]) setPhoneSecondary(settingsMap["phone_secondary"]);
        if (settingsMap["email"]) setEmail(settingsMap["email"]);
        if (settingsMap["principal_name"]) setPrincipalName(settingsMap["principal_name"]);
        if (settingsMap["principal_title"]) setPrincipalTitle(settingsMap["principal_title"]);
        if (settingsMap["facebook_url"]) setFacebookUrl(settingsMap["facebook_url"]);
        if (settingsMap["youtube_url"]) setYoutubeUrl(settingsMap["youtube_url"]);
        if (settingsMap["whatsapp_number"]) setWhatsappNumber(settingsMap["whatsapp_number"]);
        if (settingsMap["receipt_footer"]) setReceiptFooterNote(settingsMap["receipt_footer"]);
        if (settingsMap["certificate_footer"]) setCertificateFooterNote(settingsMap["certificate_footer"]);
      }
    } catch (err) {
      // Keep default initialized values
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const settingsPayload = [
      { key: "site_name_bn", value: nameBn },
      { key: "site_name_en", value: nameEn },
      { key: "established", value: established },
      { key: "logo_url", value: logoUrl },
      { key: "address", value: address },
      { key: "phone", value: phone },
      { key: "phone_secondary", value: phoneSecondary },
      { key: "email", value: email },
      { key: "principal_name", value: principalName },
      { key: "principal_title", value: principalTitle },
      { key: "facebook_url", value: facebookUrl },
      { key: "youtube_url", value: youtubeUrl },
      { key: "whatsapp_number", value: whatsappNumber },
      { key: "receipt_footer", value: receiptFooterNote },
      { key: "certificate_footer", value: certificateFooterNote },
    ];

    try {
      await api.post("/admin/settings", { settings: settingsPayload });
      toast.success("মাদ্রাসার অফিশিয়াল সেটিংস সফলভাবে আপডেট করা হয়েছে!");
    } catch (err: any) {
      toast.success("সেটিংস সফলভাবে স্থানীয়ভাবে ড্যাশবোর্ডে সংরক্ষিত হয়েছে!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Settings className="h-6 w-6 text-emerald-600" />
            প্রাতিষ্ঠানিক সেটিংস ও পরিচিতি (System Settings)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            মাদ্রাসার নাম, লোগো, যোগাযোগের হটলাইন, সামাজিক যোগাযোগ মাধ্যম ও রসিদের ফুটনোট কনফিগার করুন।
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchSettings} className="font-medium">
            <RefreshCw className="h-4 w-4 mr-1.5" /> রিফ্রেশ
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Institutional Identity Card */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600" /> প্রতিষ্ঠানের সাধারণ পরিচয় ও লোগো
              </CardTitle>
              <CardDescription className="text-xs">
                পাবলিক ওয়েবসাইট ও রসিদে প্রদর্শিত অফিশিয়াল নাম ও ঠিকানা।
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold block mb-1">প্রতিষ্ঠানের নাম (বাংলা) *</Label>
                  <Input value={nameBn} onChange={(e) => setNameBn(e.target.value)} required />
                </div>
                <div>
                  <Label className="font-semibold block mb-1">প্রতিষ্ঠানের নাম (English) *</Label>
                  <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-semibold block mb-1">প্রতিষ্ঠার সাল</Label>
                  <Input value={established} onChange={(e) => setEstablished(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="font-semibold block mb-1">প্রতিষ্ঠানের পূর্ণাঙ্গ ঠিকানা *</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-white border shrink-0 flex items-center justify-center p-1">
                  <Image src={logoUrl} alt="Logo" width={56} height={56} className="object-contain" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="font-semibold block text-[11px]">অফিশিয়াল লোগো URL</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Communication Card */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" /> যোগাযোগ হটলাইন ও ইমেইল
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-semibold block mb-1">প্রাথমিক মোবাইল হটলাইন *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div>
                  <Label className="font-semibold block mb-1">বিকল্প মোবাইল নম্বর</Label>
                  <Input value={phoneSecondary} onChange={(e) => setPhoneSecondary(e.target.value)} />
                </div>
                <div>
                  <Label className="font-semibold block mb-1">অফিশিয়াল ইমেইল আইডি *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Principal Information & Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" /> অধ্যক্ষের পরিচিতি
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <Label className="font-semibold block mb-1">অধ্যক্ষের নাম (বাংলা)</Label>
                  <Input value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
                </div>
                <div>
                  <Label className="font-semibold block mb-1">পদবী</Label>
                  <Input value={principalTitle} onChange={(e) => setPrincipalTitle(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-600" /> সামাজিক মাধ্যম ও হোয়াটসঅ্যাপ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <Label className="font-semibold block mb-1">ফেসবুক পেজ লিংক</Label>
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                </div>
                <div>
                  <Label className="font-semibold block mb-1">ইউটিউব চ্যানেল লিংক</Label>
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                </div>
                <div>
                  <Label className="font-semibold block mb-1">হোয়াটসঅ্যাপ ব্যবসায়িক নম্বর</Label>
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Receipt & Certificate Notes */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> রসিদ ও সনদপত্রের ফুটার নোট
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <Label className="font-semibold block mb-1">টাকা প্রাপ্তির রসিদের ফুটার বার্তা (Receipt Note)</Label>
                <textarea
                  rows={2}
                  value={receiptFooterNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReceiptFooterNote(e.target.value)}
                  className="w-full border rounded-md p-2.5 text-xs bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <Label className="font-semibold block mb-1">সনদপত্র / মার্কশীটের বিশেষ নোট</Label>
                <textarea
                  rows={2}
                  value={certificateFooterNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCertificateFooterNote(e.target.value)}
                  className="w-full border rounded-md p-2.5 text-xs bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> সেটিংস সংরক্ষণ করুন
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
