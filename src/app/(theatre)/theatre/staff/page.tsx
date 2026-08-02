"use client";
import { apiErrorMessage, type JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ASSIGNABLE_STAFF_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from "@/constants/roles";
import { ListSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";

const ROLES = [
  "manager",
  "counter_staff",
  "ticket_checker",
  "accountant",
  "marketing",
  "employee",
] as const;

export default function TheatreStaffPage() {
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("counter_staff");
  const [theatreId, setTheatreId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Permission[]>(
    ROLE_PERMISSIONS.counter_staff
  );

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([api.get("/owner/staff"), api.get("/owner/theatres")]);
      setItems(s.data.data || []);
      setTheatres(t.data.data || []);
      if (!theatreId && t.data.data?.[0]) setTheatreId(t.data.data[0]._id);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSelectedPerms([...(ROLE_PERMISSIONS[role as Role] || [])]);
  }, [role]);

  const togglePerm = (p: Permission) => {
    setSelectedPerms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Staff management"
        subtitle="Assign modules via permissions — staff only see what you grant"
      />

      <div className="rounded-xl border border-border p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
            value={theatreId}
            onChange={(e) => setTheatreId(e.target.value)}
          >
            {theatres.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Assigned modules / permissions</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ASSIGNABLE_STAFF_PERMISSIONS.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  checked={selectedPerms.includes(p)}
                  onChange={() => togglePerm(p)}
                />
                {PERMISSION_LABELS[p]}
              </label>
            ))}
          </div>
        </div>

        <Button
          loading={saving}
          loadingText="Saving…"
          onClick={async () => {
            if (!name || !email) return;
            setSaving(true);
            try {
              await api.post("/owner/staff", {
                name,
                email,
                role,
                theatreIds: theatreId ? [theatreId] : [],
                customPermissions: selectedPerms,
              });
              toast.success("Staff added (password: Password1)");
              setName("");
              setEmail("");
              load();
            } catch (e: unknown) {
              toast.error(apiErrorMessage(e, "Failed"));
            } finally {
              setSaving(false);
            }
          }}
        >
          Add staff
        </Button>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : !items.length ? (
        <EmptyState variant="staff" />
      ) : null}

      <div className="space-y-3">
        {!loading && items.map((s) => (
          <div
            key={s._id}
            className="rounded-xl border border-border p-4 flex flex-col sm:flex-row justify-between gap-3"
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">{s.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Theatres:{" "}
                {(s.theatreIds || []).map((t: JsonRecord) => t.name || t).join(", ") || "—"}
              </p>
              {s.customPermissions?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Perms: {s.customPermissions.length} assigned
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{s.role}</Badge>
              <Badge variant={s.isActive !== false ? "success" : "outline"}>
                {s.isActive !== false ? "active" : "disabled"}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await api.patch("/owner/staff", {
                    id: s._id,
                    isActive: s.isActive === false,
                  });
                  load();
                }}
              >
                {s.isActive === false ? "Enable" : "Disable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
