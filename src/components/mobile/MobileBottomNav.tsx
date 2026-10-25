"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Award,
  DollarSign,
  Search,
  BookOpen,
  Users,
  GraduationCap,
  Bell,
  Sliders,
  Smartphone,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>("PUBLIC");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Role-based Nav Items
  let navItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (userRole === "GUARDIAN") {
    navItems = [
      { label: "হোম", href: "/portal", icon: Home },
      { label: "হাজিরা", href: "/portal", icon: Calendar },
      { label: "ওয়েব অ্যাপ", href: "/app", icon: Smartphone },
      { label: "ফি বিবরণী", href: "/portal", icon: DollarSign },
      { label: "সার্চ", href: "/search", icon: Search },
    ];
  } else if (userRole === "TEACHER") {
    navItems = [
      { label: "হোম", href: "/teacher", icon: Home },
      { label: "হাজিরা", href: "/teacher", icon: Calendar },
      { label: "ওয়েব অ্যাপ", href: "/app", icon: Smartphone },
      { label: "মার্কস", href: "/teacher", icon: Award },
      { label: "নোটিশ", href: "/notices", icon: Bell },
    ];
  } else if (userRole === "ADMIN" || userRole === "PRINCIPAL") {
    navItems = [
      { label: "ড্যাশবোর্ড", href: "/admin", icon: Home },
      { label: "শিক্ষার্থী", href: "/admin", icon: Users },
      { label: "ওয়েব অ্যাপ", href: "/app", icon: Smartphone },
      { label: "হিসাব", href: "/admin", icon: DollarSign },
      { label: "সার্চ", href: "/search", icon: Search },
    ];
  } else {
    // Public / Visitor
    navItems = [
      { label: "হোম", href: "/", icon: Home },
      { label: "ভর্তি", href: "/admission", icon: GraduationCap },
      { label: "ওয়েব অ্যাপ", href: "/app", icon: Smartphone },
      { label: "রেজাল্ট", href: "/results", icon: Award },
      { label: "সার্চ", href: "/search", icon: Search },
    ];
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-900/10 shadow-lg pb-safe">
      <div className="grid grid-cols-5 h-14">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCenterApp = item.href === "/app";

          if (isCenterApp) {
            return (
              <Link
                key={idx}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4 relative group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-2 border-[#D4AF37] transition-transform active:scale-95 ${
                    isActive
                      ? "bg-[#041F14] text-[#D4AF37]"
                      : "bg-gradient-to-tr from-[#041F14] to-[#0D5C3A] text-white"
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[9px] font-bold mt-0.5 text-emerald-950 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[44px] transition ${
                isActive ? "text-[#0D5C3A] font-bold" : "text-gray-500 hover:text-emerald-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#0D5C3A] stroke-[2.5]" : "text-gray-500"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
