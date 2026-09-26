import { redirect } from "next/navigation";

export default function PrincipalReportsPage() {
  redirect("/principal?tab=REPORTS");
}
