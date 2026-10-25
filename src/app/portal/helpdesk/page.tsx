import { redirect } from "next/navigation";

export default function PortalHelpdeskPage() {
  redirect("/portal?tab=REQUESTS");
}
