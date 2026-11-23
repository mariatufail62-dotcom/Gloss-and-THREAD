import { requireUser } from "@/lib/auth/session";
import { changePasswordAction } from "@/app/admin/actions/auth";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Card, Field, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Account" };

export default async function Account() {
  const me = await requireUser();
  return (
    <>
      <PageHeader title="Your account" description={`${me.name} · ${me.email} · ${me.role.toLowerCase()}`} />
      <Card title="Change password" className="max-w-lg">
        <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
          <Field label="Current password" htmlFor="current"><input id="current" name="current" type="password" autoComplete="current-password" required className="field" /></Field>
          <Field label="New password" htmlFor="next" hint="At least 12 characters with letters and a number or symbol."><input id="next" name="next" type="password" autoComplete="new-password" required className="field" /></Field>
          <Field label="Confirm new password" htmlFor="confirm"><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" /></Field>
          <SubmitButton>Update password</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
