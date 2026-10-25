import { redirect } from "next/navigation";

export default async function LoginTeacherPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const target = sp?.redirect || "/teacher";
  redirect(`/login?tab=institutional&redirect=${encodeURIComponent(target)}`);
}
