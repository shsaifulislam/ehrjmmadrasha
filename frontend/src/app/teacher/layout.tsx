"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  UserCheck, 
  FileSpreadsheet, 
  Users, 
  CalendarDays, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TeacherLayoutProps {
  children: ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [teacherName, setTeacherName] = useState("সহকারী শিক্ষক");

  useEffect(() => {
    // Check if token exists
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.nameBn || u.name) {
          setTeacherName(u.nameBn || u.name);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("সফলভাবে লগআউট হয়েছে");
    router.push("/login");
  };

  const navItems = [
    { title: "ড্যাশবোর্ড", href: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "উপস্থিতি গ্রহণ", href: "/teacher/attendance", icon: UserCheck },
    { title: "নম্বর ইনপুট", href: "/teacher/marks", icon: FileSpreadsheet },
    { title: "ছাত্রদের তালিকা", href: "/teacher/students", icon: Users },
    { title: "ক্লাস রুটিন", href: "/teacher/routine", icon: CalendarDays },
    { title: "নোটিশ বোর্ড", href: "/teacher/notices", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-emerald-950 text-white border-r border-emerald-800">
        <div className="p-4 flex items-center gap-3 border-b border-emerald-900 bg-emerald-900/50">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg border border-emerald-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-emerald-100 line-clamp-1">শিক্ষক পোর্টাল</h2>
            <p className="text-xs text-emerald-300">ই.হা.র.জ. মাদ্রাসা</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-emerald-600 text-white font-semibold shadow" 
                    : "text-emerald-100 hover:bg-emerald-900/60 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-900 bg-emerald-950">
          <div className="mb-3 px-2">
            <p className="text-xs text-emerald-400">লগইনকৃত শিক্ষক:</p>
            <p className="text-sm font-bold text-white truncate">{teacherName}</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>লগআউট</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mobile Header */}
        <header className="lg:hidden bg-emerald-950 text-white p-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-400" />
            <span className="font-bold text-sm">শিক্ষক পোর্টাল</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-emerald-900"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Mobile Nav Drawer */}
        {isMobileOpen && (
          <div className="lg:hidden bg-emerald-950 text-white border-b border-emerald-800 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-emerald-600 text-white font-semibold" 
                      : "text-emerald-100 hover:bg-emerald-900/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-emerald-900 flex justify-between items-center">
              <span className="text-xs text-emerald-300">{teacherName}</span>
              <Button size="sm" variant="destructive" onClick={handleLogout}>
                লগআউট
              </Button>
            </div>
          </div>
        )}

        {/* Dynamic Page Children */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
