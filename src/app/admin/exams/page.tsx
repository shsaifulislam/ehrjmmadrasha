import { redirect } from "next/navigation";

export default function AdminExamsPage() {
  redirect("/admin?tab=EXAMINATION");
}
