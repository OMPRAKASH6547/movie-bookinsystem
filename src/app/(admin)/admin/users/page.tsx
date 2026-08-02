"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

const ROLES = ["customer", "admin", "theatre_owner", "manager", "employee", "guest"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<JsonRecord[]>([]);
  const [role, setRole] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/users", { params: { role: role || undefined } });
    setUsers(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load users"));
  }, [role]);

  return (
    <div className="space-y-6">
      <PageHeader title="User management" subtitle="Roles, access and account status" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!role ? "default" : "outline"} onClick={() => setRole("")}>
          All
        </Button>
        {ROLES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={role === r ? "default" : "outline"}
            onClick={() => setRole(r)}
          >
            {r}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-border">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <Badge variant="outline">{u.role}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant={u.isActive !== false ? "success" : "outline"}>
                    {u.isActive !== false ? "active" : "disabled"}
                  </Badge>
                </td>
                <td className="p-3 space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await api.patch("/admin/users", {
                        id: u._id,
                        isActive: u.isActive === false,
                      });
                      toast.success("Status updated");
                      load();
                    }}
                  >
                    {u.isActive === false ? "Enable" : "Disable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
