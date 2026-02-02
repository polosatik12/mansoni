import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.startsWith('7') || digits.startsWith('8')) {
      const normalized = '7' + digits.slice(1);
      let formatted = '+7';
      if (normalized.length > 1) formatted += ' (' + normalized.slice(1, 4);
      if (normalized.length > 4) formatted += ') ' + normalized.slice(4, 7);
      if (normalized.length > 7) formatted += '-' + normalized.slice(7, 9);
      if (normalized.length > 9) formatted += '-' + normalized.slice(9, 11);
      return formatted;
    }
    
    return '+' + digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const phoneToEmail = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `user.${digits}@phoneauth.app`;
  };

  const phoneToPassword = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `ph_${digits}_secure`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    
    setLoading(true);
    const fakeEmail = phoneToEmail(phone);
    const password = phoneToPassword(phone);

    try {
      const signInRes = await signIn(fakeEmail, password);
      if (!signInRes.error) {
        toast.success("Добро пожаловать!");
        navigate("/");
        return;
      }

      const msg = signInRes.error?.message ?? "";
      if (!msg.toLowerCase().includes("invalid login")) {
        toast.error(signInRes.error?.message ?? "Ошибка входа");
        return;
      }

      const name = (displayName || phone).trim();
      const signUpRes = await signUp(fakeEmail, password, name);
      if (signUpRes.error) {
        toast.error(signUpRes.error.message || "Ошибка регистрации");
        return;
      }

      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase
          .from("profiles")
          .upsert({ 
            user_id: newUser.id, 
            phone: digits, 
            display_name: name 
          }, { 
            onConflict: 'user_id' 
          });
      }

      toast.success("Аккаунт создан! Добро пожаловать!");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500" />
      
      {/* Floating orbs for depth */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-pink-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 -right-20 w-96 h-96 bg-violet-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center p-6 safe-area-top safe-area-bottom">
        <div className="max-w-sm mx-auto w-full space-y-8">
          
          {/* Glass avatar circle */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl" />
              
              {/* Glass circle */}
              <div className="relative w-32 h-32 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                <span className="text-5xl font-light text-white/90 drop-shadow-lg">S</span>
              </div>
              
              {/* Sparkle decoration */}
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-white/80" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-white drop-shadow-lg">
              С возвращением
            </h1>
            <p className="text-white/70 text-base">
              Войдите по номеру телефона
            </p>
          </div>

          {/* Glass form card */}
          <div className="relative">
            {/* Card glow */}
            <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl" />
            
            <form 
              onSubmit={handleSubmit} 
              className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl"
            >
              {/* Inner highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              {/* Name input */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/5 rounded-2xl group-focus-within:bg-white/10 transition-colors" />
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-5 h-5 text-white/50" />
                  <Input
                    type="text"
                    placeholder="Имя (необязательно)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-12 h-14 bg-transparent border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Phone input */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/5 rounded-2xl group-focus-within:bg-white/10 transition-colors" />
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-5 h-5 text-white/50" />
                  <Input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    className="pl-12 h-14 bg-transparent border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl text-base font-semibold bg-white/90 hover:bg-white text-violet-700 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-violet-700/30 border-t-violet-700 rounded-full animate-spin" />
                    <span>Загрузка...</span>
                  </div>
                ) : (
                  "Войти"
                )}
              </Button>
            </form>
          </div>

          {/* Hint text */}
          <p className="text-center text-white/50 text-sm px-4">
            Если номера нет в системе — мы создадим аккаунт автоматически
          </p>
        </div>
      </div>

      {/* Bottom safe area gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
