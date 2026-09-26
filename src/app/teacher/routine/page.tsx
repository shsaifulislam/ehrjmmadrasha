import { redirect } from "next/navigation";

export default function TeacherRoutinePage() {
  redirect("/teacher?tab=ROUTINE");
}
