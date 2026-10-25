import { redirect } from "next/navigation";

export default function PortalRoutinePage() {
  redirect("/portal?tab=ROUTINE");
}
