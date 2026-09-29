import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoConfig } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = getSeoConfig();
  const baseUrl = seo.canonicalBaseUrl || "https://ehrj-madrasha.edu.bd";
  const now = new Date();

  // 1. Static Public Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/academic`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/admission`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/verify`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic Published Public Notices
  try {
    const publicNotices = await prisma.notice.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        audience: "PUBLIC",
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 100,
    });

    const noticeRoutes: MetadataRoute.Sitemap = publicNotices.map((n) => ({
      url: `${baseUrl}/notices/${n.id}`,
      lastModified: n.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...noticeRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    return staticRoutes;
  }
}
