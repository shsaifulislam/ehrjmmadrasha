import { redirect } from "next/navigation";

export default function AdminLibraryPage() {
  redirect("/admin?tab=LIBRARY");
}
