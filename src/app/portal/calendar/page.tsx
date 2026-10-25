import { redirect } from "next/navigation";

export default function PortalCalendarPage() {
  redirect("/portal?tab=CALENDAR");
}
