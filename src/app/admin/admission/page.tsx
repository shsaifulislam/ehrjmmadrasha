import { redirect } from "next/navigation";

export default function AdminAdmissionPage() {
  redirect("/admin?tab=ADMISSION");
}
