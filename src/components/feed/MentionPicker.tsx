import { useState, useEffect, useCallback } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface MentionedUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface MentionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selected: MentionedUser[];
  onSelect: (users: MentionedUser[]) => void;
}

export function MentionPicker({ isOpen, onClose, selected, onSelect }: MentionPickerProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentionedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${q}%`)
        .neq("user_id", user?.id || "")
        .limit(20);
      setResults((data as MentionedUser[]) || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const toggle = (u: MentionedUser) => {
    const exists = selected.find(s => s.user_id === u.user_id);
    if (exists) {
      onSelect(selected.filter(s => s.user_id !== u.user_id));
    } else {
      onSelect([...selected, u]);
    }
  };

  const isSelected = (id: string) => selected.some(s => s.user_id === id);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex flex-col"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative mt-auto h-[75vh] rounded-t-3xl overflow-hidden"
          style={{
            background: "rgba(20, 20, 30, 0.95)",
            backdropFilter: "blur(40px) saturate(1.5)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <button onClick={onClose} className="text-white/60">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-semibold">Отметить людей</h3>
            <button onClick={onClose} className="text-primary text-sm font-semibold">
              Готово
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Поиск..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50"
                autoFocus
              />
            </div>
          </div>

          {/* Selected tags */}
          {selected.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {selected.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => toggle(u)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-xs text-white"
                >
                  <span>{u.display_name}</span>
                  <X className="w-3 h-3 text-white/60" />
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 pb-safe native-scroll">
            {loading && (
              <div className="text-center py-8 text-white/40 text-sm">Поиск...</div>
            )}
            {!loading && query && results.length === 0 && (
              <div className="text-center py-8 text-white/40 text-sm">Никого не найдено</div>
            )}
            {!query && !loading && (
              <div className="text-center py-8 text-white/30 text-sm">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-white/20" />
                Введите имя пользователя
              </div>
            )}
            {results.map(u => (
              <button
                key={u.user_id}
                onClick={() => toggle(u)}
                className="w-full flex items-center gap-3 py-3 border-b border-white/5"
              >
                <GradientAvatar
                  name={u.display_name || ""}
                  seed={u.user_id}
                  avatarUrl={u.avatar_url}
                  size="sm"
                />
                <span className="text-white text-sm font-medium flex-1 text-left">
                  {u.display_name}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected(u.user_id) 
                    ? "bg-primary border-primary" 
                    : "border-white/30"
                }`}>
                  {isSelected(u.user_id) && (
                    <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
