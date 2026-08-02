"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";

const ACTIONS = [
  "",
  "LOGIN",
  "LOGOUT",
  "POS_BOOK",
  "TICKET_CANCEL",
  "REFUND",
  "TICKET_REPRINT",
  "PAYMENT_COLLECTION",
  "CUSTOMER_SEARCH",
  "SEAT_LAYOUT_UPDATE",
  "VERIFY_TICKET",
];

export default function StaffActivityPage() {
  const [sessions, setSessions] = useState<JsonRecord[]>([]);
  const [logs, setLogs] = useState<JsonRecord[]>([]);
  const [tab, setTab] = useState<"sessions" | "logs">("logs");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    const [s, l] = await Promise.all([
      api.get("/owner/staff/activity"),
      api.get("/owner/staff/logs", { params: { action: action || undefined, from, to } }),
    ]);
    setSessions(s.data.data || []);
    setLogs(l.data.data || []);
  };

  useEffect(() => {
    load().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Staff activity logs"
        subtitle="Login, booking, cancel, refund, reprint, payments, seat changes"
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "logs" ? "default" : "outline"} onClick={() => setTab("logs")}>
          Action logs
        </Button>
        <Button
          size="sm"
          variant={tab === "sessions" ? "default" : "outline"}
          onClick={() => setTab("sessions")}
        >
          Login sessions
        </Button>
      </div>

      {tab === "logs" && (
        <>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {ACTIONS.map((a) => (
                <option key={a || "all"} value={a}>
                  {a || "All actions"}
                </option>
              ))}
            </select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button size="sm" onClick={load}>
              Filter
            </Button>
          </div>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="ml-2 font-medium">{log.userId?.name || "User"}</span>
                    <span className="text-muted-foreground"> · {log.resource}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.theatreId?.name || "—"} · IP {log.ipAddress || "—"} ·{" "}
                  {log.resourceId || ""}
                </p>
              </div>
            ))}
            {!logs.length && (
              <p className="text-sm text-muted-foreground">No activity logs in range.</p>
            )}
          </div>
        </>
      )}

      {tab === "sessions" && (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s._id} className="rounded-xl border border-border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{s.userId?.name || "Staff"}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.userId?.role} · {s.theatreId?.name || "—"} · Counter {s.counterId || "—"}
                  </p>
                </div>
                <Badge variant={s.isActive ? "success" : "outline"}>
                  {s.isActive ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
                <p>Login: {new Date(s.loginAt).toLocaleString("en-IN")}</p>
                <p>
                  Logout:{" "}
                  {s.logoutAt ? new Date(s.logoutAt).toLocaleString("en-IN") : "—"}
                </p>
                <p>
                  {s.device || "—"} / {s.browser || "—"} · IP {s.ipAddress || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
