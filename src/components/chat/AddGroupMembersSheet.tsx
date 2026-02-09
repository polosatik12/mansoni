import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Search, Check, Loader2, UserPlus } from "lucide-react";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useChannelManagement } from "@/hooks/useChannelManagement";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SearchResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AddGroupMembersSheetProps {
  groupId: string;
  existingMemberIds?: string[];
  open: boolean;
  onClose: () => void;
  onMembersAdded?: () => void;
  isChannel?: boolean;
}

export function AddGroupMembersSheet({
  groupId,
  existingMemberIds = [],
  open,
  onClose,
  onMembersAdded,
  isChannel = false,
}: AddGroupMembersSheetProps) {
  const { user } = useAuth();
  const { addMember: addGroupMember } = useGroupManagement();
  const { addMember: addChannelMember } = useChannelManagement();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Search users
  const searchUsers = useCallback(
    async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .ilike("display_name", `%${q}%`)
          .not("user_id", "eq", user?.id || "")
          .limit(20);

        if (error) throw error;

        // Filter out existing members
        const filtered = (data || []).filter(
          (p) => !existingMemberIds.includes(p.user_id)
        );
        setResults(filtered);
      } catch {
        console.error("Search error");
      } finally {
        setSearching(false);
      }
    },
    [user?.id, existingMemberIds]
  );

  // Debounced search with useEffect
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
  };

  const toggleUser = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selected.size === 0) return;

    setAdding(true);
    try {
      const addFn = isChannel ? addChannelMember : addGroupMember;
      const promises = Array.from(selected).map((userId) =>
        addFn(groupId, userId)
      );
      await Promise.all(promises);
      toast.success(`Добавлено: ${selected.size}`);
      setSelected(new Set());
      setQuery("");
      setResults([]);
      onMembersAdded?.();
    } catch {
      toast.error("Не удалось добавить участников");
    } finally {
      setAdding(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex flex-col z-[230]">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2035] to-[#071420]" />
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-60"
          style={{
            background: "radial-gradient(circle, #0066CC 0%, transparent 70%)",
            animation: "float-orb-1 15s ease-in-out infinite",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Назад</span>
          </button>
          <h2 className="font-semibold text-white text-base">Добавить</h2>
          <button
            onClick={handleAddSelected}
            disabled={selected.size === 0 || adding}
            className="px-3 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : selected.size > 0 ? (
              `Добавить (${selected.size})`
            ) : (
              "Добавить"
            )}
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="relative z-10 px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Поиск по имени..."
            autoFocus
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#6ab3f3]/40 transition-colors"
          />
        </div>

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Array.from(selected).map((userId) => {
              const u = results.find((r) => r.user_id === userId);
              return (
                <button
                  key={userId}
                  onClick={() => toggleUser(userId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6ab3f3]/20 border border-[#6ab3f3]/30 text-xs text-[#6ab3f3]"
                >
                  {u?.display_name || "User"}
                  <span className="text-white/40">✕</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {searching && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/50" />
          </div>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <UserPlus className="w-7 h-7 text-white/30" />
            </div>
            <p className="text-sm text-white/40">Никого не найдено</p>
          </div>
        )}

        {!searching && query.length < 2 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <p className="text-sm text-white/40">Введите имя для поиска</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {results.map((person) => {
            const isSelected = selected.has(person.user_id);
            return (
              <button
                key={person.user_id}
                onClick={() => toggleUser(person.user_id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <GradientAvatar
                  name={person.display_name || "User"}
                  seed={person.user_id}
                  avatarUrl={person.avatar_url}
                  size="sm"
                />
                <span className="flex-1 text-left text-sm text-white truncate">
                  {person.display_name || "Пользователь"}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#6ab3f3] border-[#6ab3f3]"
                      : "border-white/20"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
