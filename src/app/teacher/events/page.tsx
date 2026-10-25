import { redirect } from "next/navigation";

export default function TeacherEventsPage() {
  redirect("/teacher?tab=EVENTS");
}
