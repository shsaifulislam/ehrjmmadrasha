import { redirect } from "next/navigation";

export default function PortalRequestsPage() {
  redirect("/portal?tab=REQUESTS");
}
