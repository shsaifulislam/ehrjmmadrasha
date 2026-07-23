"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "পুরাতন পাসওয়ার্ড দিন"),
  newPassword: z.string().min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে"),
  confirmPassword: z.string().min(6, "নতুন পাসওয়ার্ড নিশ্চিত করুন"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof changePasswordSchema>) {
    try {
      setIsLoading(true);
      const res = await api.post("/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      
      toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      
      const role = res.data.data.user.role.name;
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "TEACHER") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");
      
    } catch (error: any) {
      toast.error(error.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-secondary">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">পাসওয়ার্ড পরিবর্তন</CardTitle>
          <CardDescription>আপনার একাউন্টের নিরাপত্তার জন্য নতুন পাসওয়ার্ড সেট করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>পুরাতন পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>নতুন পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>নতুন পাসওয়ার্ড (পুনরায়)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                সংরক্ষণ করুন
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
