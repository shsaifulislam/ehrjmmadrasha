"use client";

import React from "react";
import EhrjModal from "./EhrjModal";
import EhrjButton from "./EhrjButton";
import { AlertTriangle } from "lucide-react";

export interface EhrjConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export function EhrjConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "নিশ্চিত করুন",
  cancelLabel = "বাতিল",
  variant = "danger",
  loading = false,
}: EhrjConfirmDialogProps) {
  return (
    <EhrjModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              variant === "danger"
                ? "bg-red-100 text-red-600"
                : variant === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-[#0D5C3A]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <EhrjButton variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </EhrjButton>
          <EhrjButton
            variant={variant === "danger" ? "danger" : variant === "warning" ? "gold" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </EhrjButton>
        </>
      }
    >
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">{message}</p>
    </EhrjModal>
  );
}

export default EhrjConfirmDialog;
