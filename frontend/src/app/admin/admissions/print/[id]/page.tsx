"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAdmissionById } from "@/hooks/useCms";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdmissionPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const type = searchParams.get('type') || 'receipt'; // form, receipt, approval
  
  const { data: item, isLoading } = useAdmissionById(id);

  useEffect(() => {
    // Optionally auto-print
    // if (item) window.print();
  }, [item]);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /></div>;
  }

  if (!item) {
    return <div className="h-screen flex items-center justify-center">Information not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white p-10 border rounded-xl shadow-sm print:border-none print:shadow-none print:max-w-none print:mx-0">
         <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 bg-emerald-700 rounded-full flex items-center justify-center">
                 <span className="text-white font-bold text-2xl">EHRJ</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">EHRJ Madrasha</h1>
                <p className="text-sm text-slate-500">Dhaka, Bangladesh</p>
              </div>
            </div>
            
            <div className="text-right">
               <h2 className="text-xl font-bold uppercase tracking-wider text-emerald-800">
                 {type === 'receipt' ? 'Payment Receipt' : type === 'approval' ? 'Approval Letter' : 'Admission Form'}
               </h2>
               <p className="text-sm text-slate-500">ID: {id.split('-')[0].toUpperCase()}</p>
               <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString('bn-BD')}</p>
            </div>
         </div>
         
         {type === 'receipt' && (
           <div className="space-y-6">
             <div className="p-4 bg-slate-50 rounded-lg border">
                <p className="mb-2"><strong>Received from:</strong> {item.applicantName}</p>
                <p className="mb-2"><strong>Class:</strong> {item.class?.name || 'N/A'}</p>
                <p className="mb-2"><strong>Mobile:</strong> {item.phone}</p>
             </div>
             
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b">
                   <th className="py-2">Description</th>
                   <th className="py-2 text-right">Amount</th>
                 </tr>
               </thead>
               <tbody>
                 <tr className="border-b">
                   <td className="py-4">Admission Fee</td>
                   <td className="py-4 text-right font-mono">৳ 1,500.00</td>
                 </tr>
                 <tr className="font-bold text-lg">
                   <td className="py-4 text-right">Total:</td>
                   <td className="py-4 text-right font-mono text-emerald-700">৳ 1,500.00</td>
                 </tr>
               </tbody>
             </table>
             
             <div className="mt-8">
               <p className="text-sm text-muted-foreground">Payment Method: <strong>{item.paymentMethod || 'CASH'}</strong></p>
               <p className="text-sm text-muted-foreground">Transaction ID: <strong>{item.trxId || 'N/A'}</strong></p>
             </div>
           </div>
         )}

         {type === 'approval' && (
           <div className="space-y-6 text-justify leading-relaxed">
             <p><strong>To,</strong><br/>{item.applicantName}<br/>{item.address || ''}</p>
             <h3 className="font-bold text-center underline">Subject: Letter of Admission Approval</h3>
             <p>Dear {item.applicantName},</p>
             <p>We are pleased to inform you that your application for admission into class <strong>{item.class?.name || 'N/A'}</strong> at EHRJ Madrasha has been reviewed and <strong>approved</strong>.</p>
             <p>Please report to the administrative office with this letter and your original documents on the scheduled date for final enrollment procedures.</p>
             <br/><br/><br/>
             <div className="flex justify-between">
                <div>
                   <div className="border-t border-black w-40 mt-10 pt-1 text-center font-bold">Principal Signature</div>
                </div>
                <div>
                   <div className="border-t border-black w-40 mt-10 pt-1 text-center font-bold">Admin Signature</div>
                </div>
             </div>
           </div>
         )}
         
         {type === 'form' && (
           <div className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="border-b pb-2"><span className="text-xs text-muted-foreground block">Applicant Name</span><strong className="text-sm">{item.applicantName}</strong></div>
                <div className="border-b pb-2"><span className="text-xs text-muted-foreground block">Class Applied</span><strong className="text-sm">{item.class?.name || 'N/A'}</strong></div>
                <div className="border-b pb-2"><span className="text-xs text-muted-foreground block">Father Name</span><strong className="text-sm">{item.fatherName || 'N/A'}</strong></div>
                <div className="border-b pb-2"><span className="text-xs text-muted-foreground block">Mother Name</span><strong className="text-sm">{item.motherName || 'N/A'}</strong></div>
                <div className="border-b pb-2"><span className="text-xs text-muted-foreground block">Phone</span><strong className="text-sm">{item.phone}</strong></div>
                <div className="border-b pb-2"><span className="text-xs text-muted-foreground block">Date of Birth</span><strong className="text-sm">{item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A'}</strong></div>
                <div className="col-span-2 border-b pb-2"><span className="text-xs text-muted-foreground block">Address</span><strong className="text-sm">{item.address || 'N/A'}</strong></div>
             </div>
           </div>
         )}

         <div className="mt-12 text-center text-xs text-slate-400 print:block">
            This is a system generated document. No physical signature is required unless stated otherwise.
         </div>
      </div>
      
      <div className="fixed bottom-8 right-8 print:hidden flex gap-2">
         <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg h-14 px-6">
            <Printer className="h-5 w-5 mr-2" /> Print Document
         </Button>
      </div>
    </div>
  )
}
