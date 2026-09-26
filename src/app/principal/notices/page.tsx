import { redirect } from "next/navigation";

export default function PrincipalNoticesPage() {
  redirect("/principal?tab=NOTICES");
}
