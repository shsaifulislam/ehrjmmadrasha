import { redirect } from "next/navigation";

export default function AdminResultsRedirectPage() {
  redirect("/admin/exams");
}
