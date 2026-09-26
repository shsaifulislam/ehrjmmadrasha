import { redirect } from "next/navigation";

export default function PortalCertificatesPage() {
  redirect("/portal?tab=CERTIFICATES");
}
