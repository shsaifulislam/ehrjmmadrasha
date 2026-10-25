import { redirect } from "next/navigation";

export default function PortalTransportPage() {
  redirect("/portal?tab=TRANSPORT");
}
