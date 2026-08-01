/**
 * In-memory + Redis-backed platform data for Super Admin / Admin modules
 * that may not yet have dedicated Mongo collections in every environment.
 */
import { cache } from "@/lib/redis/client";
import { nanoid } from "nanoid";

async function getList<T>(key: string, seed: T[]): Promise<T[]> {
  const raw = await cache.get(key);
  if (raw) return JSON.parse(raw) as T[];
  await cache.set(key, JSON.stringify(seed), 60 * 60 * 24 * 90);
  return seed;
}

async function setList<T>(key: string, items: T[]) {
  await cache.set(key, JSON.stringify(items), 60 * 60 * 24 * 90);
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  mrr: number;
  status: "active" | "trial" | "suspended";
  commission: number;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  theatres: number;
  features: string[];
  active: boolean;
}

export interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  description: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  tenant: string;
  priority: "low" | "medium" | "high";
  status: "open" | "pending" | "resolved";
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
  placement: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "manager" | "employee";
  theatreId: string;
  active: boolean;
}

const SEED_TENANTS: Tenant[] = [
  {
    id: "tnt_1",
    name: "CineMax India",
    plan: "Enterprise",
    mrr: 89000,
    status: "active",
    commission: 8,
    createdAt: "2026-01-10",
  },
  {
    id: "tnt_2",
    name: "ScreenBox APAC",
    plan: "Growth",
    mrr: 42000,
    status: "active",
    commission: 10,
    createdAt: "2026-03-02",
  },
  {
    id: "tnt_3",
    name: "ReelHouse EU",
    plan: "Starter",
    mrr: 12000,
    status: "trial",
    commission: 12,
    createdAt: "2026-06-18",
  },
];

const SEED_PLANS: Plan[] = [
  {
    id: "pl_1",
    name: "Starter",
    price: 9999,
    theatres: 3,
    features: ["Bookings", "Wallet", "Basic analytics"],
    active: true,
  },
  {
    id: "pl_2",
    name: "Growth",
    price: 24999,
    theatres: 15,
    features: ["Everything in Starter", "Seat locking", "Staff RBAC"],
    active: true,
  },
  {
    id: "pl_3",
    name: "Enterprise",
    price: 79999,
    theatres: 999,
    features: ["Everything in Growth", "API access", "SLA support", "Custom CMS"],
    active: true,
  },
];

const SEED_FLAGS: FeatureFlag[] = [
  {
    id: "ff_1",
    key: "realtime_seats",
    label: "Realtime seats",
    enabled: true,
    description: "Socket-powered seat locks",
  },
  {
    id: "ff_2",
    key: "wallet_v2",
    label: "Wallet v2",
    enabled: true,
    description: "Gift cards + instant refunds",
  },
  {
    id: "ff_3",
    key: "elasticsearch",
    label: "Elasticsearch",
    enabled: false,
    description: "Advanced search adapter",
  },
  {
    id: "ff_4",
    key: "payu_checkout",
    label: "PayU checkout",
    enabled: true,
    description: "PayU Money gateway",
  },
];

const SEED_TICKETS: SupportTicket[] = [
  {
    id: "sup_1",
    subject: "Refund delay for weekend shows",
    tenant: "CineMax India",
    priority: "high",
    status: "open",
    createdAt: "2026-07-28",
  },
  {
    id: "sup_2",
    subject: "Need extra IMAX screens on plan",
    tenant: "ScreenBox APAC",
    priority: "medium",
    status: "pending",
    createdAt: "2026-07-30",
  },
  {
    id: "sup_3",
    subject: "Invoice copy for June",
    tenant: "ReelHouse EU",
    priority: "low",
    status: "resolved",
    createdAt: "2026-07-12",
  },
];

const SEED_BANNERS: Banner[] = [
  {
    id: "bn_1",
    title: "Monsoon Premieres",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    link: "/movies",
    active: true,
    placement: "home_hero",
  },
  {
    id: "bn_2",
    title: "Wallet cashback",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800",
    link: "/wallet",
    active: true,
    placement: "home_strip",
  },
];

const SEED_STAFF: StaffMember[] = [
  {
    id: "st_1",
    name: "Riya Manager",
    email: "manager@cinepass.app",
    role: "manager",
    theatreId: "default",
    active: true,
  },
  {
    id: "st_2",
    name: "Aman Counter",
    email: "staff@cinepass.app",
    role: "employee",
    theatreId: "default",
    active: true,
  },
];

export const platformStore = {
  tenants: {
    list: () => getList("platform:tenants", SEED_TENANTS),
    save: (items: Tenant[]) => setList("platform:tenants", items),
    async upsert(data: Partial<Tenant> & { name: string }) {
      const items = await this.list();
      if (data.id) {
        const next = items.map((t) => (t.id === data.id ? { ...t, ...data } : t));
        await this.save(next);
        return next.find((t) => t.id === data.id)!;
      }
      const created: Tenant = {
        id: `tnt_${nanoid(6)}`,
        name: data.name,
        plan: data.plan || "Starter",
        mrr: data.mrr || 0,
        status: data.status || "trial",
        commission: data.commission ?? 12,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      items.unshift(created);
      await this.save(items);
      return created;
    },
  },
  plans: {
    list: () => getList("platform:plans", SEED_PLANS),
    save: (items: Plan[]) => setList("platform:plans", items),
  },
  flags: {
    list: () => getList("platform:flags", SEED_FLAGS),
    async toggle(id: string) {
      const items = await this.list();
      const next = items.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
      await setList("platform:flags", next);
      return next;
    },
  },
  support: {
    list: () => getList("platform:support", SEED_TICKETS),
    async updateStatus(id: string, status: SupportTicket["status"]) {
      const items = await this.list();
      const next = items.map((t) => (t.id === id ? { ...t, status } : t));
      await setList("platform:support", next);
      return next.find((t) => t.id === id);
    },
  },
  banners: {
    list: () => getList("platform:banners", SEED_BANNERS),
    save: (items: Banner[]) => setList("platform:banners", items),
  },
  staff: {
    list: () => getList("theatre:staff", SEED_STAFF),
    save: (items: StaffMember[]) => setList("theatre:staff", items),
  },
};
