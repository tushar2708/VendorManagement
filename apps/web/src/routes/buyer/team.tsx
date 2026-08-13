import { useEffect, useState } from "react";
import type { TeamMember } from "@vendor-management/shared";
import { listTeam, createTeamMember, removeTeamMember, updateTeamMember } from "../../lib/team-api.js";
import { errorMessage } from "../../lib/auth-api.js";
import { Card, Spinner, Button } from "../../components/ui.js";
import { Badge } from "../../components/atoms/Badge.js";
import { useTextReveal } from "../../hooks/use-text-reveal.js";
import { useToast } from "../../components/atoms/Toast.js";
import { useAuth } from "../../hooks/use-auth.js";

const ROLE_OPTIONS = ["OWNER", "QUALITY", "FINANCE", "TAX", "LEGAL"] as const;

export function TeamPage(): React.ReactElement {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("QUALITY");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<string>("");
  const headingRef = useTextReveal<HTMLHeadingElement>();
  const toast = useToast();
  const { user } = useAuth();

  function load() {
    setLoading(true);
    listTeam()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await createTeamMember({ fullName, email, role: role as any, password });
      setFullName(""); setEmail(""); setPassword("");
      load();
      toast.success("Team member added");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to add"));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeTeamMember(id);
      load();
      toast.success("Team member removed");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to remove"));
    }
  }

  function startEdit(m: TeamMember) {
    setEditingId(m.id);
    setEditName(m.fullName ?? "");
    setEditRole(m.role);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditRole("");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    try {
      await updateTeamMember(editingId, { fullName: editName, role: editRole });
      setEditingId(null);
      load();
      toast.success("Team member updated");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update"));
    }
  }

  return (
    <div>
      <h1 ref={headingRef} className="text-3xl font-bold tracking-tight text-slate-900">Team</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your buyer organization team members.</p>

      {loading && <div className="mt-16 grid place-items-center"><Spinner className="h-6 w-6" /></div>}

      {!loading && (
        <>
          <Card className="mt-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0">
                    {editingId === m.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-600">{m.email}</td>
                        <td className="px-4 py-2">
                          <select
                            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                          >
                            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900">{m.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{m.email}</td>
                        <td className="px-4 py-3"><Badge variant="info">{m.role}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          {!m.isSelf && (
                            <div className="flex items-center gap-2 justify-end">
                              <Button size="sm" variant="secondary" onClick={() => startEdit(m)}>Edit</Button>
                              <Button size="sm" variant="secondary" onClick={() => handleRemove(m.id)}>Remove</Button>
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add teammate</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <input className="col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input className="col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <select className="col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input className="col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <div className="col-span-2">
                <Button type="submit" disabled={adding}>{adding ? "Adding..." : "Add member"}</Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
