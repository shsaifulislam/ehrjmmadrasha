"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, UserCog, GraduationCap, Calendar,
  Wallet, FileText, Settings, Banknote, BookOpen, ClipboardList,
  CheckSquare, BarChart3, Bell, ImageIcon, Download, UserPlus,
  Shield, ScrollText, Database, DollarSign, HandCoins, Receipt
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    title: "প্রধান",
    items: [
      { href: "/admin/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    ]
  },
  {
    title: "একাডেমিক",
    items: [
      { href: "/admin/students", label: "ছাত্র তালিকা", icon: Users },
      { href: "/admin/teachers", label: "শিক্ষক তালিকা", icon: UserCog },
      { href: "/admin/classes", label: "শ্রেণী", icon: GraduationCap },
      { href: "/admin/sessions", label: "সেশন", icon: Calendar },
      { href: "/admin/departments", label: "বিভাগ", icon: BookOpen },
      { href: "/admin/subjects", label: "বিষয়", icon: ClipboardList },
    ]
  },
  {
    title: "ভর্তি",
    items: [
      { href: "/admin/admissions", label: "ভর্তি আবেদন", icon: UserPlus },
    ]
  },
  {
    title: "উপস্থিতি ও ফলাফল",
    items: [
      { href: "/admin/attendance", label: "উপস্থিতি", icon: CheckSquare },
      { href: "/admin/results", label: "ফলাফল", icon: BarChart3 },
    ]
  },
  {
    title: "অর্থ ব্যবস্থাপনা",
    items: [
      { href: "/admin/finance/collect", label: "ফি আদায়", icon: Wallet },
      { href: "/admin/finance/invoices", label: "ইনভয়েস", icon: FileText },
      { href: "/admin/finance/due", label: "বকেয়া তালিকা", icon: Receipt },
      { href: "/admin/fee-types", label: "ফি টাইপ", icon: Banknote },
      { href: "/admin/receipts", label: "রশিদ", icon: FileText },
      { href: "/admin/donations", label: "দান", icon: HandCoins },
      { href: "/admin/expenses", label: "খরচ", icon: DollarSign },
    ]
  },
  {
    title: "কন্টেন্ট",
    items: [
      { href: "/admin/notices", label: "নোটিশ", icon: Bell },
      { href: "/admin/gallery", label: "গ্যালারি", icon: ImageIcon },
      { href: "/admin/downloads", label: "ডাউনলোড", icon: Download },
    ]
  },
  {
    title: "সিস্টেম",
    items: [
      { href: "/admin/users", label: "ইউজার", icon: Users },
      { href: "/admin/roles", label: "রোল ও পারমিশন", icon: Shield },
      { href: "/admin/audit-logs", label: "অডিট লগ", icon: ScrollText },
      { href: "/admin/backup", label: "ব্যাকআপ", icon: Database },
      { href: "/admin/settings", label: "সেটিংস", icon: Settings },
    ]
  }
];

// Flat list for mobile header
export const adminLinks = adminNavGroups.flatMap(g => g.items);

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card h-full sticky top-0">
      <div className="h-16 flex items-center px-5 border-b bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">ই</span>
          </div>
          <div className="leading-tight">
            <h2 className="text-sm font-bold text-primary">অ্যাডমিন প্যানেল</h2>
            <p className="text-[10px] text-muted-foreground">ইলিয়টগঞ্জ মাদ্রাসা</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {adminNavGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((link) => {
                const isActive = pathname === link.href || 
                  (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
