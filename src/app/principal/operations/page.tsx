import { redirect } from "next/navigation";

export default function PrincipalOperationsPage() {
  redirect("/principal?tab=OPERATIONS");
}
