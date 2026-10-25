import { redirect } from "next/navigation";

export default function PortalDashboardPage() {
  redirect("/portal?tab=DASHBOARD");
}
