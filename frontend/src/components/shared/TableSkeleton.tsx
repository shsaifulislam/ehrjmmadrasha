"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 p-3 flex gap-4">
          {Array.from({ length: columns }).map((_, idx) => (
            <div key={idx} className="h-4 flex-1 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={rIdx} className="p-4 flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, cIdx) => (
                <div key={cIdx} className="h-4 flex-1 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="h-7 w-20 bg-slate-300 dark:bg-slate-700 rounded mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
