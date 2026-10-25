import { redirect } from "next/navigation";

export default function PortalKnowledgePage() {
  redirect("/portal?tab=LIBRARY");
}
