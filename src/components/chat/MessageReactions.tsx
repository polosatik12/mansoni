import type { ReactionGroup } from "@/hooks/useMessageReactions";

interface MessageReactionsProps {
  reactions: ReactionGroup[];
  isOwn: boolean;
  onToggle: (emoji: string) => void;
}

export function MessageReactions({ reactions, isOwn, onToggle }: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggle(reaction.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all active:scale-95 ${
            reaction.hasReacted
              ? "bg-[#2b5278]/80 border border-[#6ab3f3]/40"
              : "bg-white/10 border border-white/10 hover:bg-white/15"
          }`}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className={`text-[11px] font-medium ${
            reaction.hasReacted ? "text-[#6ab3f3]" : "text-white/60"
          }`}>
            {reaction.count}
          </span>
        </button>
      ))}
    </div>
  );
}
