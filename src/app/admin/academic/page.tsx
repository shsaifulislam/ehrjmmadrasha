import { redirect } from "next/navigation";

export default function AdminAcademicPage() {
  redirect("/admin?tab=ACADEMIC");
}
