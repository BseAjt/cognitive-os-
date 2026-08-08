const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeUrl(value: string) {
  const withProtocol = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(runtimeOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return normalizeUrl(configured);

  if (runtimeOrigin) return normalizeUrl(runtimeOrigin);

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return normalizeUrl(vercelUrl);

  return LOCAL_SITE_URL;
}
