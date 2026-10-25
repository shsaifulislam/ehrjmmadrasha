import { redirect } from "next/navigation";

export default function PortalHostelPage() {
  redirect("/portal?tab=HOSTEL");
}
