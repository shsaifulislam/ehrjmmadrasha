"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "ইউজারনেম দিন"),
  password: z.string().min(6, "পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)"),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true);
      const res = await api.post("/auth/login", values);
      
      toast.success("সফলভাবে লগইন হয়েছে!");
      
      const { role, mustChangePassword } = res.data.data.user;

      if (mustChangePassword) {
        router.push("/change-password");
      } else {
        if (role.name === "ADMIN") router.push("/admin/dashboard");
        else if (role.name === "TEACHER") router.push("/teacher/dashboard");
        else router.push("/student/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "লগইন ব্যর্থ হয়েছে");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-emerald-600">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="mx-auto h-20 w-20 rounded-full overflow-hidden border-2 border-emerald-600 p-1 shadow-sm bg-white">
            <img src="/images/logo.png" alt="ইলিয়টগঞ্জ মাদ্রাসা লোগো" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-xl font-bold text-emerald-800 dark:text-emerald-400">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</CardTitle>
          <CardDescription className="text-xs">পোর্টাল লগইন করতে ইউজারনেম ও পাসওয়ার্ড প্রদান করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>ইউজারনেম</FormLabel>
                    <FormControl>
                      <Input placeholder="admin, student-id, etc" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                প্রবেশ করুন
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা
        </CardFooter>
      </Card>
    </div>
  );
}
