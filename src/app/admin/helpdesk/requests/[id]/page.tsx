import { Metadata } from "next";
import AdminHelpdeskHub from "@/components/helpdesk/AdminHelpdeskHub";

export const metadata: Metadata = {
  title: "টিকেটের বিস্তারিত | EHRJ Madrasha ERP",
  description: "হেল্পডেস্ক ও অভিযোগ বিস্তারিত পর্যবেক্ষণ",
};

export default async function AdminHelpdeskRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminHelpdeskHub />
    </div>
  );
}
