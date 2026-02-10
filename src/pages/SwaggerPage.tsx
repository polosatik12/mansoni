import { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, Play, Copy, Check, ArrowLeft, Loader2, Code2, Database, FunctionSquare, HardDrive, Shield, Wifi, Search } from "lucide-react";
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
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  description: string;
  tag: string;
  section: Section;
  auth: boolean;
  body?: ParamDef[];
  query?: ParamDef[];
  response: string;
}

type Section = "edge" | "tables" | "rpc" | "storage" | "auth" | "realtime";

const SECTION_META: Record<Section, { label: string; icon: React.ElementType; color: string }> = {
  edge: { label: "Edge Functions", icon: Code2, color: "text-blue-400" },
  tables: { label: "Database (REST)", icon: Database, color: "text-emerald-400" },
  rpc: { label: "RPC Functions", icon: FunctionSquare, color: "text-purple-400" },
  storage: { label: "Storage", icon: HardDrive, color: "text-amber-400" },
  auth: { label: "Auth", icon: Shield, color: "text-red-400" },
  realtime: { label: "Realtime", icon: Wifi, color: "text-cyan-400" },
};

// ─── Helpers ────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTIONS_BASE = SUPABASE_URL + "/functions/v1";
const REST_BASE = SUPABASE_URL + "/rest/v1";
const STORAGE_BASE = SUPABASE_URL + "/storage/v1";
const AUTH_BASE = SUPABASE_URL + "/auth/v1";

// ─── Table definitions ─────────────────────────────────────────

const TABLES = [
  { name: "profiles", desc: "Профили пользователей (display_name, avatar, bio, phone)", cols: "id, user_id, display_name, avatar_url, bio, phone, email, first_name, last_name, birth_date, gender, age, entity_type, website, verified, last_seen_at" },
  { name: "posts", desc: "Посты в ленте", cols: "id, author_id, content, is_published, likes_count, comments_count, shares_count, views_count, created_at" },
  { name: "post_media", desc: "Медиа-вложения к постам", cols: "id, post_id, media_url, media_type, sort_order" },
  { name: "post_likes", desc: "Лайки постов", cols: "id, post_id, user_id, created_at" },
  { name: "post_views", desc: "Просмотры постов", cols: "id, post_id, user_id, session_id, viewed_at" },
  { name: "comments", desc: "Комментарии к постам (с вложенностью)", cols: "id, post_id, author_id, content, parent_id, likes_count" },
  { name: "comment_likes", desc: "Лайки комментариев", cols: "id, comment_id, user_id" },
  { name: "followers", desc: "Подписки между пользователями", cols: "id, follower_id, following_id, created_at" },
  { name: "blocked_users", desc: "Заблокированные пользователи", cols: "id, blocker_id, blocked_id" },
  { name: "notifications", desc: "Уведомления (like, comment, follow)", cols: "id, user_id, type, actor_id, post_id, comment_id, content, is_read" },
  { name: "conversations", desc: "Личные чаты (DM)", cols: "id, pinned_message_id, created_at, updated_at" },
  { name: "conversation_participants", desc: "Участники чатов", cols: "id, conversation_id, user_id, last_read_at" },
  { name: "messages", desc: "Сообщения в DM чатах", cols: "id, conversation_id, sender_id, content, media_url, media_type, is_read, reply_to_message_id, forwarded_from, shared_post_id, shared_reel_id, edited_at, duration_seconds" },
  { name: "message_reactions", desc: "Реакции на сообщения (emoji)", cols: "id, message_id, user_id, emoji" },
  { name: "group_chats", desc: "Групповые чаты", cols: "id, name, description, avatar_url, owner_id, member_count" },
  { name: "group_chat_members", desc: "Участники групповых чатов", cols: "id, group_id, user_id, role" },
  { name: "group_chat_messages", desc: "Сообщения в группах", cols: "id, group_id, sender_id, content, media_url, media_type, forwarded_from, shared_post_id, shared_reel_id" },
  { name: "channels", desc: "Каналы (публичные/приватные)", cols: "id, name, description, avatar_url, owner_id, is_public, member_count, pinned_message_id" },
  { name: "channel_members", desc: "Участники каналов", cols: "id, channel_id, user_id, role" },
  { name: "channel_messages", desc: "Сообщения в каналах", cols: "id, channel_id, sender_id, content, media_url, media_type, forwarded_from, shared_post_id, shared_reel_id" },
  { name: "message_views", desc: "Просмотры сообщений каналов", cols: "message_id, user_id, viewed_at" },
  { name: "calls", desc: "Звонки (audio/video)", cols: "id, caller_id, callee_id, conversation_id, call_type, status, started_at, ended_at" },
  { name: "reels", desc: "Короткие видео (Reels)", cols: "id, author_id, video_url, thumbnail_url, description, likes_count, comments_count, views_count, shares_count" },
  { name: "reel_likes", desc: "Лайки Reels", cols: "id, reel_id, user_id" },
  { name: "reel_comments", desc: "Комментарии к Reels", cols: "id, reel_id, author_id, content, parent_id, likes_count" },
  { name: "reel_comment_likes", desc: "Лайки комментариев Reels", cols: "id, comment_id, user_id" },
  { name: "reel_views", desc: "Просмотры Reels", cols: "id, reel_id, user_id" },
  { name: "stories", desc: "Истории (24h)", cols: "id, author_id, media_url, media_type, text_content, background_color, expires_at" },
  { name: "story_views", desc: "Просмотры историй", cols: "id, story_id, viewer_id" },
  { name: "saved_posts", desc: "Сохранённые посты", cols: "id, user_id, post_id" },
  { name: "properties", desc: "Объекты недвижимости", cols: "id, title, price, city, district, rooms, area_total, property_type, deal_type, owner_id, latitude, longitude, status" },
  { name: "property_images", desc: "Фото объектов недвижимости", cols: "id, property_id, image_url, is_primary, sort_order" },
  { name: "property_favorites", desc: "Избранные объекты", cols: "id, property_id, user_id" },
  { name: "property_views", desc: "Просмотры объектов", cols: "id, property_id, user_id" },
  { name: "insurance_companies", desc: "Страховые компании", cols: "id, name, logo_url, rating, commission_rate, supported_products, regions" },
  { name: "insurance_products", desc: "Страховые продукты", cols: "id, company_id, name, category, price_from, coverage_amount, is_popular, badge" },
  { name: "insurance_policies", desc: "Полисы страхования", cols: "id, user_id, policy_number, product_id, insured_name, premium_amount, start_date, end_date, status" },
  { name: "insurance_claims", desc: "Страховые заявки", cols: "id, policy_id, user_id, claim_number, description, status, claim_amount" },
  { name: "insurance_calculations", desc: "Расчёты страхования", cols: "id, user_id, product_type, input_data, results, status" },
  { name: "insurance_clients", desc: "Клиенты страхового агента", cols: "id, full_name, phone, email, birth_date, agent_id" },
  { name: "agent_profiles", desc: "Профили страховых агентов", cols: "id, user_id, company_name, inn, status, commission_rate, total_earned, referral_code" },
  { name: "insurance_commissions", desc: "Комиссии агентов", cols: "id, agent_id, amount, rate, status, policy_id" },
  { name: "insurance_payouts", desc: "Выплаты агентам", cols: "id, agent_id, amount, payment_method, status" },
  { name: "policy_renewals", desc: "Напоминания о продлении полисов", cols: "id, policy_id, agent_id, reminder_date, days_before, is_sent" },
  { name: "phone_otps", desc: "OTP коды для SMS авторизации", cols: "id, phone, code, expires_at, attempts" },
  { name: "user_roles", desc: "Роли пользователей (user, admin, moderator)", cols: "id, user_id, role" },
];

// ─── RPC Functions ──────────────────────────────────────────────

const RPC_FUNCTIONS: EndpointDef[] = [
  { id: "rpc-get_or_create_dm", name: "get_or_create_dm", method: "POST", path: "/rpc/get_or_create_dm", description: "Находит или создаёт DM чат с пользователем. Возвращает conversation_id.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "target_user_id", type: "string", required: true, description: "UUID целевого пользователя" }], response: '"uuid-conversation-id"' },
  { id: "rpc-get_or_create_dm_by_display_name", name: "get_or_create_dm_by_display_name", method: "POST", path: "/rpc/get_or_create_dm_by_display_name", description: "Находит или создаёт DM чат по display_name.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "target_display_name", type: "string", required: true, description: "Display name пользователя" }], response: '"uuid-conversation-id"' },
  { id: "rpc-create_group_chat", name: "create_group_chat", method: "POST", path: "/rpc/create_group_chat", description: "Создаёт групповой чат и добавляет создателя как owner.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "p_name", type: "string", required: true, description: "Название группы" }, { name: "p_description", type: "string", description: "Описание" }, { name: "p_avatar_url", type: "string", description: "URL аватара" }], response: '"uuid-group-id"' },
  { id: "rpc-create_channel", name: "create_channel", method: "POST", path: "/rpc/create_channel", description: "Создаёт канал и добавляет владельца.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "p_name", type: "string", required: true, description: "Название канала" }, { name: "p_description", type: "string", description: "Описание" }, { name: "p_is_public", type: "boolean", description: "Публичный? (default: true)" }], response: '"uuid-channel-id"' },
  { id: "rpc-is_group_member", name: "is_group_member", method: "POST", path: "/rpc/is_group_member", description: "Проверяет, является ли пользователь членом группы.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "_group_id", type: "string", required: true, description: "UUID группы" }, { name: "_user_id", type: "string", required: true, description: "UUID пользователя" }], response: "true" },
  { id: "rpc-is_channel_member", name: "is_channel_member", method: "POST", path: "/rpc/is_channel_member", description: "Проверяет членство в канале.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "_channel_id", type: "string", required: true, description: "UUID канала" }, { name: "_user_id", type: "string", required: true, description: "UUID пользователя" }], response: "true" },
  { id: "rpc-is_channel_admin", name: "is_channel_admin", method: "POST", path: "/rpc/is_channel_admin", description: "Проверяет, является ли пользователь admin/owner канала.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "_channel_id", type: "string", required: true, description: "UUID канала" }, { name: "_user_id", type: "string", required: true, description: "UUID пользователя" }], response: "true" },
  { id: "rpc-is_blocked", name: "is_blocked", method: "POST", path: "/rpc/is_blocked", description: "Проверяет, заблокирован ли пользователь (в обе стороны).", tag: "Users", section: "rpc", auth: true, body: [{ name: "checker_id", type: "string", required: true, description: "UUID проверяющего" }, { name: "target_id", type: "string", required: true, description: "UUID цели" }], response: "false" },
  { id: "rpc-has_role", name: "has_role", method: "POST", path: "/rpc/has_role", description: "Проверяет наличие роли (user, admin, moderator).", tag: "Users", section: "rpc", auth: true, body: [{ name: "_user_id", type: "string", required: true, description: "UUID пользователя" }, { name: "_role", type: "string", required: true, description: "Роль: user | admin | moderator" }], response: "true" },
  { id: "rpc-get_user_conversation_ids", name: "get_user_conversation_ids", method: "POST", path: "/rpc/get_user_conversation_ids", description: "Возвращает список conversation_id пользователя.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "user_uuid", type: "string", required: true, description: "UUID пользователя" }], response: '["uuid-1", "uuid-2"]' },
  { id: "rpc-get_user_group_ids", name: "get_user_group_ids", method: "POST", path: "/rpc/get_user_group_ids", description: "Возвращает список group_id пользователя.", tag: "Chat", section: "rpc", auth: true, body: [{ name: "p_user_id", type: "string", required: true, description: "UUID пользователя" }], response: '["uuid-1", "uuid-2"]' },
  { id: "rpc-cleanup_expired_otps", name: "cleanup_expired_otps", method: "POST", path: "/rpc/cleanup_expired_otps", description: "Удаляет просроченные OTP коды. Возвращает кол-во удалённых.", tag: "System", section: "rpc", auth: false, response: "5" },
  { id: "rpc-cleanup_expired_stories", name: "cleanup_expired_stories", method: "POST", path: "/rpc/cleanup_expired_stories", description: "Удаляет просроченные истории (>24h). Возвращает кол-во.", tag: "System", section: "rpc", auth: false, response: "12" },
  { id: "rpc-check_missed_calls", name: "check_missed_calls", method: "POST", path: "/rpc/check_missed_calls", description: "Помечает пропущенными звонки, ожидающие >60 сек.", tag: "System", section: "rpc", auth: false, response: "null" },
];

// ─── Edge Functions ─────────────────────────────────────────────

const EDGE_FUNCTIONS: EndpointDef[] = [
  { id: "ef-health", name: "Health Check", method: "GET", path: "/health", description: "Проверка состояния платформы: БД, хранилище, задержка.", tag: "System", section: "edge", auth: false, response: `{"status":"healthy","checks":{"database":"ok","storage":"ok"},"latency":{"database_ms":12}}` },
  { id: "ef-ensure-profile", name: "Ensure Profile", method: "POST", path: "/ensure-profile", description: "Создаёт/обновляет профиль авторизованного пользователя.", tag: "Auth", section: "edge", auth: true, body: [{ name: "display_name", type: "string", description: "Имя (необязательно)" }], response: `{"ok":true}` },
  { id: "ef-create-test-user", name: "Create Test User", method: "POST", path: "/create-test-user", description: "Создаёт тестового пользователя с email/password и профилем.", tag: "Auth", section: "edge", auth: false, body: [{ name: "email", type: "string", required: true, description: "Email" }, { name: "password", type: "string", required: true, description: "Пароль" }, { name: "display_name", type: "string", description: "Имя" }, { name: "avatar_url", type: "string", description: "Аватар URL" }], response: `{"ok":true,"user_id":"uuid","email":"test@test.com"}` },
  { id: "ef-dev-panel-auth", name: "Dev Panel Auth", method: "POST", path: "/dev-panel-auth", description: "Авторизация Dev Panel. Возвращает токен.", tag: "Auth", section: "edge", auth: false, body: [{ name: "login", type: "string", required: true, description: "Логин" }, { name: "password", type: "string", required: true, description: "Пароль" }], response: `{"success":true,"token":"base64..."}` },
  { id: "ef-send-sms-otp", name: "Send SMS OTP", method: "POST", path: "/send-sms-otp", description: "Отправляет 4-значный OTP по SMS. Rate limit: 3/10мин.", tag: "SMS", section: "edge", auth: false, body: [{ name: "phone", type: "string", required: true, description: "Телефон (79001234567)" }], response: `{"success":true,"message":"Verification code sent"}` },
  { id: "ef-verify-sms-otp", name: "Verify SMS OTP", method: "POST", path: "/verify-sms-otp", description: "Проверяет OTP и создаёт/авторизует пользователя. 5 попыток.", tag: "SMS", section: "edge", auth: false, body: [{ name: "phone", type: "string", required: true, description: "Телефон" }, { name: "code", type: "string", required: true, description: "4-значный код" }, { name: "displayName", type: "string", description: "Имя для нового пользователя" }], response: `{"success":true,"userId":"uuid","isNewUser":true}` },
  { id: "ef-insurance-assistant", name: "Insurance AI Assistant", method: "POST", path: "/insurance-assistant", description: "AI-ассистент по страхованию. Streaming SSE. Model: gemini-3-flash.", tag: "AI", section: "edge", auth: true, body: [{ name: "messages", type: "json", required: true, description: '[{role:"user", content:"..."}]', default: '[{"role":"user","content":"Сколько стоит ОСАГО?"}]' }], response: `data: {"choices":[{"delta":{"content":"..."}}]}\ndata: [DONE]` },
  { id: "ef-property-assistant", name: "Property AI Assistant", method: "POST", path: "/property-assistant", description: "AI-ассистент по недвижимости. Streaming SSE. Model: gemini-3-flash.", tag: "AI", section: "edge", auth: true, body: [{ name: "messages", type: "json", required: true, description: '[{role:"user", content:"..."}]', default: '[{"role":"user","content":"Квартира в Москве за 10 млн"}]' }], response: `data: {"choices":[{"delta":{"content":"..."}}]}\ndata: [DONE]` },
  { id: "ef-sip-credentials", name: "SIP Credentials", method: "GET", path: "/sip-credentials", description: "SIP-конфигурация для VoIP звонков.", tag: "Telephony", section: "edge", auth: false, response: `{"configured":true,"wssUrl":"wss://...","domain":"sip.example.com"}` },
  { id: "ef-turn-credentials", name: "TURN Credentials", method: "GET", path: "/turn-credentials", description: "ICE/TURN серверы для WebRTC через Cloudflare. TTL: 24h.", tag: "Telephony", section: "edge", auth: false, response: `{"iceServers":[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:...","username":"...","credential":"..."}]}` },
];

// ─── Storage endpoints ──────────────────────────────────────────

const STORAGE_ENDPOINTS: EndpointDef[] = [
  { id: "st-list-buckets", name: "List Buckets", method: "GET", path: "/bucket", description: "Список всех storage бакетов: stories-media, chat-media, post-media, reels-media.", tag: "Buckets", section: "storage", auth: true, response: `[{"id":"post-media","name":"post-media","public":true},{"id":"chat-media","name":"chat-media","public":true}]` },
  { id: "st-list-objects", name: "List Objects", method: "POST", path: "/object/list/post-media", description: "Список файлов в бакете. Замените post-media на нужный бакет.", tag: "Objects", section: "storage", auth: true, body: [{ name: "prefix", type: "string", description: "Путь/папка (например: user-id/)" }, { name: "limit", type: "number", description: "Лимит (default: 100)", default: "100" }], response: `[{"name":"image.jpg","metadata":{"size":102400,"mimetype":"image/jpeg"}}]` },
  { id: "st-upload", name: "Upload File", method: "POST", path: "/object/post-media/path/file.jpg", description: "Загрузка файла. Путь = /object/{bucket}/{path}. Content-Type: multipart или binary.", tag: "Objects", section: "storage", auth: true, response: `{"Key":"post-media/path/file.jpg"}` },
  { id: "st-public-url", name: "Public URL", method: "GET", path: "/object/public/post-media/path/file.jpg", description: "Публичная ссылка на файл. Бакеты post-media, chat-media, stories-media, reels-media — все public.", tag: "Objects", section: "storage", auth: false, response: `(binary file content)` },
];

// ─── Auth endpoints ─────────────────────────────────────────────

const AUTH_ENDPOINTS: EndpointDef[] = [
  { id: "auth-signup", name: "Sign Up", method: "POST", path: "/signup", description: "Регистрация по email/password. Создаёт пользователя и профиль (через trigger).", tag: "Registration", section: "auth", auth: false, body: [{ name: "email", type: "string", required: true, description: "Email" }, { name: "password", type: "string", required: true, description: "Пароль (мин. 6 символов)" }], response: `{"access_token":"jwt...","user":{"id":"uuid","email":"..."}}` },
  { id: "auth-signin", name: "Sign In (Password)", method: "POST", path: "/token?grant_type=password", description: "Авторизация по email/password. Возвращает JWT.", tag: "Login", section: "auth", auth: false, body: [{ name: "email", type: "string", required: true, description: "Email" }, { name: "password", type: "string", required: true, description: "Пароль" }], response: `{"access_token":"jwt...","refresh_token":"...","user":{}}` },
  { id: "auth-signout", name: "Sign Out", method: "POST", path: "/logout", description: "Выход из системы. Инвалидирует токен.", tag: "Session", section: "auth", auth: true, response: `{}` },
  { id: "auth-user", name: "Get User", method: "GET", path: "/user", description: "Получить текущего авторизованного пользователя.", tag: "Session", section: "auth", auth: true, response: `{"id":"uuid","email":"...","user_metadata":{"full_name":"..."}}` },
  { id: "auth-refresh", name: "Refresh Token", method: "POST", path: "/token?grant_type=refresh_token", description: "Обновить JWT используя refresh_token.", tag: "Session", section: "auth", auth: false, body: [{ name: "refresh_token", type: "string", required: true, description: "Refresh token" }], response: `{"access_token":"new-jwt...","refresh_token":"new-refresh..."}` },
];

// ─── Realtime info ──────────────────────────────────────────────

const REALTIME_ENDPOINTS: EndpointDef[] = [
  { id: "rt-messages", name: "messages", method: "GET", path: "realtime:public:messages", description: "Подписка на INSERT/UPDATE/DELETE сообщений в DM. Используется для мгновенной доставки.", tag: "Subscriptions", section: "realtime", auth: true, response: `{"type":"INSERT","table":"messages","record":{"id":"...","content":"Привет!"}}` },
  { id: "rt-group-messages", name: "group_chat_messages", method: "GET", path: "realtime:public:group_chat_messages", description: "Подписка на сообщения в групповых чатах.", tag: "Subscriptions", section: "realtime", auth: true, response: `{"type":"INSERT","table":"group_chat_messages","record":{}}` },
  { id: "rt-channel-messages", name: "channel_messages", method: "GET", path: "realtime:public:channel_messages", description: "Подписка на сообщения в каналах.", tag: "Subscriptions", section: "realtime", auth: true, response: `{"type":"INSERT","table":"channel_messages","record":{}}` },
  { id: "rt-notifications", name: "notifications", method: "GET", path: "realtime:public:notifications", description: "Подписка на новые уведомления (лайки, комменты, подписки).", tag: "Subscriptions", section: "realtime", auth: true, response: `{"type":"INSERT","table":"notifications","record":{"type":"like"}}` },
  { id: "rt-conversations", name: "conversations", method: "GET", path: "realtime:public:conversations", description: "Подписка на обновления чатов (updated_at для сортировки).", tag: "Subscriptions", section: "realtime", auth: true, response: `{"type":"UPDATE","table":"conversations","record":{"updated_at":"..."}}` },
  { id: "rt-calls", name: "calls", method: "GET", path: "realtime:public:calls", description: "Подписка на входящие звонки (ringing → answered/missed).", tag: "Subscriptions", section: "realtime", auth: true, response: `{"type":"INSERT","table":"calls","record":{"status":"ringing"}}` },
  { id: "rt-presence", name: "presence", method: "GET", path: "realtime:presence", description: "Presence канал — онлайн-статус пользователей.", tag: "Presence", section: "realtime", auth: true, response: `{"event":"join","payload":{"user_id":"uuid","online_at":"..."}}` },
];

// ─── Generate table CRUD endpoints ──────────────────────────────

function generateTableEndpoints(): EndpointDef[] {
  return TABLES.flatMap((t) => [
    {
      id: `tbl-${t.name}-select`,
      name: `${t.name} — SELECT`,
      method: "GET" as const,
      path: `/${t.name}?select=*&limit=10`,
      description: `${t.desc}. Колонки: ${t.cols}`,
      tag: t.name,
      section: "tables" as Section,
      auth: true,
      query: [
        { name: "select", type: "string" as const, description: "Колонки (* = все)", default: "*" },
        { name: "limit", type: "number" as const, description: "Лимит строк", default: "10" },
        { name: "order", type: "string" as const, description: "Сортировка (created_at.desc)" },
      ],
      response: `[{ "id": "uuid", ... }]`,
    },
    {
      id: `tbl-${t.name}-insert`,
      name: `${t.name} — INSERT`,
      method: "POST" as const,
      path: `/${t.name}`,
      description: `Вставка в ${t.name}. Prefer: return=representation для получения созданной записи.`,
      tag: t.name,
      section: "tables" as Section,
      auth: true,
      body: [{ name: "body", type: "json" as const, required: true, description: `JSON объект с полями: ${t.cols}`, default: "{}" }],
      response: `[{ "id": "uuid", ... }]`,
    },
    {
      id: `tbl-${t.name}-update`,
      name: `${t.name} — UPDATE`,
      method: "PATCH" as const,
      path: `/${t.name}?id=eq.UUID`,
      description: `Обновление записи в ${t.name}. Фильтр через query params (id=eq.xxx).`,
      tag: t.name,
      section: "tables" as Section,
      auth: true,
      body: [{ name: "body", type: "json" as const, required: true, description: "Поля для обновления", default: "{}" }],
      response: `[]`,
    },
    {
      id: `tbl-${t.name}-delete`,
      name: `${t.name} — DELETE`,
      method: "DELETE" as const,
      path: `/${t.name}?id=eq.UUID`,
      description: `Удаление из ${t.name}. Обязательно укажите фильтр!`,
      tag: t.name,
      section: "tables" as Section,
      auth: true,
      response: `[]`,
    },
  ]);
}

// ─── All endpoints ──────────────────────────────────────────────

const ALL_ENDPOINTS = [
  ...EDGE_FUNCTIONS,
  ...generateTableEndpoints(),
  ...RPC_FUNCTIONS,
  ...STORAGE_ENDPOINTS,
  ...AUTH_ENDPOINTS,
  ...REALTIME_ENDPOINTS,
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  PUT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// ─── Component ──────────────────────────────────────────────────

export function SwaggerPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("edge");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEndpoints = useMemo(() => {
    let eps = ALL_ENDPOINTS.filter((e) => e.section === activeSection);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      eps = eps.filter((e) => e.name.toLowerCase().includes(q) || e.path.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return eps;
  }, [activeSection, searchQuery]);

  const tags = useMemo(() => [...new Set(filteredEndpoints.map((e) => e.tag))], [filteredEndpoints]);

  const stats = useMemo(() => ({
    tables: TABLES.length,
    rpc: RPC_FUNCTIONS.length,
    edge: EDGE_FUNCTIONS.length,
    storage: STORAGE_ENDPOINTS.length,
    auth: AUTH_ENDPOINTS.length,
    realtime: REALTIME_ENDPOINTS.length,
  }), []);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-3xl mx-auto flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Code2 className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">Maisoni API</h1>
            <p className="text-[11px] text-muted-foreground leading-none">
              {stats.tables} таблиц · {stats.rpc} RPC · {stats.edge} Edge · {stats.storage + stats.auth + stats.realtime} доп.
            </p>
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-3xl mx-auto px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {(Object.keys(SECTION_META) as Section[]).map((s) => {
            const meta = SECTION_META[s];
            const Icon = meta.icon;
            return (
              <button
                key={s}
                onClick={() => { setActiveSection(s); setExpandedId(null); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                  activeSection === s
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск endpoints..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Base URL */}
      <div className="max-w-3xl mx-auto px-4 pb-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5 font-mono">
          <span className="text-foreground/60 font-semibold">BASE</span>
          <span className="truncate">
            {activeSection === "edge" ? FUNCTIONS_BASE : activeSection === "storage" ? STORAGE_BASE : activeSection === "auth" ? AUTH_BASE : activeSection === "realtime" ? "wss://..." : REST_BASE}
          </span>
        </div>
      </div>

      {/* Endpoints */}
      <div className="max-w-3xl mx-auto px-4 space-y-5">
        {tags.map((tag) => (
          <section key={tag}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{tag}</h2>
            <div className="space-y-1.5">
              {filteredEndpoints
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
        {filteredEndpoints.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Ничего не найдено</p>
        )}
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
    ep.body?.forEach((p) => { if (p.default !== undefined) init[p.name] = p.default; });
    ep.query?.forEach((p) => { if (p.default !== undefined) init[`q_${p.name}`] = p.default; });
    return init;
  });
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isExecutable = ep.section !== "realtime";

  const handleRun = useCallback(async () => {
    if (!isExecutable) return;
    setLoading(true);
    setResult(null);
    setStatus(null);

    const base = ep.section === "edge" ? FUNCTIONS_BASE
      : ep.section === "storage" ? STORAGE_BASE
      : ep.section === "auth" ? AUTH_BASE
      : REST_BASE;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (ep.auth && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (ep.section === "tables" && (ep.method === "POST" || ep.method === "PATCH")) {
      headers["Prefer"] = "return=representation";
    }

    try {
      let body: string | undefined;
      if ((ep.method === "POST" || ep.method === "PATCH" || ep.method === "PUT") && ep.body) {
        if (ep.section === "tables" && ep.body[0]?.name === "body") {
          body = params["body"] || "{}";
        } else {
          const obj: Record<string, unknown> = {};
          ep.body.forEach((p) => {
            const val = params[p.name];
            if (val === undefined || val === "") return;
            if (p.type === "json") { try { obj[p.name] = JSON.parse(val); } catch { obj[p.name] = val; } }
            else if (p.type === "number") obj[p.name] = Number(val);
            else if (p.type === "boolean") obj[p.name] = val === "true";
            else obj[p.name] = val;
          });
          body = JSON.stringify(obj);
        }
      }

      const url = base + ep.path;
      const res = await fetch(url, { method: ep.method, headers, body: (ep.method === "GET" || ep.method === "DELETE") ? undefined : body });
      setStatus(res.status);

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("text/event-stream")) {
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
        try { setResult(JSON.stringify(JSON.parse(text), null, 2)); } catch { setResult(text); }
      }
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setStatus(0);
    } finally {
      setLoading(false);
    }
  }, [ep, params, token, isExecutable]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider flex-shrink-0", METHOD_COLORS[ep.method])}>
          {ep.method}
        </span>
        <span className="font-mono text-xs text-foreground/70 truncate flex-1">{ep.path}</span>
        {ep.auth && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 flex-shrink-0">🔒</span>}
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-3 py-3 space-y-3">
          <p className="text-xs text-muted-foreground">{ep.description}</p>

          {/* Body Params */}
          {ep.body && ep.body.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Body</h4>
              {ep.body.map((p) => (
                <div key={p.name} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-foreground">{p.name}</span>
                    <span className="text-[9px] text-muted-foreground">{p.type}</span>
                    {p.required && <span className="text-[9px] text-red-400">*</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{p.description}</p>
                  {p.type === "json" ? (
                    <textarea
                      className="w-full rounded-lg bg-muted/40 border border-border/40 px-2 py-1.5 text-[11px] font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[50px]"
                      value={params[p.name] || ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.default || "{}"}
                    />
                  ) : (
                    <input
                      className="w-full rounded-lg bg-muted/40 border border-border/40 px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                      value={params[p.name] || ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.default || ""}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {ep.auth && !token && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
              ⚠️ Требуется авторизация. Войдите в приложение.
            </p>
          )}

          {/* Execute */}
          {isExecutable && (
            <button
              onClick={handleRun}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Execute
            </button>
          )}

          {/* Example / Result */}
          {!result && (
            <div>
              <h4 className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">
                {ep.section === "realtime" ? "Payload Example" : "Response Example"}
              </h4>
              <pre className="text-[11px] font-mono bg-muted/30 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap text-muted-foreground max-h-36">{ep.response}</pre>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Response</h4>
                  {status !== null && (
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", status >= 200 && status < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                      {status}
                    </span>
                  )}
                </div>
                <button onClick={handleCopy} className="p-1 rounded hover:bg-muted transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-muted/30 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap text-foreground/80 max-h-52 overflow-y-auto">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SwaggerPage;
