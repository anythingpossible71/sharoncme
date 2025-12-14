import { logger } from "@/lib/logger";

export async function redirectCallback({ url, baseUrl }: { url: string; baseUrl: string }) {
  logger.info("Redirect callback", { url, baseUrl });

  // If being redirected to signin page, allow it
  if (url.includes("/auth/signin") || url === `${baseUrl}/auth/signin`) {
    return url;
  }

  // If being redirected to admin pages, allow it
  if (url.includes("/admin")) {
    return url;
  }

  // If being redirected to root page, allow it
  if (url === baseUrl || url === `${baseUrl}/` || url.includes("/landing")) {
    return `${baseUrl}/`;
  }

  // Allows relative callback URLs
  if (url.startsWith("/")) return `${baseUrl}${url}`;

  // Allows callback URLs on the same origin
  try {
    if (new URL(url).origin === baseUrl) return url;
  } catch (error) {
    // Invalid URL, fall through to default
  }

  // Default to root
  return `${baseUrl}/`;
}
