import { redirect } from "next/navigation";

export default function AdminDocumentsPage() {
  redirect("/admin?tab=DOCUMENTS");
}
