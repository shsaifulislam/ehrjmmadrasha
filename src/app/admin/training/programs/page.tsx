import { Metadata } from "next";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";

export const metadata: Metadata = {
  title: "প্রশিক্ষণ কার্যক্রম তালিকা | EHRJ Admin",
  description: "প্রশিক্ষণ ডিজাইন, খসড়া, অনুমোদন ও প্রকাশনা ব্যবস্থাপনা।",
};

export default function AdminTrainingProgramsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <InstitutionalTrainingConsole initialTab="PROGRAMS" />
    </div>
  );
}
