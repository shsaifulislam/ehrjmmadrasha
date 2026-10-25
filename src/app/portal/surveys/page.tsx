import { redirect } from "next/navigation";

export default function PortalSurveysPage() {
  redirect("/portal?tab=REQUESTS");
}
