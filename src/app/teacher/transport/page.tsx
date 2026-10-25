import { redirect } from "next/navigation";

export default function TeacherTransportPage() {
  redirect("/teacher?tab=TRANSPORT");
}
