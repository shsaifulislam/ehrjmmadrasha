import { redirect } from "next/navigation";

export default function PrincipalIssuesPage() {
  redirect("/principal?tab=ISSUES");
}
