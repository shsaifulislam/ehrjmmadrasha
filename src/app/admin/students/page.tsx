import { redirect } from "next/navigation";

export default function AdminStudentsPage() {
  redirect("/admin?tab=STUDENTS");
}
