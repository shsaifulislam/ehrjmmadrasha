import { redirect } from "next/navigation";

export default function PortalChildrenPage() {
  redirect("/portal?tab=CHILDREN");
}
