"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Banknote,
  Receipt,
  ArrowRight,
  CreditCard,
  UserCog,
  Calendar,
  Wallet,
  AlertCircle,
  BookOpen,
  FileText,
  PlusCircle,
  Bell,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { AuthUser } from "@/lib/types";

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse bg-card border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="h-7 w-16 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useDashboardStats();

  // Fetch current user for mustChangePassword hardening
  const { data: currentUser } = useQuery<AuthUser>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      router.push("/change-password");
    }
  }, [currentUser, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground text-lg font-medium">ড্যাশবোর্ড ডাটা লোড করা যায়নি</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          আবার চেষ্টা করুন
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      title: "মোট ছাত্র",
      value: stats?.totalStudents ?? 0,
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      href: "/admin/students",
    },
    {
      title: "মোট শিক্ষক",
      value: stats?.totalTeachers ?? 0,
      icon: UserCog,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      href: "/admin/teachers",
    },
    {
      title: "শ্রেণী",
      value: stats?.totalClasses ?? 0,
      icon: BookOpen,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      href: "/admin/classes",
    },
    {
      title: "ভর্তি আবেদন",
      value: stats?.totalAdmissions ?? 0,
      icon: FileText,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      href: "/admin/admissions",
    },
    {
      title: "আজকের আয়",
      value: `৳ ${(stats?.todayIncome ?? 0).toLocaleString("bn-BD")}`,
      icon: Banknote,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      href: "/admin/finance/invoices",
    },
    {
      title: "আজকের ব্যয়",
      value: `৳ ${(stats?.todayExpense ?? 0).toLocaleString("bn-BD")}`,
      icon: CreditCard,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      href: "/admin/expenses",
    },
    {
      title: "এই মাসের আয়",
      value: `৳ ${(stats?.monthlyIncome ?? 0).toLocaleString("bn-BD")}`,
      icon: Wallet,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/40",
      href: "/admin/finance/invoices",
    },
    {
      title: "মোট বকেয়া",
      value: `৳ ${(stats?.monthlyDue ?? 0).toLocaleString("bn-BD")}`,
      icon: Receipt,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
      href: "/admin/finance/due",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            অ্যাডমিন ড্যাশবোর্ড
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার সার্বিক কার্যকলাপে আপনাকে স্বাগতম।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/finance/collect">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
              <Banknote className="h-4 w-4 mr-1.5" /> ফি সংগ্রহ
            </Button>
          </Link>
          <Link href="/admin/admissions">
            <Button variant="outline" size="sm" className="font-semibold">
              <FileText className="h-4 w-4 mr-1.5" /> ভর্তি আবেদন
            </Button>
          </Link>
        </div>
      </div>

      {/* Must Change Password Alert */}
      {currentUser?.mustChangePassword && (
        <Card className="border-red-300 bg-red-50/70 dark:bg-red-950/40">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <p className="font-bold text-red-800 dark:text-red-300 text-xs sm:text-sm">
                নিরাপত্তার জন্য আপনার একাউন্টের পাসওয়ার্ড অবিলম্বে পরিবর্তন করা প্রয়োজন।
              </p>
            </div>
            <Link href="/change-password">
              <Button size="sm" variant="destructive" className="font-bold">
                পাসওয়ার্ড পরিবর্তন করুন
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pending Admissions Alert */}
      {stats && stats.pendingAdmissions > 0 && (
        <Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/40 border-l-4 border-l-amber-500">
          <CardContent className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                {stats.pendingAdmissions.toLocaleString("bn-BD")} টি নতুন অনলাইন ভর্তি আবেদন অনুমোদনের অপেক্ষায় রয়েছে।
              </p>
            </div>
            <Link href="/admin/admissions">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                আবেদনসমূহ দেখুন <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Stats Grid */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link key={i} href={stat.href}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border-slate-200 dark:border-slate-800 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base sm:text-2xl font-extrabold tracking-tight text-foreground">
                      {typeof stat.value === "number" ? stat.value.toLocaleString("bn-BD") : stat.value}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Action Shortcuts Grid */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-emerald-600" /> দ্রুত নেভিগেশন ও কাজ (Quick Shortcuts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "ফি সংগ্রহ", href: "/admin/finance/collect", icon: Banknote, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" },
              { label: "নতুন ছাত্র যোগ", href: "/admin/students", icon: Users, color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40" },
              { label: "ভর্তি আবেদন", href: "/admin/admissions", icon: FileText, color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40" },
              { label: "নোটিশ দিন", href: "/admin/notices", icon: Bell, color: "text-purple-700 bg-purple-50 dark:bg-purple-950/40" },
              { label: "নম্বর এন্ট্রি", href: "/admin/results", icon: GraduationCap, color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40" },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link key={idx} href={action.href}>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {action.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue vs Expense Visual & Attendance Overview */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Income vs Expense Bar */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> আয় বনাম ব্যয় (এই মাস)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">মোট আয়</span>
                  <span className="font-mono font-bold text-emerald-700">৳ {(stats?.monthlyIncome ?? 0).toLocaleString("bn-BD")}</span>
                </div>
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, ((stats?.monthlyIncome ?? 0) / Math.max((stats?.monthlyIncome ?? 1), (stats?.monthlyExpense ?? 1))) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-700 dark:text-rose-400">মোট ব্যয়</span>
                  <span className="font-mono font-bold text-rose-700">৳ {(stats?.monthlyExpense ?? 0).toLocaleString("bn-BD")}</span>
                </div>
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, ((stats?.monthlyExpense ?? 0) / Math.max((stats?.monthlyIncome ?? 1), (stats?.monthlyExpense ?? 1))) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-2 border-t flex justify-between text-xs">
              <span className="font-semibold text-slate-600">নিট ব্যালেন্স:</span>
              <span className={`font-mono font-bold ${((stats?.monthlyIncome ?? 0) - (stats?.monthlyExpense ?? 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ৳ {((stats?.monthlyIncome ?? 0) - (stats?.monthlyExpense ?? 0)).toLocaleString("bn-BD")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance & Collection Summary */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" /> আজকের কার্যক্রম সারাংশ
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-lg font-black text-blue-700 dark:text-blue-300">{stats?.todayPresentCount ?? "-"}</p>
                <span className="text-[10px] text-blue-600">আজ উপস্থিত</span>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center">
                <p className="text-lg font-black text-red-700 dark:text-red-300">{stats?.todayAbsentCount ?? "-"}</p>
                <span className="text-[10px] text-red-600">আজ অনুপস্থিত</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">৳ {(stats?.todayIncome ?? 0).toLocaleString("bn-BD")}</p>
                <span className="text-[10px] text-emerald-600">আজকের আদায়</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-lg font-black text-amber-700 dark:text-amber-300">{stats?.pendingAdmissions ?? 0}</p>
                <span className="text-[10px] text-amber-600">অপেক্ষমাণ ভর্তি</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview & Recent Transactions */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Recent Payments List (4 Columns) */}
        <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-600" /> সাম্প্রতিক ফি আদায়সমূহ
            </CardTitle>
            <Link href="/admin/finance/invoices">
              <Button variant="ghost" size="sm" className="text-emerald-700 dark:text-emerald-400 font-bold text-xs h-8">
                সকল পেমেন্ট <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                ))}
              </div>
            ) : !stats?.recentPayments?.length ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                সাম্প্রতিক কোনো ফি সংগ্রহের রেকর্ড পাওয়া যায়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {payment.studentName}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {payment.className} • গ্রহীতা: {payment.receivedBy || "অ্যাডমিন"}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                        +৳ {payment.amount.toLocaleString("bn-BD")}
                      </p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {payment.method}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Logs Feed (3 Columns) */}
        <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> সাম্প্রতিক কার্যক্রম (Audit Log)
            </CardTitle>
            <Link href="/admin/audit-logs">
              <Button variant="ghost" size="sm" className="text-primary font-bold text-xs h-8">
                লগসমূহ <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                ))}
              </div>
            ) : !stats?.recentActivities?.length ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                কোনো সাম্প্রতিক লগ রেকর্ড নেই।
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {act.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(act.date).toLocaleDateString("bn-BD")}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] truncate" title={act.details || ""}>
                      {act.details || act.resource}
                    </p>
                    <p className="text-[10px] text-muted-foreground">ইউজার: {act.user}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
