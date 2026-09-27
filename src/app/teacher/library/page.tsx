import { redirect } from "next/navigation";

export default function TeacherLibraryPage() {
  redirect("/teacher?tab=LIBRARY");
}
