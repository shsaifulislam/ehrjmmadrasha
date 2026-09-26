import { redirect } from "next/navigation";

export default function TeacherExamsPage() {
  redirect("/teacher?tab=EXAM");
}
