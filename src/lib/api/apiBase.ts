// Helper to construct API base URL from runtime or build-time envs.
// Preference order:
// 1. window.__ENV[envKey] (runtime injection)
// 2. import.meta.env[envKey] (Vite build-time)
// 3. defaultHost provided

function stripTrailingSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

export function apiBase(envKey: string, defaultHost: string) {
  // runtime injected config
  let host: string | undefined;
  try {
    if (typeof window !== "undefined" && (window as any).__ENV && (window as any).__ENV[envKey]) {
      host = (window as any).__ENV[envKey];
    }
  } catch (e) {
    // ignore
  }

  // fall back to vite build-time env
  if (!host) {
    // @ts-ignore - import.meta.env is available in Vite
    host = (import.meta as any).env?.[envKey] || undefined;
  }

  const effective = (host || defaultHost) as string;
  const cleaned = stripTrailingSlash(effective);

  // If the provided host already contains a versioned API prefix (e.g. "/api/v1"),
  // don't append another `/api/v1` to avoid double prefixes. This allows deploy
  // time env values to include the full base if desired.
  if (/\/api\/v\d+/.test(cleaned)) {
    return cleaned;
  }

  return `${cleaned}/api/v1`;
}

export default apiBase;
