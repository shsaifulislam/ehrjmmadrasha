"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
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

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
    </header>
  );
}
