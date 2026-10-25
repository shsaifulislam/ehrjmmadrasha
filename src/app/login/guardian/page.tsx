import { redirect } from "next/navigation";

export default async function LoginGuardianPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const target = sp?.redirect || "/portal";
  redirect(`/login?tab=guardian&redirect=${encodeURIComponent(target)}`);
}
