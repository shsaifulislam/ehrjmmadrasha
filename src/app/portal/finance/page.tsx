import { redirect } from "next/navigation";

export default function PortalFinancePage() {
  redirect("/portal?tab=FINANCE");
}
