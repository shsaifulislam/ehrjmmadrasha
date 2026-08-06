import React from "react";
import { Download, FileText, Table as TableIcon } from "lucide-react";
import { AppButton } from "./AppButton";

export interface AppExportProps {
  onExport: (format: "csv" | "excel" | "pdf" | "json") => void;
  loading?: boolean;
  className?: string;
}

export const AppExport: React.FC<AppExportProps> = ({
  onExport,
  loading = false,
  className,
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <AppButton
        variant="outline"
        size="sm"
        icon={<Download className="h-3.5 w-3.5" />}
        onClick={() => onExport("csv")}
        loading={loading}
      >
        CSV
      </AppButton>
      <AppButton
        variant="outline"
        size="sm"
        icon={<TableIcon className="h-3.5 w-3.5" />}
        onClick={() => onExport("excel")}
        loading={loading}
      >
        Excel
      </AppButton>
      <AppButton
        variant="outline"
        size="sm"
        icon={<FileText className="h-3.5 w-3.5" />}
        onClick={() => onExport("pdf")}
        loading={loading}
      >
        PDF
      </AppButton>
    </div>
  );
};

export default AppExport;
