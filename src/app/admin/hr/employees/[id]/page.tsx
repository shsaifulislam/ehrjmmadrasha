import { Metadata } from "next";
import AdminHrHub from "@/components/hr/AdminHrHub";

export const metadata: Metadata = {
  title: "কর্মী প্রোফাইল ও বিবরণ | EHRJ Madrasha ERP",
  description: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কর্মী ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য",
};

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <AdminHrHub />
    </div>
  );
}
