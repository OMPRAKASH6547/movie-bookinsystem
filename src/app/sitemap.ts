import type { MetadataRoute } from "next";
import { APP_URL } from "@/constants";
import { SEED_MOVIES } from "@/data/movies";

export default function sitemap(): MetadataRoute.Sitemap {
  const movies = SEED_MOVIES.map((m) => ({
    url: `${APP_URL}/movies/${m.slug}`,
    lastModified: new Date(m.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${APP_URL}/movies`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${APP_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    ...movies,
  ];
}
