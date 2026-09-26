import { redirect } from "next/navigation";

export default function TeacherNotesPage() {
  redirect("/teacher?tab=NOTES");
}
