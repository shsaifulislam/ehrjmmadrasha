"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Search, RefreshCw, Phone, UserCheck, Eye, ShieldCheck, BookOpen, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

interface Guardian {
  id: string;
  name: string;
  phone: string;
  relation: string;
  address?: string;
  students: { id: string; studentId: string; nameBn: string; roll: number; class?: { name: string } }[];
}

import { useGuardians, useCreateGuardian } from "@/hooks/useGuardian";

export default function AdminGuardiansPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any | null>(null);
  const [is360Open, setIs360Open] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("পিতা");
  const [address, setAddress] = useState("");

  const { data: guardianData, isLoading, refetch } = useGuardians({ search: search.trim() || undefined });
  const createGuardian = useCreateGuardian();

  const guardiansList = Array.isArray(guardianData) ? guardianData : (guardianData as any)?.data || [];

  const handleCreateGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("অভিভাবকের নাম ও মোবাইল নম্বর প্রদান করুন");
      return;
    }

    try {
      await createGuardian.mutateAsync({
        name,
        phone,
        relation,
        address,
      });
      toast.success("নতুন অভিভাবক সফলভাবে রেকর্ড করা হয়েছে");
      setName("");
      setPhone("");
      setRelation("পিতা");
      setAddress("");
      setIsOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "অভিভাবক তৈরি করা যায়নি");
    }
  };

  const filteredGuardians = guardiansList;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Users className="h-6 w-6 text-primary" />
            অভিভাবক ব্যবস্থাপনা ও ৩৬০ পোর্টাল
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            মাদ্রাসা শিক্ষার্থীদের অভিভাবক প্রোফাইল, সন্তান সংযোগ ও একীকৃত নোটিশ ব্যবস্থাপনা কেন্দ্র
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsOpen(true)} className="gap-2 font-medium shadow-xs">
            <Plus className="h-4 w-4" />
            নতুন অভিভাবক যোগ করুন
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="অভিভাবকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>মোট অভিভাবক: <strong className="text-foreground">{guardiansList.length}</strong> জন</span>
          </div>
        </CardContent>
      </Card>

      {/* Guardians Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {filteredGuardians.length === 0 ? (
            <EmptyState
              icon={Users}
              title="কোনো অভিভাবকের রেকর্ড পাওয়া যায়নি"
              description="নতুন অভিভাবক তথ্য যুক্ত করতে উপরের বোতামে ক্লিক করুন।"
            />
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>অভিভাবকের নাম</TableHead>
                  <TableHead>মোবাইল নম্বর</TableHead>
                  <TableHead>সম্পর্ক</TableHead>
                  <TableHead>সংযুক্ত শিক্ষার্থী (Ward)</TableHead>
                  <TableHead>ঠিকানা</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuardians.map((g: any) => (
                  <TableRow key={g.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {g.name[0]}
                        </div>
                        {g.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {g.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {g.relation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {g.students && g.students.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {g.students.map((st: any) => (
                            <Badge key={st.id} variant="secondary" className="text-xs">
                              {st.nameBn} ({st.class?.name || "শ্রেণি"})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">কোনো শিক্ষার্থী সংযুক্ত নেই</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{g.address || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedGuardian(g);
                          setIs360Open(true);
                        }}
                        className="gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        Guardian360
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Guardian Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              নতুন অভিভাবক নিবন্ধন
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGuardian} className="space-y-4 py-2">
            <div>
              <Label>অভিভাবকের নাম <span className="text-destructive">*</span></Label>
              <Input
                placeholder="যেমন: হাজী রফিকুল ইসলাম"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>মোবাইল নম্বর <span className="text-destructive">*</span></Label>
              <Input
                placeholder="যেমন: 01711223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>সম্পর্ক</Label>
              <Input
                placeholder="যেমন: পিতা / মাতা / ভাই"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>ঠিকানা</Label>
              <Input
                placeholder="বর্তমান যোগাযোগের ঠিকানা"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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

      {/* Guardian360 Modal */}
      {selectedGuardian && (
        <Dialog open={is360Open} onOpenChange={setIs360Open}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Guardian360 Profile Summary — {selectedGuardian.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg border text-xs">
                <div>
                  <span className="text-muted-foreground block">অভিভাবকের নাম:</span>
                  <strong className="text-foreground">{selectedGuardian.name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">মোবাইল নম্বর:</span>
                  <strong className="text-foreground">{selectedGuardian.phone}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">সম্পর্ক:</span>
                  <strong className="text-foreground">{selectedGuardian.relation}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  সংযুক্ত সন্তানসমূহ (Linked Wards)
                </h4>
                {selectedGuardian.students.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">কোনো সন্তান এখনও সংযুক্ত করা হয়নি।</p>
                ) : (
                  <div className="space-y-2">
                    {selectedGuardian.students.map((st: any) => (
                      <div key={st.id} className="flex justify-between items-center p-3 rounded-md border bg-card text-xs">
                        <div>
                          <strong className="text-foreground block">{st.nameBn}</strong>
                          <span className="text-muted-foreground">ID: {st.studentId} | রোল: {st.roll}</span>
                        </div>
                        <Badge variant="outline">{st.class?.name || "শ্রেণি"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="text-xs font-semibold flex items-center gap-1 text-primary mb-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  একীকৃত ফি ও বকেয়া স্ট্যাটাস
                </h4>
                <p className="text-xs text-muted-foreground">
                  অভিভাবকের সকল সন্তানদের মোট প্রদেয় ফি ও বকেয়া স্বয়ংক্রিয়ভাবে অটো-লিংকড অবস্থায় হিসাব করা হচ্ছে।
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIs360Open(false)}>
                  বন্ধ করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
