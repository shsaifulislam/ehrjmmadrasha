import { redirect } from "next/navigation";

export default function PortalLibraryPage() {
  redirect("/portal?tab=LIBRARY");
}
