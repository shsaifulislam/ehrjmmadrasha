import { redirect } from "next/navigation";

export default function PortalDocumentsPage() {
  redirect("/portal?tab=DOCUMENTS");
}
