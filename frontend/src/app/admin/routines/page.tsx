"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Clock, UserCheck, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface RoutineSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  roomNo: string;
}

export default function AdminRoutinesPage() {
  const [selectedClass, setSelectedClass] = useState("Class One");
  const [routines, setRoutines] = useState<RoutineSlot[]>([
    {
      id: "r1",
      dayOfWeek: "শনিবার",
      startTime: "08:00 AM",
      endTime: "08:45 AM",
      subjectName: "আল-কুরআন ও তাজবীদ",
      teacherName: "মাওলানা মাহমুদ হাসান",
      roomNo: "১০১",
    },
    {
      id: "r2",
      dayOfWeek: "শনিবার",
      startTime: "08:45 AM",
      endTime: "09:30 AM",
      subjectName: "আল-হাদীস",
      teacherName: "মুফতি আব্দুর রহমান",
      roomNo: "১০১",
    },
    {
      id: "r3",
      dayOfWeek: "রবিবার",
      startTime: "08:00 AM",
      endTime: "08:45 AM",
      subjectName: "আরবি সাহিত্য",
      teacherName: "মাওলানা নোমান আহমেদ",
      roomNo: "১০২",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("শনিবার");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:45");
  const [subjectName, setSubjectName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [roomNo, setRoomNo] = useState("১০১");

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !teacherName.trim()) {
      toast.error("বিষয় ও শিক্ষকের নাম নির্বাচন করুন");
      return;
    }

    // Front-end mock Conflict check
    const clash = routines.find(
      (r) => r.dayOfWeek === dayOfWeek && r.startTime === startTime && r.teacherName === teacherName
    );

    if (clash) {
      toast.error(`শিক্ষক সংঘাত! ${teacherName} উক্ত সময়ে অন্য ক্লাসে অ্যাসাইনড আছেন।`);
      return;
    }

    const newSlot: RoutineSlot = {
      id: `r_${Date.now()}`,
      dayOfWeek,
      startTime,
      endTime,
      subjectName,
      teacherName,
      roomNo,
    };

    setRoutines([...routines, newSlot]);
    toast.success("সময়সূচী স্লট সফলভাবে যুক্ত করা হয়েছে");
    setSubjectName("");
    setTeacherName("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Calendar className="h-6 w-6 text-primary" />
            শ্রেণি সময়সূচী ও রুটিন ইঞ্জিন (Routine Engine)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            শ্রেণিভিত্তিক ক্লাস রুটিন ব্যবস্থাপনা, শিক্ষক ডাবল-বুকিং সংঘাত ট্র্যাকিং ও কক্ষ বরাদ্দ কেন্দ্র
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsOpen(true)} className="gap-2 font-medium shadow-xs">
            <Plus className="h-4 w-4" />
            নতুন সময়সূচী স্লট যোগ করুন
          </Button>
        </div>
      </div>

      {/* Routine Grid Card */}
      <Card className="shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">শ্রেণি নির্বাচন:</Label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs p-1.5 border rounded-md bg-background"
              >
                <option value="Class One">Class One (প্রথম শ্রেণি)</option>
                <option value="Class Two">Class Two (দ্বিতীয় শ্রেণি)</option>
                <option value="Class Three">Class Three (তৃতীয় শ্রেণি)</option>
              </select>
            </div>
            <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Conflict Engine Active
            </Badge>
          </div>

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>দিন (Day)</TableHead>
                <TableHead>সময় (Time Slot)</TableHead>
                <TableHead>বিষয় (Subject)</TableHead>
                <TableHead>দায়িত্বপ্রাপ্ত শিক্ষক</TableHead>
                <TableHead>কক্ষ (Room)</TableHead>
                <TableHead className="text-right">স্ট্যাটাস</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routines.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-foreground">{r.dayOfWeek}</TableCell>
                  <TableCell className="font-mono text-xs text-primary flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {r.startTime} - {r.endTime}
                  </TableCell>
                  <TableCell className="font-medium">{r.subjectName}</TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.teacherName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">কক্ষ #{r.roomNo}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      অ্যাসাইনড
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Routine Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              সময়সূচী স্লট এন্ট্রি
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSlot} className="space-y-3 py-2 text-xs">
            <div>
              <Label>বার (Day)</Label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background"
              >
                <option value="শনিবার">শনিবার</option>
                <option value="রবিবার">রবিবার</option>
                <option value="সোমবার">সোমবার</option>
                <option value="মঙ্গলবার">মঙ্গলবার</option>
                <option value="বুধবার">বুধবার</option>
                <option value="বৃহস্পতিবার">বৃহস্পতিবার</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>শুরুর সময়</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>শেষের সময়</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>বিষয়</Label>
              <Input
                placeholder="যেমন: আল-কুরআন ও তাজবীদ"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>শিক্ষক</Label>
              <Input
                placeholder="যেমন: মাওলানা মাহমুদ হাসান"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>কক্ষ নম্বর</Label>
              <Input
                placeholder="যেমন: ১০১"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit">সংরক্ষণ করুন</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
