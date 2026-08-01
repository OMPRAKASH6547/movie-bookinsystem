import type { MetadataRoute } from "next";
import { APP_URL } from "@/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/theatre/", "/super-admin/", "/api/", "/dashboard/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
