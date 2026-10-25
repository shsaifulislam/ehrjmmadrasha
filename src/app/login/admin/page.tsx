import { redirect } from "next/navigation";

export default async function LoginAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const target = sp?.redirect || "/admin";
  redirect(`/login?tab=institutional&redirect=${encodeURIComponent(target)}`);
}
