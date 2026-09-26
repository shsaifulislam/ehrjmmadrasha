import { redirect } from "next/navigation";

export default function AdminAttendancePage() {
  redirect("/admin?tab=ATTENDANCE");
}
