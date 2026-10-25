'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, PlusCircle, RefreshCw, Bed, UserCheck, DollarSign, Utensils } from 'lucide-react';
import Link from 'next/link';

interface Building {
  id: string;
  name: string;
  code: string;
  totalCapacity: number;
  rooms: {
    id: string;
    roomNumber: string;
    floor: number;
    monthlyRent: number;
    beds: {
      id: string;
      bedNumber: string;
      status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
      allocations: { student: { nameBn: string; roll: number; studentId: string } }[];
    }[];
  }[];
}

export default function HostelManagementPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Building Modal State
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');

  // Room Modal State
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [totalBeds, setTotalBeds] = useState('4');
  const [monthlyRent, setMonthlyRent] = useState('2000');

  // Student Allocation Modal State
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('2000');
  const [allocating, setAllocating] = useState(false);

  const fetchHostelData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/hostel/buildings');
      setBuildings(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHostelData();
    fetchStudents();
  }, []);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/hostel/buildings', { name: buildingName, code: buildingCode });
      setShowBuildingModal(false);
      setBuildingName('');
      setBuildingCode('');
      fetchHostelData();
      alert('নতুন হোস্টেল বিল্ডিং তৈরি হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'বিল্ডিং তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId) return;
    try {
      await api.post('/admin/hostel/rooms', {
        buildingId: selectedBuildingId,
        roomNumber,
        floor: Number(floor),
        totalBeds: Number(totalBeds),
        monthlyRent: Number(monthlyRent),
      });
      setSelectedBuildingId(null);
      setRoomNumber('');
      fetchHostelData();
      alert('রুম ও সিটসমূহ তৈরি হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'রুম তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !selectedStudentId) return;
    try {
      setAllocating(true);
      await api.post('/admin/hostel/allocate', {
        bedId: selectedBedId,
        studentId: selectedStudentId,
        monthlyFee: Number(monthlyFee),
      });
      setSelectedBedId(null);
      setSelectedStudentId('');
      fetchHostelData();
      alert('ছাত্রকে হোস্টেল সিট বরাদ্দ দেওয়া হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'সিট বরাদ্দ দেওয়া সম্ভব হয়নি');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hostel & Seat Management (আবাসিক হোস্টেল ব্যবস্থাপনা)</h1>
          <p className="text-sm text-slate-500">হোস্টেল ভবন, রুম, বেড বরাদ্দ এবং ওভার-ক্যাপাসিটি প্রটেকশন</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/hostel/meals">
            <Button variant="outline"><Utensils className="w-4 h-4 mr-2" /> মিল এটেন্ডেন্স & কস্ট এনালিটিক্স</Button>
          </Link>
          <Button onClick={fetchHostelData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </Button>
          <Button onClick={() => setShowBuildingModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> নতুন বিল্ডিং যুক্ত করুন
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12 text-slate-500">হোস্টেল ডাটা লোড হচ্ছে...</p>
      ) : buildings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Building className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700">কোনো হোস্টেল বিল্ডিং যুক্ত করা হয়নি</h3>
            <p className="text-sm text-slate-500 font-semibold">উপরে 'নতুন বিল্ডিং যুক্ত করুন' বাটনে ক্লিক করে কাজ শুরু করুন</p>
          </CardContent>
        </Card>
      ) : (
        buildings.map((b) => (
          <Card key={b.id} className="border-l-4 border-l-emerald-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-600" /> {b.name} ({b.code})
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">মোট রুম: {b.rooms.length} | মোট ধারণক্ষমতা (Capacity): {b.totalCapacity} সিট</p>
              </div>
              <Button size="sm" onClick={() => setSelectedBuildingId(b.id)} variant="outline">
                <PlusCircle className="w-3.5 h-3.5 mr-1" /> এই বিল্ডিংয়ে রুম যোগ করুন
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {b.rooms.map((r) => (
                <div key={r.id} className="border rounded-lg p-4 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="font-bold text-slate-800">রুম নম্বর: {r.roomNumber} ({r.floor} তলা)</div>
                    <div className="text-xs font-mono font-bold text-emerald-700">মাসিক সিট ভাড়া: ৳{r.monthlyRent}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {r.beds.map((bed) => {
                      const activeAlloc = bed.allocations[0];
                      const isOccupied = bed.status === 'OCCUPIED';

                      return (
                        <div
                          key={bed.id}
                          className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                            isOccupied ? 'bg-amber-50 border-amber-200' : 'bg-white border-emerald-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5 text-slate-600" /> {bed.bedNumber}
                            </span>
                            {isOccupied ? (
                              <Badge className="bg-amber-600 text-[10px]">OCCUPIED</Badge>
                            ) : (
                              <Badge className="bg-emerald-600 text-[10px]">VACANT</Badge>
                            )}
                          </div>

                          {isOccupied && activeAlloc ? (
                            <div className="text-xs space-y-0.5">
                              <div className="font-bold text-slate-900">{activeAlloc.student.nameBn}</div>
                              <div className="text-slate-500 font-mono">আইডি: {activeAlloc.student.studentId}</div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setSelectedBedId(bed.id)}
                              className="w-full bg-emerald-600 text-white text-xs h-7 mt-1"
                            >
                              ছাত্র বরাদ্দ দিন
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">নতুন হোস্টেল বিল্ডিং</h2>
            <form onSubmit={handleCreateBuilding} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">বিল্ডিং নাম</label>
                <Input required placeholder="যেমন: উসমানী ভবন" value={buildingName} onChange={(e) => setBuildingName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">বিল্ডিং কোড (ইউনিক)</label>
                <Input required placeholder="যেমন: BLD-01" value={buildingCode} onChange={(e) => setBuildingCode(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBuildingModal(false)}>বাতিল</Button>
                <Button type="submit" className="bg-emerald-600 text-white">তৈরি করুন</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {selectedBuildingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">বিল্ডিংয়ে নতুন রুম যোগ করুন</h2>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">রুম নম্বর</label>
                <Input required placeholder="যেমন: 101" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">তলা (Floor)</label>
                <Input type="number" required value={floor} onChange={(e) => setFloor(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">মোট বেড/সিট সংখ্যা</label>
                <Input type="number" required value={totalBeds} onChange={(e) => setTotalBeds(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">মাসিক সিট ভাড়া (৳)</label>
                <Input type="number" required value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedBuildingId(null)}>বাতিল</Button>
                <Button type="submit" className="bg-emerald-600 text-white">রুম ও সিট জেনারেট করুন</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Allocation Modal */}
      {selectedBedId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">ছাত্রের নামে হোস্টেল সিট বরাদ্দ করুন</h2>
            <form onSubmit={handleAllocate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">ছাত্র নির্বাচন করুন</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">ছাত্র সিলেক্ট করুন...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameBn} (আইডি: {s.studentId}, রুল: {s.roll})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">মাসিক সিট ও হোস্টেল চার্জ (৳)</label>
                <Input type="number" required value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedBedId(null)}>বাতিল</Button>
                <Button type="submit" disabled={allocating} className="bg-emerald-600 text-white">
                  {allocating ? 'বরাদ্দ হচ্ছে...' : 'সিট বরাদ্দ করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
