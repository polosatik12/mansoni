import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, Loader2, User, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { BrandBackground } from '@/components/ui/brand-background';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setAvatarUrl(profile.avatar_url || '');
      setGender(profile.gender || '');
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast.success('Фото загружено');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl || null,
        gender: gender || null,
      });
      toast.success('Профиль обновлён');
      navigate(-1);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <BrandBackground />
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const genderLabel = gender === 'male' ? 'Мужской' : gender === 'female' ? 'Женский' : 'Не указан';

  return (
    <div className="min-h-screen flex flex-col relative">
      <BrandBackground />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-base font-semibold text-white">Редактировать профиль</h1>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="text-primary font-semibold text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Готово'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar section */}
        <div className="flex flex-col items-center py-6">
          <div className="relative" onClick={handleAvatarClick}>
            <Avatar className="w-20 h-20 cursor-pointer">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-muted">
                <User className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="mt-3 text-primary text-sm font-semibold drop-shadow-lg"
          >
            Изменить фото
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Fields — Instagram-style rows */}
        <div className="border-t border-white/10">
          {/* Имя */}
          <EditRow
            label="Имя"
            value={displayName}
            placeholder="Имя"
            editing={editingField === 'name'}
            onTap={() => setEditingField('name')}
            onChange={setDisplayName}
            onBlur={() => setEditingField(null)}
            maxLength={50}
          />

          {/* О себе */}
          <EditRow
            label="О себе"
            value={bio}
            placeholder="Расскажите о себе"
            editing={editingField === 'bio'}
            onTap={() => setEditingField('bio')}
            onChange={setBio}
            onBlur={() => setEditingField(null)}
            maxLength={150}
            multiline
          />

          {/* Ссылки */}
          <EditRow
            label="Ссылки"
            value={website}
            placeholder="Добавить ссылки"
            editing={editingField === 'website'}
            onTap={() => setEditingField('website')}
            onChange={setWebsite}
            onBlur={() => setEditingField(null)}
          />

          {/* Пол */}
          <div
            className="flex items-center px-4 py-3.5 border-b border-white/10 cursor-pointer active:bg-white/5"
            onClick={() => {
              const next = gender === 'male' ? 'female' : gender === 'female' ? '' : 'male';
              setGender(next);
            }}
          >
            <span className="text-sm text-white/60 w-28 shrink-0">Пол</span>
            <span className="flex-1 text-sm text-white">{genderLabel}</span>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline row component ── */
interface EditRowProps {
  label: string;
  value: string;
  placeholder: string;
  editing: boolean;
  onTap: () => void;
  onChange: (v: string) => void;
  onBlur: () => void;
  maxLength?: number;
  multiline?: boolean;
}

function EditRow({ label, value, placeholder, editing, onTap, onChange, onBlur, maxLength, multiline }: EditRowProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <div
      className="flex items-start px-4 py-3.5 border-b border-white/10 cursor-text"
      onClick={onTap}
    >
      <span className="text-sm text-white/60 w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        {editing ? (
          multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={3}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
              maxLength={maxLength}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
          )
        ) : (
          <span className={`text-sm ${value ? 'text-white' : 'text-white/30'}`}>
            {value || placeholder}
          </span>
        )}
      </div>
    </div>
  );
}
