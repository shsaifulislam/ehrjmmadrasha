import { redirect } from "next/navigation";

export default function TeacherResultsPage() {
  redirect("/teacher?tab=RESULTS");
}
