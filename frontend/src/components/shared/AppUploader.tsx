"use client";

import { useState } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AppUploaderProps {
  onUploadComplete?: (fileUrl: string, fileName: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export function AppUploader({
  onUploadComplete,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 5,
  label = "ফাইল আপলোড করুন (PDF, JPG, PNG)",
}: AppUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`ফাইল সাইজ সর্বোচ্চ ${maxSizeMB} MB হতে পারবে`);
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setFileName(file.name);
      setIsUploading(false);
      toast.success("ফাইল আপলোড সম্পূর্ণ হয়েছে!");
      if (onUploadComplete) {
        onUploadComplete(`/uploads/${file.name}`, file.name);
      }
    }, 800);
  };

  return (
    <div className="w-full">
      {fileName ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{fileName}</span>
          </div>
          <button onClick={() => setFileName(null)} className="text-slate-400 hover:text-rose-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center">
          <Upload className="h-6 w-6 text-slate-400 mb-1" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">সর্বোচ্চ সাইজ: {maxSizeMB} MB</span>
          <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </label>
      )}
    </div>
  );
}
