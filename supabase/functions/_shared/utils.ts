const ALLOWED_ORIGINS = [
  "https://mansoni.app",
  "https://app.mansoni.ru",
  "http://localhost:5173",
  "http://localhost:3000",
];

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.some(allowed => 
    requestOrigin.startsWith(allowed.replace(/\/$/, ''))
  ) ? requestOrigin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req.headers.get("origin")) });
  }
  return null;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: entry.resetTime - now };
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h = h & h;
  }
  return h.toString(36);
}

export function getClientId(req: Request): string {
  const auth = req.headers.get("authorization");
  if (auth) return `auth:${hashStr(auth)}`;
  
  const fwd = req.headers.get("x-forwarded-for");
  return `ip:${fwd?.split(",")[0]?.trim() || "unknown"}`;
}

export function rateLimitResponse(resetIn: number, origin: string | null): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests", retryAfter: Math.ceil(resetIn / 1000) }),
    {
      status: 429,
      headers: {
        ...getCorsHeaders(origin),
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(resetIn / 1000)),
      },
    }
  );
}

export function errorResponse(msg: string, status: number, origin: string | null): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
  });
}
