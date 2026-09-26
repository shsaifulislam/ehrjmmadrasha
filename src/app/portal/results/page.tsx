import { redirect } from "next/navigation";

export default function PortalResultsPage() {
  redirect("/portal?tab=RESULTS");
}
