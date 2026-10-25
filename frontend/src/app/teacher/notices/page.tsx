"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, FileText } from "lucide-react";
import api from "@/lib/axios";

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotices() {
      try {
        const res = await api.get("/public/notices");
        if (res.data?.data) {
          setNotices(res.data.data);
        }
      } catch (err) {
        // Fallback mock notices
        setNotices([
          { id: "1", title: "নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম ও দিকনির্দেশনা", createdAt: "2026-07-20", type: "GENERAL", content: "সকল শিক্ষক মহোদয়কে ভর্তি কার্যক্রমে সহযোগিতা করার বিনীত অনুরোধ করা যাচ্ছে।" },
          { id: "2", title: "অর্ধবার্ষিক পরীক্ষার সময়সূচী সংক্রান্ত জরুরি মিটিং", createdAt: "2026-07-18", type: "EXAM", content: "আগামীকাল জোহর নামাজের পর শিক্ষক মিলনায়তনে জরুরি সভা অনুষ্ঠিত হবে।" }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="h-6 w-6 text-emerald-600" /> শিক্ষক নোটিশ বোর্ড
        </h1>
        <p className="text-xs text-slate-500 mt-1">মাদ্রাসা প্রশাসন থেকে প্রকাশিত শিক্ষক নোটিশসমূহ</p>
      </div>

      <div className="space-y-4">
        {notices.map((n) => (
          <Card key={n.id} className="shadow-sm border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold text-slate-800">{n.title}</CardTitle>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {n.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>প্রকাশের তারিখ: {new Date(n.createdAt).toLocaleDateString('bn-BD')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
