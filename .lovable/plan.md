

# Typing Indicator via Supabase Realtime Presence

## Overview
Add a real-time "is typing..." indicator to DM chats (`ChatConversation.tsx`) and group chats (`GroupConversation.tsx`). The feature uses **Supabase Realtime Presence** (no database tables needed) and throttles broadcasts to avoid network spam.

## How It Works

1. When a user types in the input field, their typing state is broadcast via a Supabase Presence channel scoped to the conversation/group ID.
2. Other participants subscribed to the same channel receive the presence state and display a typing indicator.
3. Typing status auto-expires after ~3 seconds of inactivity (the sender tracks `{ typing: true }` then `{ typing: false }` after a timeout).

## Implementation Steps

### Step 1: Create `useTypingIndicator` hook
**New file:** `src/hooks/useTypingIndicator.ts`

- Accepts a `channelName` (e.g., `typing:conv:{id}` or `typing:group:{id}`) and the current user's `displayName`.
- On mount, subscribes to a Supabase Presence channel.
- Exposes:
  - `sendTyping()` -- throttled function (max 1 call per 2 seconds) that calls `channel.track({ user_id, display_name, is_typing: true })`. Sets a 3-second timeout to automatically call `channel.track({ is_typing: false })`.
  - `typingUsers: string[]` -- array of display names currently typing (excluding the current user), derived from Presence `sync` events.
- On unmount, untracks and removes the channel.

The throttling will reuse the existing `useThrottledCallback` from `src/hooks/useDebounce.ts`.

### Step 2: Integrate into `ChatConversation.tsx`

- Import and call `useTypingIndicator` with channel name `typing:conv:${conversationId}`.
- Wire `sendTyping()` to the input's `onChange` handler (alongside `setInputText`).
- In the header, replace the status line (`lastSeenStatus` / participant count) with "**печатает...**" when `typingUsers.length > 0`. When typing stops, revert to the original status.
- The typing text will use a subtle animation (pulsing dots or italic style) and the same `text-emerald-400` color used for "online" status.

### Step 3: Integrate into `GroupConversation.tsx`

- Import and call `useTypingIndicator` with channel name `typing:group:${group.id}`.
- Wire `sendTyping()` to the input's `onChange` handler.
- In the header subtitle, replace the member count with "**[Name] печатает...**" (or "**2 печатают...**" for multiple users) when `typingUsers.length > 0`.

### Step 4: Clear typing on message send

- In both components, after a message is sent successfully, explicitly call `channel.track({ is_typing: false })` (via a `stopTyping()` function exposed by the hook) so the indicator disappears immediately rather than waiting for the 3-second timeout.

---

## Technical Details

### `useTypingIndicator` hook structure
```text
function useTypingIndicator(channelName, userId, displayName)
  |
  |-- Creates Supabase channel with Presence config (key = userId)
  |-- Listens to 'presence' sync events
  |     |-- Collects all presences where is_typing === true
  |     |-- Filters out current user
  |     |-- Sets typingUsers state
  |
  |-- sendTyping() [throttled to 2s interval]
  |     |-- channel.track({ is_typing: true, display_name })
  |     |-- clearTimeout(prev timer)
  |     |-- setTimeout(3s) -> channel.track({ is_typing: false })
  |
  |-- stopTyping()
  |     |-- channel.track({ is_typing: false })
  |     |-- clearTimeout
  |
  |-- Cleanup: untrack + remove channel on unmount
  |
  Returns { sendTyping, stopTyping, typingUsers }
```

### UI placement
- **DM chats**: The status subtitle in the header (line ~448-452 of ChatConversation.tsx) switches between `lastSeenStatus` and "печатает..." based on `typingUsers`.
- **Group chats**: The subtitle (line ~95-98 of GroupConversation.tsx) switches between member count and "[Name] печатает..." based on `typingUsers`.

### Throttle strategy
- `sendTyping()` is throttled to fire at most once every 2 seconds using `useThrottledCallback`.
- A 3-second inactivity timeout automatically resets the typing flag.
- On message send, `stopTyping()` is called immediately.

### Files to create
| File | Purpose |
|------|---------|
| `src/hooks/useTypingIndicator.ts` | Presence-based typing state hook |

### Files to modify
| File | Change |
|------|--------|
| `src/components/chat/ChatConversation.tsx` | Add hook, wire `onChange`, update header status |
| `src/components/chat/GroupConversation.tsx` | Add hook, wire `onChange`, update header status |

### No database changes needed
Supabase Presence is an in-memory, ephemeral feature -- no tables or migrations required.

