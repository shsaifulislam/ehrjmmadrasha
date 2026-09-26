import { redirect } from "next/navigation";

export default function TeacherAttendancePage() {
  redirect("/teacher?tab=ATTENDANCE");
}
