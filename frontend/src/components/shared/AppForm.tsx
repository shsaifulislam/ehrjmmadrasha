import React from "react";
import { cn } from "@/lib/utils";

export interface AppFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const AppForm: React.FC<AppFormProps> = ({
  title,
  description,
  onSubmit,
  children,
  actions,
  className,
  ...props
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          {title && <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
        </div>
      )}

      <div className="flex flex-col gap-4">{children}</div>

      {actions && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
          {actions}
        </div>
      )}
    </form>
  );
};

export default AppForm;
