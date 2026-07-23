"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import type { Session } from "@/lib/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState("");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/academic/sessions");
      setSessions(res.data.data.sessions);
    } catch (err: any) {
      toast.error(err.message || "সেশন তালিকা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post("/academic/sessions", { year, isActive: true });
      toast.success("সেশন সফলভাবে তৈরি হয়েছে");
      setYear("");
      setDialogOpen(false);
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "সেশন তৈরি করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">সেশন ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">শিক্ষা বর্ষের সেশন পরিচালনা করুন</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> নতুন সেশন</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন সেশন তৈরি করুন</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>সেশন বর্ষ *</Label>
                <Input value={year} onChange={e => setYear(e.target.value)} placeholder="2025" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">বাতিল</Button>} />
              <Button onClick={handleCreate} disabled={saving || !year}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সংরক্ষণ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            সেশন তালিকা ({sessions.length}টি)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">লোড হচ্ছে...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">কোনো সেশন পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground/70 mt-1">নতুন সেশন তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>সেশন বর্ষ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>তৈরির তারিখ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.year}</TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "default" : "secondary"}>
                          {s.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("bn-BD")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
