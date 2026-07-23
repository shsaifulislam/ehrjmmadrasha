"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  UserCheck, 
  GraduationCap, 
  Receipt, 
  Contact, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [studentName, setStudentName] = useState("শিক্ষার্থী");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.nameBn || u.name) {
          setStudentName(u.nameBn || u.name);
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
    { title: "ড্যাশবোর্ড", href: "/student/dashboard", icon: LayoutDashboard },
    { title: "আমার প্রোফাইল", href: "/student/profile", icon: User },
    { title: "উপস্থিতি রেকর্ড", href: "/student/attendance", icon: UserCheck },
    { title: "পরীক্ষার ফলাফল", href: "/student/results", icon: GraduationCap },
    { title: "ফি ও রসিদ", href: "/student/fees", icon: Receipt },
    { title: "ডিজিটাল আইডি কার্ড", href: "/student/id-card", icon: Contact },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-teal-950 text-white border-r border-teal-800">
        <div className="p-4 flex items-center gap-3 border-b border-teal-900 bg-teal-900/50">
          <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg border border-teal-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-teal-100 line-clamp-1">শিক্ষার্থী পোর্টাল</h2>
            <p className="text-xs text-teal-300">ই.হা.র.জ. মাদ্রাসা</p>
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
                    ? "bg-teal-600 text-white font-semibold shadow" 
                    : "text-teal-100 hover:bg-teal-900/60 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-teal-900 bg-teal-950">
          <div className="mb-3 px-2">
            <p className="text-xs text-teal-400">লগইনকৃত ছাত্র:</p>
            <p className="text-sm font-bold text-white truncate">{studentName}</p>
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

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-teal-950 text-white p-4 flex items-center justify-between border-b border-teal-900">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-teal-400" />
            <span className="font-bold text-sm">ছাত্র পোর্টাল</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-teal-900"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {isMobileOpen && (
          <div className="lg:hidden bg-teal-950 text-white border-b border-teal-800 p-4 space-y-2">
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
                      ? "bg-teal-600 text-white font-semibold" 
                      : "text-teal-100 hover:bg-teal-900/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-teal-900 flex justify-between items-center">
              <span className="text-xs text-teal-300">{studentName}</span>
              <Button size="sm" variant="destructive" onClick={handleLogout}>
                লগআউট
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
