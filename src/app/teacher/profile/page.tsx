import { redirect } from "next/navigation";

export default function TeacherProfilePage() {
  redirect("/teacher?tab=PROFILE");
}
