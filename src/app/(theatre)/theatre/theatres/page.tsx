"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

const empty = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  contactPhone: "",
  contactEmail: "",
  gstNumber: "",
  gstLegalName: "",
  amenities: "Dolby Atmos, Parking, F&B",
  mapUrl: "",
  lat: "19.076",
  lng: "72.8777",
};

export default function TheatresManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data } = await api.get("/owner/theatres");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load theatres"));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Theatre management"
        subtitle="Create and manage multiple theatres under your account"
      />

      <form
        className="grid sm:grid-cols-2 gap-3 rounded-xl border border-border p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.post("/owner/theatres", {
              ...form,
              lat: Number(form.lat),
              lng: Number(form.lng),
              amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
            });
            toast.success("Theatre submitted for Super Admin approval");
            setForm(empty);
            load();
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed");
          }
        }}
      >
        {(
          [
            ["name", "Theatre name"],
            ["address", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
            ["contactPhone", "Contact phone"],
            ["contactEmail", "Contact email"],
            ["gstNumber", "GST number"],
            ["gstLegalName", "GST legal name"],
            ["mapUrl", "Google Maps URL"],
            ["lat", "Latitude"],
            ["lng", "Longitude"],
            ["amenities", "Amenities (comma separated)"],
          ] as const
        ).map(([key, label]) => (
          <Input
            key={key}
            placeholder={label}
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required={["name", "address", "city", "state", "pincode"].includes(key)}
            className={key === "amenities" || key === "address" ? "sm:col-span-2" : ""}
          />
        ))}
        <Button type="submit" className="sm:col-span-2">
          Create theatre
        </Button>
      </form>

      <div className="space-y-3">
        {items.map((t) => (
          <div
            key={t._id}
            className="rounded-xl border border-border p-4 flex flex-col sm:flex-row justify-between gap-3"
          >
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {t.address}, {t.city}, {t.state} {t.pincode}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Screens: {t.screenCount || 0} · Capacity: {t.capacity || 0}
                {t.gstNumber ? ` · GST ${t.gstNumber}` : ""}
              </p>
              {t.mapUrl && (
                <a
                  href={t.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent underline"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={t.status === "approved" || t.status === "active" ? "success" : "outline"}>
                {t.status}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!confirm("Delete this theatre?")) return;
                  await api.delete(`/owner/theatres?id=${t._id}`);
                  toast.success("Deleted");
                  load();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
