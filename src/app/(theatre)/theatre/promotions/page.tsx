"use client";
import { apiErrorMessage, type JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";

const OFFER_KINDS = [
  "auto_promo",
  "festival",
  "first_booking",
  "bogo",
  "flat",
  "seat_category",
  "show_time",
  "theatre",
  "payment_method",
  "special_event",
] as const;

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState<JsonRecord[]>([]);
  const [offers, setOffers] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"coupons" | "offers">("coupons");
  const [saving, setSaving] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: "10",
    minAmount: "0",
    maxDiscount: "",
    usageLimit: "1000",
    perUserLimit: "1",
    oneTimePerCustomer: false,
    audience: "all",
    firstBookingOnly: false,
    stackable: false,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    applicablePaymentMethods: "",
    buyQuantity: "1",
    getQuantity: "1",
  });

  const [offerForm, setOfferForm] = useState({
    name: "",
    description: "",
    kind: "auto_promo",
    discountType: "percentage",
    discountValue: "10",
    minAmount: "0",
    maxDiscount: "",
    autoApply: true,
    stackable: false,
    firstBookingOnly: false,
    priority: "100",
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    applicablePaymentMethods: "",
    applicableSeatCategories: "",
    applicableTimeSlots: "",
    buyQuantity: "1",
    getQuantity: "1",
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/owner/promotions");
      setCoupons(data.data?.coupons || []);
      setOffers(data.data?.offers || []);
    } catch {
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveCoupon = async () => {
    setSaving(true);
    try {
      await api.post("/owner/promotions", {
        entity: "coupon",
        ...couponForm,
        generateCode: !couponForm.code,
        discountValue: Number(couponForm.discountValue),
        minAmount: Number(couponForm.minAmount),
        maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : undefined,
        usageLimit: Number(couponForm.usageLimit),
        perUserLimit: Number(couponForm.perUserLimit),
        buyQuantity: Number(couponForm.buyQuantity),
        getQuantity: Number(couponForm.getQuantity),
        applicablePaymentMethods: couponForm.applicablePaymentMethods
          ? couponForm.applicablePaymentMethods.split(",").map((s) => s.trim())
          : [],
      });
      toast.success("Coupon saved");
      setCouponForm((f) => ({ ...f, code: "", name: "" }));
      load();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const saveOffer = async () => {
    setSaving(true);
    try {
      await api.post("/owner/promotions", {
        entity: "offer",
        ...offerForm,
        discountValue: Number(offerForm.discountValue),
        minAmount: Number(offerForm.minAmount),
        maxDiscount: offerForm.maxDiscount ? Number(offerForm.maxDiscount) : undefined,
        priority: Number(offerForm.priority),
        buyQuantity: Number(offerForm.buyQuantity),
        getQuantity: Number(offerForm.getQuantity),
        applicablePaymentMethods: offerForm.applicablePaymentMethods
          ? offerForm.applicablePaymentMethods.split(",").map((s) => s.trim())
          : [],
        applicableSeatCategories: offerForm.applicableSeatCategories
          ? offerForm.applicableSeatCategories.split(",").map((s) => s.trim())
          : [],
        applicableTimeSlots: offerForm.applicableTimeSlots
          ? offerForm.applicableTimeSlots.split(",").map((s) => s.trim())
          : [],
      });
      toast.success("Offer saved");
      setOfferForm((f) => ({ ...f, name: "" }));
      load();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (entity: "coupon" | "offer", id: string, isActive: boolean) => {
    try {
      await api.patch("/owner/promotions", { entity, id, isActive: !isActive });
      load();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Offers & coupons"
        subtitle="% / fixed / BOGO · auto promos · festival · seat/show/theatre/payment rules"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "coupons" ? "default" : "outline"}
          onClick={() => setTab("coupons")}
        >
          Coupons
        </Button>
        <Button
          size="sm"
          variant={tab === "offers" ? "default" : "outline"}
          onClick={() => setTab("offers")}
        >
          Offers
        </Button>
      </div>

      {tab === "coupons" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-semibold">Create coupon</h3>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Code (blank = auto)"
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                }
              />
              <Input
                placeholder="Name"
                value={couponForm.name}
                onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
              />
            </div>
            <Input
              placeholder="Description"
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
                <option value="flat">Flat</option>
                <option value="bogo">Buy X Get Y</option>
              </select>
              <Input
                placeholder="Value"
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
              />
            </div>
            {couponForm.discountType === "bogo" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Buy qty"
                  value={couponForm.buyQuantity}
                  onChange={(e) => setCouponForm({ ...couponForm, buyQuantity: e.target.value })}
                />
                <Input
                  placeholder="Get qty"
                  value={couponForm.getQuantity}
                  onChange={(e) => setCouponForm({ ...couponForm, getQuantity: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Min amount"
                value={couponForm.minAmount}
                onChange={(e) => setCouponForm({ ...couponForm, minAmount: e.target.value })}
              />
              <Input
                placeholder="Max discount"
                value={couponForm.maxDiscount}
                onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
              />
              <Input
                placeholder="Usage limit"
                value={couponForm.usageLimit}
                onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Per-user limit"
                value={couponForm.perUserLimit}
                onChange={(e) => setCouponForm({ ...couponForm, perUserLimit: e.target.value })}
              />
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={couponForm.audience}
                onChange={(e) => setCouponForm({ ...couponForm, audience: e.target.value })}
              >
                <option value="all">All users</option>
                <option value="new_users">New users only</option>
                <option value="existing_users">Existing users only</option>
                <option value="specific_users">Specific users</option>
              </select>
            </div>
            <Input
              placeholder="Payment methods (cash,upi,card)"
              value={couponForm.applicablePaymentMethods}
              onChange={(e) =>
                setCouponForm({ ...couponForm, applicablePaymentMethods: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={couponForm.validFrom}
                onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={couponForm.validUntil}
                onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={couponForm.oneTimePerCustomer}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, oneTimePerCustomer: e.target.checked })
                  }
                />
                One-time / customer
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={couponForm.firstBookingOnly}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, firstBookingOnly: e.target.checked })
                  }
                />
                First booking
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={couponForm.stackable}
                  onChange={(e) => setCouponForm({ ...couponForm, stackable: e.target.checked })}
                />
                Stackable
              </label>
            </div>
            <Button onClick={saveCoupon} loading={saving} loadingText="Saving…">
              Save coupon
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Active coupons</h3>
            {loading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : !coupons.length ? (
              <EmptyState variant="generic" title="No coupons yet" />
            ) : (
              coupons.map((c) => (
                <div
                  key={c._id}
                  className="rounded-xl border border-border p-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">
                      {c.code}{" "}
                      <Badge variant="outline">{c.discountType}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.name || c.description} · used {c.usedCount}/{c.usageLimit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.validFrom).toLocaleDateString()} →{" "}
                      {new Date(c.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggle("coupon", c._id, c.isActive)}>
                    {c.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "offers" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-semibold">Create offer</h3>
            <Input
              placeholder="Offer name"
              value={offerForm.name}
              onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={offerForm.description}
              onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
            />
            <select
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={offerForm.kind}
              onChange={(e) => setOfferForm({ ...offerForm, kind: e.target.value })}
            >
              {OFFER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={offerForm.discountType}
                onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
                <option value="flat">Flat</option>
                <option value="bogo">Buy X Get Y</option>
              </select>
              <Input
                placeholder="Value"
                value={offerForm.discountValue}
                onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })}
              />
            </div>
            <Input
              placeholder="Seat categories (vip,premium,regular)"
              value={offerForm.applicableSeatCategories}
              onChange={(e) =>
                setOfferForm({ ...offerForm, applicableSeatCategories: e.target.value })
              }
            />
            <Input
              placeholder="Time slots (09:00-12:00,18:00-21:00)"
              value={offerForm.applicableTimeSlots}
              onChange={(e) => setOfferForm({ ...offerForm, applicableTimeSlots: e.target.value })}
            />
            <Input
              placeholder="Payment methods (upi,cash)"
              value={offerForm.applicablePaymentMethods}
              onChange={(e) =>
                setOfferForm({ ...offerForm, applicablePaymentMethods: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={offerForm.validFrom}
                onChange={(e) => setOfferForm({ ...offerForm, validFrom: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={offerForm.validUntil}
                onChange={(e) => setOfferForm({ ...offerForm, validUntil: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offerForm.autoApply}
                  onChange={(e) => setOfferForm({ ...offerForm, autoApply: e.target.checked })}
                />
                Auto-apply
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offerForm.firstBookingOnly}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, firstBookingOnly: e.target.checked })
                  }
                />
                First booking
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offerForm.stackable}
                  onChange={(e) => setOfferForm({ ...offerForm, stackable: e.target.checked })}
                />
                Stackable
              </label>
            </div>
            <Button onClick={saveOffer} loading={saving} loadingText="Saving…">
              Save offer
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Active offers</h3>
            {loading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : !offers.length ? (
              <EmptyState variant="generic" title="No offers yet" />
            ) : (
              offers.map((o) => (
                <div
                  key={o._id}
                  className="rounded-xl border border-border p-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">
                      {o.name} <Badge variant="outline">{o.kind}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.discountType} {o.discountValue}
                      {o.autoApply ? " · auto" : ""} · used {o.usedCount}
                      {o.usageLimit != null ? `/${o.usageLimit}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggle("offer", o._id, o.isActive)}>
                    {o.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
