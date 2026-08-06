"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, User as UserIcon, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminNavGroups } from "./AdminSidebar";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";

const SEARCH_ITEMS = [
  { label: "ড্যাশবোর্ড", href: "/admin/dashboard", keywords: "dashboard home" },
  { label: "ছাত্র তালিকা", href: "/admin/students", keywords: "students list" },
  { label: "শিক্ষক তালিকা", href: "/admin/teachers", keywords: "teachers" },
  { label: "ভর্তি আবেদন", href: "/admin/admissions", keywords: "admissions" },
  { label: "ফি সংগ্রহ", href: "/admin/finance/collect", keywords: "fee collect" },
  { label: "বকেয়া তালিকা", href: "/admin/finance/due", keywords: "due list" },
  { label: "ইনভয়েস তালিকা", href: "/admin/finance/invoices", keywords: "invoices" },
  { label: "ক্যাশবুক", href: "/admin/finance/cashbook", keywords: "cashbook" },
  { label: "চার্ট অব একাউন্ট", href: "/admin/finance/chart-of-accounts", keywords: "chart accounts" },
  { label: "জেনারেল লেজার", href: "/admin/finance/ledger", keywords: "ledger" },
  { label: "আর্থিক রিপোর্ট", href: "/admin/accounting/reports", keywords: "accounting reports trial balance" },
  { label: "বেতন ও পে-রোল", href: "/admin/payroll", keywords: "payroll salary" },
  { label: "উপস্থিতি", href: "/admin/attendance", keywords: "attendance" },
  { label: "পরীক্ষার ফলাফল", href: "/admin/results", keywords: "results marks" },
  { label: "নোটিশ বোর্ড", href: "/admin/notices", keywords: "notices" },
  { label: "লাইব্রেরি", href: "/admin/library", keywords: "library books" },
  { label: "হোস্টেল", href: "/admin/hostel", keywords: "hostel" },
  { label: "বাজার", href: "/admin/bazar", keywords: "bazar meals" },
  { label: "ইনভেন্টরি", href: "/admin/inventory", keywords: "inventory" },
  { label: "পরিবহন", href: "/admin/transport", keywords: "transport" },
  { label: "সার্টিফিকেট", href: "/admin/certificates", keywords: "certificates" },
  { label: "সেটিংস", href: "/admin/settings", keywords: "settings" },
  { label: "ইউজার ও রোল", href: "/admin/roles", keywords: "roles users permissions" },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const filteredItems = SEARCH_ITEMS.filter(item =>
    searchQuery.length === 0 || 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("লগআউট সফল হয়েছে");
      router.push("/login");
    } catch (error) {
      toast.error("লগআউট ব্যর্থ হয়েছে");
    }
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">মেনু খুলুন</span>
            </Button>
          } />
          <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
            <SheetHeader className="h-16 flex justify-center items-start px-5 border-b bg-primary/5">
              <SheetTitle className="text-base font-bold text-primary">অ্যাডমিন প্যানেল</SheetTitle>
            </SheetHeader>
            <nav className="py-3 px-3">
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
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
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
          </SheetContent>
        </Sheet>
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">ই</span>
            </div>
            <span className="text-sm font-bold text-primary">EHRJ ERP</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Cmd+K Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs text-muted-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>দ্রুত খুঁজুন...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">⌘K</kbd>
        </button>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium">অ্যাডমিন</span>
          <span className="text-xs text-muted-foreground">admin@madrasha.edu.bd</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <UserIcon className="h-5 w-5" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>আমার একাউন্ট</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/change-password")} className="cursor-pointer">
              পাসওয়ার্ড পরিবর্তন
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>লগআউট</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cmd+K Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setSearchOpen(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মডিউল, পেজ বা ফিচার খুঁজুন..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-muted-foreground">ESC</kbd>
            </div>
            <div className="max-h-[40vh] overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">কোনো ফলাফল পাওয়া যায়নি।</p>
              ) : (
                filteredItems.map(item => (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-3"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto font-mono">{item.href}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
