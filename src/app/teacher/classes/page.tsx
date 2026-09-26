import { redirect } from "next/navigation";

export default function TeacherClassesPage() {
  redirect("/teacher?tab=CLASSES");
}
