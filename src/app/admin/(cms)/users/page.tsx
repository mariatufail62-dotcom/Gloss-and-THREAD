import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { saveUserAction } from "@/app/admin/actions/site";
import { formatDateTime } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Badge, Card, Checkbox, Field, Notice, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Users" };

type Props = { searchParams: Promise<{ created?: string }> };

const ROLE_HELP = "Admin: everything incl. users & settings · Editor: review, publish, media, products, structure · Contributor: write own drafts only";

export default async function Users({ searchParams }: Props) {
  const me = await requireUser("ADMIN");
  const { created } = await searchParams;
  const [users, authors] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } }),
    db.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const UserFields = ({ u }: { u?: (typeof users)[number] }) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {u && <input type="hidden" name="id" value={u.id} />}
      <Field label="Name"><input name="name" required defaultValue={u?.name} maxLength={120} className="field" /></Field>
      <Field label="Email"><input name="email" type="email" required defaultValue={u?.email} className="field" /></Field>
      <Field label="Role">
        <select name="role" defaultValue={u?.role ?? "CONTRIBUTOR"} className="field">
          <option value="CONTRIBUTOR">Contributor</option>
          <option value="EDITOR">Editor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </Field>
      <Field label="Linked byline">
        <select name="authorId" defaultValue={u?.authorId ?? ""} className="field">
          <option value="">None</option>
          {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label={u ? "Reset password (optional)" : "Password"} className="sm:col-span-2" hint="At least 12 characters with letters and a number or symbol.">
        <input name="password" type="password" autoComplete="new-password" required={!u} className="field" />
      </Field>
      <div className="sm:col-span-2"><Checkbox name="isActive" label="Active" defaultChecked={u?.isActive ?? true} /></div>
    </div>
  );

  return (
    <>
      <PageHeader title="Users" description={ROLE_HELP} />
      {created && <div className="mb-4"><Notice tone="green">User created. Share the password with them through a secure channel.</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-2">
        {users.map((u) => (
          <Card
            key={u.id}
            title={`${u.name}${u.id === me.id ? " (you)" : ""}`}
            actions={<span className="flex gap-1.5"><Badge tone={u.role === "ADMIN" ? "rose" : u.role === "EDITOR" ? "blue" : "neutral"}>{u.role.toLowerCase()}</Badge>{!u.isActive && <Badge>inactive</Badge>}</span>}
          >
            <p className="mb-4 text-[0.75rem] text-muted">Last sign-in: {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "never"}</p>
            <ActionForm action={saveUserAction} className="space-y-4">
              <UserFields u={u} />
              <SubmitButton>Save user</SubmitButton>
            </ActionForm>
          </Card>
        ))}
        <Card title="Add user">
          <ActionForm action={saveUserAction} className="space-y-4">
            <UserFields />
            <SubmitButton>Create user</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
