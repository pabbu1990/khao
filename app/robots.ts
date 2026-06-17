import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the app/auth surfaces out of search results.
      disallow: ["/dashboard", "/admin", "/auth", "/post-login", "/reset"],
    },
    sitemap: "https://thekhao.com/sitemap.xml",
    host: "https://thekhao.com",
  };
}
