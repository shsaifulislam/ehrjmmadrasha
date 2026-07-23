"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Clock, CheckCircle2, type LucideIcon } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  description: string;
  features: string[];
  icon?: LucideIcon;
  phase?: string;
}

export function ComingSoonPage({
  title,
  description,
  features,
  icon: Icon = Construction,
  phase = "পরবর্তী ধাপ"
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl text-primary">শীঘ্রই আসছে</CardTitle>
          <CardDescription className="text-base">
            এই মডিউলটি পরবর্তী ধাপে চালু হবে
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm px-4 py-1.5 border-primary/40 text-primary">
              <Clock className="mr-2 h-3.5 w-3.5" />
              {phase}
            </Badge>
          </div>

          <div className="max-w-lg mx-auto">
            <h3 className="font-semibold text-center mb-4">পরিকল্পিত ফিচারসমূহ</h3>
            <div className="grid gap-2.5">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-card border px-4 py-3">
                  <CheckCircle2 className="h-4.5 w-4.5 text-primary/60 mt-0.5 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground pt-2">
            বর্তমানে এই মডিউলের উন্নয়ন কাজ চলছে। শীঘ্রই এটি সম্পূর্ণ কার্যকর হবে।
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
