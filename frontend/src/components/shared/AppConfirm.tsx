import React from "react";
import { AlertTriangle } from "lucide-react";
import { AppModal } from "./AppModal";
import { AppButton } from "./AppButton";

export interface AppConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export const AppConfirm: React.FC<AppConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "আপনি কি নিশ্চিত?",
  description = "এই প্রক্রিয়াটি সম্পন্ন করলে পূর্বের তথ্য পুনরুদ্ধার করা সম্ভব নাও হতে পারে।",
  confirmText = "হ্যাঁ, নিশ্চিত করুন",
  cancelText = "বাতিল",
  variant = "danger",
  loading = false,
}) => {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <AppButton variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </AppButton>
          <AppButton
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </AppButton>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-2 gap-3">
        <div className="p-3 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </AppModal>
  );
};

export default AppConfirm;
