import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400">৪০৪</p>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            পেজটি খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-sm text-slate-500">
            আপনি যে পেজটি খুঁজছেন সেটি সরিয়ে দেওয়া হয়েছে অথবা URL ভুল হতে পারে।
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition"
          >
            হোমপেজে যান
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ড্যাশবোর্ডে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
