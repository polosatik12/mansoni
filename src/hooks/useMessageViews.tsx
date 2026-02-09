import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

/**
 * Hook to track and display real view counts for channel messages.
 * Uses IntersectionObserver to record views when messages enter the viewport,
 * and fetches aggregated counts from the message_views table.
 */
export function useMessageViews(channelId: string | null, messageIds: string[]) {
  const { user } = useAuth();
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch view counts for all message IDs
  const fetchViewCounts = useCallback(async () => {
    if (!channelId || messageIds.length === 0) return;

    try {
      // Query counts grouped by message_id
      const { data, error } = await supabase
        .from("message_views")
        .select("message_id")
        .in("message_id", messageIds);

      if (error) throw error;

      // Aggregate counts
      const counts: Record<string, number> = {};
      (data || []).forEach((row) => {
        counts[row.message_id] = (counts[row.message_id] || 0) + 1;
      });

      setViewCounts(counts);
    } catch (err) {
      console.error("Error fetching view counts:", err);
    }
  }, [channelId, messageIds.join(",")]);

  useEffect(() => {
    fetchViewCounts();
  }, [fetchViewCounts]);

  // Flush pending views in batch
  const flushPending = useCallback(async () => {
    if (!user || pendingRef.current.size === 0) return;

    const batch = Array.from(pendingRef.current);
    pendingRef.current.clear();

    try {
      const rows = batch.map((messageId) => ({
        message_id: messageId,
        user_id: user.id,
      }));

      // Use upsert with onConflict to avoid duplicates
      const { error } = await supabase
        .from("message_views")
        .upsert(rows, { onConflict: "message_id,user_id", ignoreDuplicates: true });

      if (error) throw error;

      // Optimistically update counts
      setViewCounts((prev) => {
        const next = { ...prev };
        batch.forEach((id) => {
          next[id] = (next[id] || 0) + 1;
        });
        return next;
      });
    } catch (err) {
      console.error("Error recording views:", err);
    }
  }, [user]);

  // Schedule batch flush (debounced)
  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      flushPending();
    }, 500);
  }, [flushPending]);

  // Mark a single message as viewed
  const markAsViewed = useCallback(
    (messageId: string) => {
      if (!user || trackedRef.current.has(messageId)) return;
      trackedRef.current.add(messageId);
      pendingRef.current.add(messageId);
      scheduleFlush();
    },
    [user, scheduleFlush]
  );

  // Set up IntersectionObserver
  const setupObserver = useCallback(
    (scrollContainer: HTMLElement | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!scrollContainer || !user) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const messageId = (entry.target as HTMLElement).dataset.messageId;
              if (messageId) {
                markAsViewed(messageId);
              }
            }
          });
        },
        {
          root: scrollContainer,
          threshold: 0.5, // 50% visible
        }
      );

      // Observe all message elements
      const messageElements = scrollContainer.querySelectorAll("[data-message-id]");
      messageElements.forEach((el) => {
        observerRef.current?.observe(el);
      });
    },
    [user, markAsViewed]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      // Flush remaining views
      flushPending();
    };
  }, [flushPending]);

  return {
    viewCounts,
    setupObserver,
    getViewCount: (messageId: string) => viewCounts[messageId] || 0,
  };
}
