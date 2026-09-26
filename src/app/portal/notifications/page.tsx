import { redirect } from "next/navigation";

export default function PortalNotificationsPage() {
  redirect("/portal?tab=NOTIFICATIONS");
}
