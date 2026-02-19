import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Search,
  MoreVertical,
  UserPlus,
  LogOut,
  Pencil,
  Shield,
  Crown,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { useAuth } from "@/hooks/useAuth";
import { useGroupMembers, GroupChat } from "@/hooks/useGroupChats";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { EditGroupSheet } from "./EditGroupSheet";
import { AddGroupMembersSheet } from "./AddGroupMembersSheet";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupInfoSheetProps {
  group: GroupChat;
  open: boolean;
  onClose: () => void;
  onLeave?: () => void;
  onGroupUpdated?: (updated: Partial<GroupChat>) => void;
  onSearchOpen?: () => void;
}

export function GroupInfoSheet({ group, open, onClose, onLeave, onGroupUpdated, onSearchOpen }: GroupInfoSheetProps) {
  const { user } = useAuth();
  const { members, loading, refetch: refetchMembers } = useGroupMembers(open ? group.id : null);
  const { removeMember, updateMemberRole } = useGroupManagement();

  const [editOpen, setEditOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const mutedKey = `group_muted_${group.id}`;
  const [muted, setMuted] = useState(() => localStorage.getItem(mutedKey) === "true");

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(mutedKey, String(next));
    toast.success(next ? "Уведомления отключены" : "Уведомления включены");
  };

  const isOwner = group.owner_id === user?.id;
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === "admin" || isOwner;


  const getRoleIcon = (role: string | null) => {
    if (role === "owner") return <Crown className="w-3.5 h-3.5 text-amber-400" />;
    if (role === "admin") return <Shield className="w-3.5 h-3.5 text-[#6ab3f3]" />;
    return null;
  };

  const getRoleLabel = (role: string | null) => {
    if (role === "owner") return "владелец";
    if (role === "admin") return "админ";
    return "";
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(group.id, userId);
      toast.success("Участник удалён");
      refetchMembers();
    } catch {
      toast.error("Не удалось удалить участника");
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string | null) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      await updateMemberRole(group.id, userId, newRole);
      toast.success(newRole === "admin" ? "Назначен админом" : "Снят с админа");
      refetchMembers();
    } catch {
      toast.error("Не удалось изменить роль");
    }
  };

  const handleLeave = async () => {
    try {
      await removeMember(group.id, user!.id);
      toast.success("Вы покинули группу");
      onLeave?.();
      onClose();
    } catch {
      toast.error("Не удалось покинуть группу");
    }
  };

  const handleMembersAdded = () => {
    refetchMembers();
    setAddMembersOpen(false);
  };

  const handleGroupEdited = (updated: Partial<GroupChat>) => {
    onGroupUpdated?.(updated);
    setEditOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 flex flex-col z-[210]">
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
          <div
            className="absolute bottom-20 right-0 w-[450px] h-[450px] rounded-full blur-[100px] opacity-50"
            style={{
              background: "radial-gradient(circle, #00A3B4 0%, transparent 70%)",
              animation: "float-orb-2 18s ease-in-out infinite",
              animationDelay: "-5s",
            }}
          />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="flex items-center px-2 py-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-semibold text-white text-base">Инфо</h2>
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditOpen(true)}
                className="px-2 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {/* Group avatar & name */}
          <div className="flex flex-col items-center pt-8 pb-4 px-4">
            <button
              onClick={() => group.avatar_url && setAvatarViewerOpen(true)}
              className={group.avatar_url ? "cursor-pointer" : "cursor-default"}
            >
              <GradientAvatar
                name={group.name}
                seed={group.id}
                avatarUrl={group.avatar_url}
                size="xl"
              />
            </button>
            <h1 className="text-xl font-bold text-white mt-4">{group.name}</h1>
            <p className="text-sm text-white/50 mt-1">
              {members.length} участник
              {members.length === 1 ? "" : members.length < 5 ? "а" : "ов"}
            </p>
            {group.description && (
              <p className="text-sm text-white/70 mt-3 text-center max-w-[280px]">
                {group.description}
              </p>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-center gap-6 py-4 border-t border-white/10 mx-4">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center gap-1.5 transition-colors ${muted ? "text-white/40" : "text-white/60 hover:text-white"}`}
            >
              <div className={`w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-colors ${muted ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20"}`}>
                {muted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <span className="text-[11px]">{muted ? "Включить" : "Выключить"}</span>
            </button>
            <button
              onClick={() => { onClose(); onSearchOpen?.(); }}
              className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-[11px]">Поиск</span>
            </button>
          </div>

          {/* Members section */}
          <div className="mt-2">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-[#6ab3f3]">
                Участники ({members.length})
              </span>
            </div>

            {/* Add members button */}
            {isAdmin && (
              <button
                onClick={() => setAddMembersOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#6ab3f3]/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#6ab3f3]" />
                </div>
                <span className="text-[#6ab3f3] font-medium text-sm">Добавить участника</span>
              </button>
            )}

            {/* Members list */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/50" />
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {members
                  .sort((a, b) => {
                    const order: Record<string, number> = { owner: 0, admin: 1, member: 2 };
                    return (order[a.role || "member"] || 2) - (order[b.role || "member"] || 2);
                  })
                  .map((member) => {
                    const isMe = member.user_id === user?.id;
                    const isMemberOwner = member.role === "owner";

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <GradientAvatar
                          name={member.profile?.display_name || "User"}
                          seed={member.user_id}
                          avatarUrl={member.profile?.avatar_url}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white truncate">
                              {member.profile?.display_name || "Пользователь"}
                              {isMe && " (вы)"}
                            </span>
                            {getRoleIcon(member.role)}
                          </div>
                          {getRoleLabel(member.role) && (
                            <span className="text-xs text-white/40">{getRoleLabel(member.role)}</span>
                          )}
                        </div>

                        {/* Member actions - only for owner, not on themselves or other owner */}
                        {isOwner && !isMe && !isMemberOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                                <MoreVertical className="w-4 h-4 text-white/40" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#17212b] border-white/10">
                              <DropdownMenuItem
                                onClick={() => handleToggleAdmin(member.user_id, member.role)}
                                className="text-white hover:bg-white/10"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                {member.role === "admin" ? "Снять админа" : "Назначить админом"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="text-red-400 hover:bg-white/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Удалить из группы
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Leave group button */}
          {!isOwner && (
            <div className="mt-4 px-4 pb-8">
              <button
                onClick={handleLeave}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Покинуть группу</span>
              </button>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </div>

      {/* Sub-sheets */}
      <EditGroupSheet
        group={group}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleGroupEdited}
      />

      <AddGroupMembersSheet
        groupId={group.id}
        existingMemberIds={members.map((m) => m.user_id)}
        open={addMembersOpen}
        onClose={() => setAddMembersOpen(false)}
        onMembersAdded={handleMembersAdded}
      />

      {/* Avatar viewer — same style as profile AvatarViewer */}
      <AnimatePresence>
        {avatarViewerOpen && group.avatar_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[350] flex flex-col items-center justify-center"
            onClick={() => setAvatarViewerOpen(false)}
          >
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
              <button
                onClick={() => setAvatarViewerOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-white font-semibold text-sm">{group.name}</span>
              <div className="w-10" />
            </div>
            <motion.img
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              src={group.avatar_url}
              alt={group.name}
              className="w-72 h-72 rounded-full object-cover"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


