import { redirect } from "next/navigation";

export default function TeacherLeavePage() {
  redirect("/teacher?tab=LEAVE");
}
