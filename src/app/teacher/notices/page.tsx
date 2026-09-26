import { redirect } from "next/navigation";

export default function TeacherNoticesPage() {
  redirect("/teacher?tab=NOTICES");
}
