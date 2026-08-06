export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative mx-auto">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-200 dark:border-emerald-900 border-t-emerald-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
          লোড হচ্ছে...
        </p>
      </div>
    </div>
  );
}
