import { redirect } from "next/navigation";

export default function TeacherCalendarPage() {
  redirect("/teacher?tab=CALENDAR");
}
