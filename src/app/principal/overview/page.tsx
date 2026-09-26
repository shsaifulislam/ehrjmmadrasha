import { redirect } from "next/navigation";

export default function PrincipalOverviewPage() {
  redirect("/principal?tab=OVERVIEW");
}
