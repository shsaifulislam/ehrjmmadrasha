import { redirect } from "next/navigation";

export default function PortalAttendancePage() {
  redirect("/portal?tab=ATTENDANCE");
}
