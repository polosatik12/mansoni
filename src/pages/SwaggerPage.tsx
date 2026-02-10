import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Play, Copy, Check, ArrowLeft, Loader2, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ──────────────────────────────────────────────────────

interface ParamDef {
  name: string;
  type: "string" | "number" | "boolean" | "json";
  required?: boolean;
  description: string;
  default?: string;
}

interface EndpointDef {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  tag: string;
  auth: boolean;
  body?: ParamDef[];
  response: string; // example JSON
}

// ─── Endpoint Catalog ───────────────────────────────────────────

const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

const endpoints: EndpointDef[] = [
  {
    id: "health",
    name: "Health Check",
    method: "GET",
    path: "/health",
    description: "Проверка состояния платформы: база данных, хранилище, задержка.",
    tag: "System",
    auth: false,
    response: `{
  "status": "healthy",
  "timestamp": "2026-02-10T12:00:00Z",
  "version": "1.0.0",
  "checks": { "database": "ok", "storage": "ok" },
  "latency": { "database_ms": 12 }
}`,
  },
  {
    id: "ensure-profile",
    name: "Ensure Profile",
    method: "POST",
    path: "/ensure-profile",
    description: "Создаёт или обновляет профиль авторизованного пользователя в таблице profiles.",
    tag: "Auth",
    auth: true,
    body: [
      { name: "display_name", type: "string", description: "Отображаемое имя (необязательно)", default: "" },
    ],
    response: `{ "ok": true }`,
  },
  {
    id: "create-test-user",
    name: "Create Test User",
    method: "POST",
    path: "/create-test-user",
    description: "Создаёт тестового пользователя с email/password и профилем. Только для dev-среды.",
    tag: "Auth",
    auth: false,
    body: [
      { name: "email", type: "string", required: true, description: "Email нового пользователя" },
      { name: "password", type: "string", required: true, description: "Пароль" },
      { name: "display_name", type: "string", description: "Имя пользователя" },
      { name: "avatar_url", type: "string", description: "URL аватара" },
    ],
    response: `{ "ok": true, "user_id": "uuid", "email": "test@test.com", "display_name": "Test" }`,
  },
  {
    id: "dev-panel-auth",
    name: "Dev Panel Auth",
    method: "POST",
    path: "/dev-panel-auth",
    description: "Авторизация для Dev Panel. Возвращает токен сессии.",
    tag: "Auth",
    auth: false,
    body: [
      { name: "login", type: "string", required: true, description: "Логин" },
      { name: "password", type: "string", required: true, description: "Пароль" },
    ],
    response: `{ "success": true, "token": "base64..." }`,
  },
  {
    id: "send-sms-otp",
    name: "Send SMS OTP",
    method: "POST",
    path: "/send-sms-otp",
    description: "Отправляет 4-значный OTP код на телефон через SMS.ru. Rate limit: 3 SMS / 10 мин.",
    tag: "SMS",
    auth: false,
    body: [
      { name: "phone", type: "string", required: true, description: "Номер телефона (например: 79001234567)" },
    ],
    response: `{ "success": true, "message": "Verification code sent" }`,
  },
  {
    id: "verify-sms-otp",
    name: "Verify SMS OTP",
    method: "POST",
    path: "/verify-sms-otp",
    description: "Проверяет OTP код и создаёт/авторизует пользователя. Макс. 5 попыток.",
    tag: "SMS",
    auth: false,
    body: [
      { name: "phone", type: "string", required: true, description: "Номер телефона" },
      { name: "code", type: "string", required: true, description: "4-значный код" },
      { name: "displayName", type: "string", description: "Имя для нового пользователя" },
    ],
    response: `{ "success": true, "userId": "uuid", "email": "user.79001234567@phoneauth.app", "isNewUser": true }`,
  },
  {
    id: "insurance-assistant",
    name: "Insurance Assistant",
    method: "POST",
    path: "/insurance-assistant",
    description: "AI-ассистент по страхованию. Streaming (SSE). Rate limit: 60 req/min.",
    tag: "AI",
    auth: true,
    body: [
      { name: "messages", type: "json", required: true, description: 'Массив сообщений [{role:"user", content:"..."}]', default: '[{"role":"user","content":"Сколько стоит ОСАГО?"}]' },
    ],
    response: `data: {"choices":[{"delta":{"content":"ОСАГО стоит..."}}]}\n\ndata: [DONE]`,
  },
  {
    id: "property-assistant",
    name: "Property Assistant",
    method: "POST",
    path: "/property-assistant",
    description: "AI-ассистент по недвижимости. Streaming (SSE). Rate limit: 60 req/min.",
    tag: "AI",
    auth: true,
    body: [
      { name: "messages", type: "json", required: true, description: 'Массив сообщений [{role:"user", content:"..."}]', default: '[{"role":"user","content":"Квартира в Москве за 10 млн"}]' },
    ],
    response: `data: {"choices":[{"delta":{"content":"Рекомендую..."}}]}\n\ndata: [DONE]`,
  },
  {
    id: "sip-credentials",
    name: "SIP Credentials",
    method: "GET",
    path: "/sip-credentials",
    description: "Возвращает SIP-конфигурацию для VoIP звонков (WSS URL, домен, логин).",
    tag: "Telephony",
    auth: false,
    response: `{ "configured": true, "wssUrl": "wss://...", "domain": "sip.example.com", "username": "user", "password": "***" }`,
  },
  {
    id: "turn-credentials",
    name: "TURN Credentials",
    method: "GET",
    path: "/turn-credentials",
    description: "Генерирует ICE/TURN серверы для WebRTC через Cloudflare. TTL: 24 часа.",
    tag: "Telephony",
    auth: false,
    response: `{ "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }, { "urls": "turn:...", "username": "...", "credential": "..." }] }`,
  },
];

const TAGS = [...new Set(endpoints.map((e) => e.tag))];
const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

// ─── Component ──────────────────────────────────────────────────

export function SwaggerPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-3xl mx-auto flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Code2 className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-base font-bold leading-tight">Maisoni API</h1>
            <p className="text-[11px] text-muted-foreground leading-none">Swagger Playground</p>
          </div>
        </div>
      </header>

      {/* Base URL */}
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 font-mono">
          <span className="text-foreground/70">BASE</span>
          <span className="truncate">{FUNCTIONS_BASE}</span>
        </div>
      </div>

      {/* Endpoints by Tag */}
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {TAGS.map((tag) => (
          <section key={tag}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{tag}</h2>
            <div className="space-y-2">
              {endpoints
                .filter((e) => e.tag === tag)
                .map((ep) => (
                  <EndpointCard
                    key={ep.id}
                    endpoint={ep}
                    expanded={expandedId === ep.id}
                    onToggle={() => setExpandedId(expandedId === ep.id ? null : ep.id)}
                    token={session?.access_token}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─── Endpoint Card ──────────────────────────────────────────────

function EndpointCard({
  endpoint: ep,
  expanded,
  onToggle,
  token,
}: {
  endpoint: EndpointDef;
  expanded: boolean;
  onToggle: () => void;
  token?: string;
}) {
  const [params, setParams] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    ep.body?.forEach((p) => {
      if (p.default !== undefined) init[p.name] = p.default;
    });
    return init;
  });
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setStatus(null);

    const url = FUNCTIONS_BASE + ep.path;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (ep.auth && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Build body
      let body: string | undefined;
      if (ep.method === "POST" && ep.body) {
        const obj: Record<string, unknown> = {};
        ep.body.forEach((p) => {
          const val = params[p.name];
          if (val === undefined || val === "") return;
          if (p.type === "json") {
            try { obj[p.name] = JSON.parse(val); } catch { obj[p.name] = val; }
          } else if (p.type === "number") {
            obj[p.name] = Number(val);
          } else if (p.type === "boolean") {
            obj[p.name] = val === "true";
          } else {
            obj[p.name] = val;
          }
        });
        body = JSON.stringify(obj);
      }

      const res = await fetch(url, { method: ep.method, headers, body });
      setStatus(res.status);

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("text/event-stream")) {
        // Read SSE stream as text
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = "";
        if (reader) {
          let done = false;
          while (!done) {
            const chunk = await reader.read();
            done = chunk.done;
            if (chunk.value) text += decoder.decode(chunk.value, { stream: true });
            if (text.length > 2000) { text += "\n... (truncated)"; break; }
          }
        }
        setResult(text);
      } else {
        const text = await res.text();
        try {
          setResult(JSON.stringify(JSON.parse(text), null, 2));
        } catch {
          setResult(text);
        }
      }
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setStatus(0);
    } finally {
      setLoading(false);
    }
  }, [ep, params, token]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider", METHOD_COLORS[ep.method])}>
          {ep.method}
        </span>
        <span className="font-mono text-sm text-foreground/80 truncate flex-1">{ep.path}</span>
        {ep.auth && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">🔒</span>
        )}
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border/40 px-3 py-3 space-y-3">
          <p className="text-sm text-muted-foreground">{ep.description}</p>

          {/* Params */}
          {ep.body && ep.body.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Body Parameters</h4>
              {ep.body.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.type}</span>
                    {p.required && <span className="text-[10px] text-red-400">required</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{p.description}</p>
                  {p.type === "json" ? (
                    <textarea
                      className="w-full rounded-lg bg-muted/50 border border-border/50 px-2.5 py-1.5 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[60px]"
                      value={params[p.name] || ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.default || "{}"}
                    />
                  ) : (
                    <input
                      className="w-full rounded-lg bg-muted/50 border border-border/50 px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={params[p.name] || ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.default || ""}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Auth warning */}
          {ep.auth && !token && (
            <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
              ⚠️ Этот endpoint требует авторизации. Войдите в приложение для автоматической передачи токена.
            </p>
          )}

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute
          </button>

          {/* Example Response */}
          {!result && (
            <div>
              <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">Example Response</h4>
              <pre className="text-xs font-mono bg-muted/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-muted-foreground max-h-48">{ep.response}</pre>
            </div>
          )}

          {/* Live Result */}
          {result && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Response</h4>
                  {status !== null && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", status >= 200 && status < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                      {status}
                    </span>
                  )}
                </div>
                <button onClick={handleCopy} className="p-1 rounded hover:bg-muted transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>
              <pre className="text-xs font-mono bg-muted/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-foreground/80 max-h-64 overflow-y-auto">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SwaggerPage;
