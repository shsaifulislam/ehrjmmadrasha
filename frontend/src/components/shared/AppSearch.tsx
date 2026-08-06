import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppSearchProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const AppSearch: React.FC<AppSearchProps> = ({
  value = "",
  onSearch,
  placeholder = "খুঁজুন...",
  debounceMs = 300,
  className,
}) => {
  const [term, setTerm] = useState(value);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(term);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [term, debounceMs, onSearch]);

  const handleClear = () => {
    setTerm("");
    onSearch("");
  };

  return (
    <div className={cn("relative flex items-center w-full max-w-xs", className)}>
      <Search className="absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      />
      {term && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          aria-label="Clear Search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default AppSearch;
