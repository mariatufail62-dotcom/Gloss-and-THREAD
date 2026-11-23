import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Wordmark } from "@/components/layout/Wordmark";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/admin/");
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Wordmark size="md" />
          <p className="label mt-4 text-muted">Editorial CMS</p>
        </div>
        <div className="border border-line bg-white p-7">
          <h1 className="font-serif text-[1.5rem] font-medium">Sign in</h1>
          <LoginForm next={typeof next === "string" ? next : ""} />
        </div>
        <p className="mt-6 text-center text-[0.75rem] text-muted">
          Accounts are created by an administrator. Lost access? Ask an admin to reset your password.
        </p>
      </div>
    </div>
  );
}
