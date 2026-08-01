"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AdminSettingsPage() {
  const [appName, setAppName] = useState("CinePass");
  const [supportEmail, setSupportEmail] = useState("support@cinepass.app");
  const [gst, setGst] = useState("18");
  const [seatLock, setSeatLock] = useState("10");

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Platform settings" subtitle="Tax, locks and support defaults" />
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="space-y-2">
          <Label>App name</Label>
          <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Support email</Label>
          <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>GST %</Label>
          <Input value={gst} onChange={(e) => setGst(e.target.value)} type="number" />
        </div>
        <div className="space-y-2">
          <Label>Seat lock minutes</Label>
          <Input value={seatLock} onChange={(e) => setSeatLock(e.target.value)} type="number" />
        </div>
        <Button
          onClick={() => {
            localStorage.setItem(
              "cinepass-admin-settings",
              JSON.stringify({ appName, supportEmail, gst, seatLock })
            );
            toast.success("Settings saved");
          }}
        >
          Save settings
        </Button>
      </div>
    </div>
  );
}
