import { useState } from "react";
import { X, Bell, BellOff, Search, Edit2, UserPlus, LogOut, Shield, Crown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { BrandBackground } from "@/components/ui/brand-background";
import { Channel } from "@/hooks/useChannels";
import { useChannelMembers } from "@/hooks/useChannelMembers";
import { useChannelRole } from "@/hooks/useChannelMembers";
import { useChannelManagement } from "@/hooks/useChannelManagement";
import { useAuth } from "@/hooks/useAuth";
import { ChannelEditSheet } from "./ChannelEditSheet";
import { AddGroupMembersSheet } from "./AddGroupMembersSheet";
import { toast } from "sonner";

interface ChannelInfoSheetProps {
  channel: Channel;
  open: boolean;
  onClose: () => void;
  onLeave?: () => void;
  onChannelUpdated?: (data: Partial<Channel>) => void;
}

export function ChannelInfoSheet({ channel, open, onClose, onLeave, onChannelUpdated }: ChannelInfoSheetProps) {
  const { user } = useAuth();
  const { members, loading: membersLoading, refetch: refetchMembers } = useChannelMembers(open ? channel.id : null);
  const { isAdmin, isOwner } = useChannelRole(open ? channel.id : null);
  const { removeMember, updateMemberRole } = useChannelManagement();

  const [editOpen, setEditOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!open) return null;

  const handleLeave = () => {
    onLeave?.();
    onClose();
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(channel.id, userId);
      toast.success("Подписчик удалён");
      refetchMembers();
    } catch {
      toast.error("Не удалось удалить подписчика");
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "member" : "admin";
      await updateMemberRole(channel.id, userId, newRole);
      toast.success(newRole === "admin" ? "Назначен администратором" : "Снят с администратора");
      refetchMembers();
    } catch {
      toast.error("Не удалось изменить роль");
    }
  };

  const handleChannelEdited = (data: Partial<Channel>) => {
    onChannelUpdated?.(data);
    setEditOpen(false);
  };

  const handleMembersAdded = () => {
    refetchMembers();
    setAddMembersOpen(false);
  };

  const getRoleBadge = (role: string) => {
    if (role === "owner") {
      return (
        <span className="flex items-center gap-1 text-[11px] text-amber-400">
          <Crown className="w-3 h-3" /> Владелец
        </span>
      );
    }
    if (role === "admin") {
      return (
        <span className="flex items-center gap-1 text-[11px] text-[#6ab3f3]">
          <Shield className="w-3 h-3" /> Админ
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <div className="fixed inset-0 z-[210] flex flex-col">
        <BrandBackground />

        {/* Header */}
        <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-white font-semibold text-base">Канал</h2>
            {isAdmin ? (
              <button onClick={() => setEditOpen(true)} className="text-[#6ab3f3] hover:text-[#6ab3f3]/80">
                <Edit2 className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-6" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative z-10">
          {/* Channel avatar + info */}
          <div className="flex flex-col items-center py-6 px-4">
            <GradientAvatar
              name={channel.name}
              seed={channel.id}
              avatarUrl={channel.avatar_url}
              size="xl"
            />
            <h3 className="text-white text-xl font-bold mt-4">{channel.name}</h3>
            {channel.description && (
              <p className="text-white/60 text-sm text-center mt-1 max-w-[280px]">{channel.description}</p>
            )}
            <p className="text-white/40 text-sm mt-1">
              {channel.member_count} подписчик{channel.member_count === 1 ? "" : channel.member_count < 5 ? "а" : "ов"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6 px-4 pb-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                {isMuted ? <BellOff className="w-5 h-5 text-white/60" /> : <Bell className="w-5 h-5 text-white" />}
              </div>
              <span className="text-xs text-white/60">{isMuted ? "Вкл. звук" : "Без звука"}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60">Поиск</span>
            </button>
          </div>

          {/* Members section */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white/80 text-sm font-medium">
                Подписчики ({members.length})
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setAddMembersOpen(true)}
                  className="flex items-center gap-1 text-[#6ab3f3] text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Добавить
                </button>
              )}
            </div>

            {membersLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/40" />
              </div>
            ) : (
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <GradientAvatar
                      name={member.profile?.display_name || "Пользователь"}
                      seed={member.user_id}
                      avatarUrl={member.profile?.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {member.profile?.display_name || "Пользователь"}
                      </p>
                      {getRoleBadge(member.role)}
                    </div>

                    {/* Owner can manage members */}
                    {isOwner && member.user_id !== user?.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAdmin(member.user_id, member.role)}
                          className="p-2 text-white/40 hover:text-[#6ab3f3] transition-colors"
                          title={member.role === "admin" ? "Снять админа" : "Назначить админом"}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave button (non-owners only) */}
          {!isOwner && (
            <div className="px-4 py-6">
              <Button
                onClick={handleLeave}
                variant="ghost"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Покинуть канал
              </Button>
            </div>
          )}

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>

      {/* Edit Sheet */}
      <ChannelEditSheet
        channel={channel}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleChannelEdited}
      />

      {/* Add Members Sheet (reusing the group one) */}
      {addMembersOpen && (
        <AddGroupMembersSheet
          groupId={channel.id}
          open={addMembersOpen}
          onClose={() => setAddMembersOpen(false)}
          onMembersAdded={handleMembersAdded}
          isChannel
        />
      )}
    </>
  );
}
