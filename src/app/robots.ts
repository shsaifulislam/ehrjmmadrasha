import { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/cms";

export default function robots(): MetadataRoute.Robots {
  const seo = getSeoConfig();
  const baseUrl = seo.canonicalBaseUrl || "https://www.ehrjmadrasha.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin",
          "/portal/",
          "/portal",
          "/teacher/",
          "/teacher",
          "/principal/",
          "/principal",
          "/api/",
          "/login",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
