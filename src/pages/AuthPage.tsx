import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type AuthMode = "select" | "login" | "register";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("select");
  
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");

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
      if (mode === "login") {
        const signInRes = await signIn(fakeEmail, password);
        if (signInRes.error) {
          toast.error("Аккаунт не найден или неверный номер");
          return;
        }
        toast.success("Добро пожаловать!");
        navigate("/");
      } else {
        // Register mode
        const name = (displayName || phone).trim();
        const signUpRes = await signUp(fakeEmail, password, name);
        if (signUpRes.error) {
          if (signUpRes.error.message?.includes("already registered")) {
            toast.error("Этот номер уже зарегистрирован. Попробуйте войти.");
          } else {
            toast.error(signUpRes.error.message || "Ошибка регистрации");
          }
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
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === "select") {
      navigate(-1);
    } else {
      setMode("select");
      setPhone("");
      setDisplayName("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dark elegant gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
      
      {/* Aurora-like floating orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-0 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 -left-10 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Subtle mesh gradient overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(at 40% 20%, hsla(212,70%,60%,0.3) 0px, transparent 50%),
                          radial-gradient(at 80% 0%, hsla(189,80%,50%,0.2) 0px, transparent 50%),
                          radial-gradient(at 0% 50%, hsla(255,60%,50%,0.2) 0px, transparent 50%),
                          radial-gradient(at 80% 50%, hsla(340,70%,50%,0.15) 0px, transparent 50%),
                          radial-gradient(at 0% 100%, hsla(210,80%,40%,0.2) 0px, transparent 50%)`,
      }} />

      {/* Back button */}
      {mode !== "select" && (
        <div className="relative z-20 p-4 safe-area-top">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center p-6 safe-area-top safe-area-bottom">
        <div className="max-w-sm mx-auto w-full space-y-8">
          
          {/* Glass avatar circle */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl" />
              
              {/* Glass circle */}
              <div className="relative w-32 h-32 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                <img src={logo} alt="Logo" className="w-20 h-20 object-contain relative z-10" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-white drop-shadow-lg">
              {mode === "select" && "Добро пожаловать"}
              {mode === "login" && "Вход"}
              {mode === "register" && "Регистрация"}
            </h1>
            <p className="text-white/70 text-base">
              {mode === "select" && "Выберите действие для продолжения"}
              {mode === "login" && "Введите номер телефона"}
              {mode === "register" && "Создайте новый аккаунт"}
            </p>
          </div>

          {/* Mode selection */}
          {mode === "select" && (
            <div className="space-y-4">
              {/* Glass card for buttons */}
              <div className="relative">
                <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl" />
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  
                  <Button 
                    onClick={() => setMode("login")}
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-white/90 hover:bg-white text-slate-800 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Вход
                  </Button>
                  
                  <Button 
                    onClick={() => setMode("register")}
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Регистрация
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Login/Register form */}
          {(mode === "login" || mode === "register") && (
            <>
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
                  
                  {/* Name input - only for register */}
                  {mode === "register" && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-white/5 rounded-2xl group-focus-within:bg-white/10 transition-colors" />
                      <div className="relative flex items-center">
                        <User className="absolute left-4 w-5 h-5 text-white/50" />
                        <Input
                          type="text"
                          placeholder="Ваше имя"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          className="pl-12 h-14 bg-transparent border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone input with country selector */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-2xl group-focus-within:bg-white/10 transition-colors" />
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      required
                    />
                  </div>

                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-white/90 hover:bg-white text-slate-800 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                        <span>Загрузка...</span>
                      </div>
                    ) : (
                      mode === "login" ? "Войти" : "Создать аккаунт"
                    )}
                  </Button>
                </form>
              </div>

              {/* Switch mode text */}
              <p className="text-center text-white/50 text-sm px-4">
                {mode === "login" ? (
                  <>
                    Нет аккаунта?{" "}
                    <button 
                      onClick={() => setMode("register")} 
                      className="text-white/80 underline hover:text-white"
                    >
                      Зарегистрируйтесь
                    </button>
                  </>
                ) : (
                  <>
                    Уже есть аккаунт?{" "}
                    <button 
                      onClick={() => setMode("login")} 
                      className="text-white/80 underline hover:text-white"
                    >
                      Войти
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bottom safe area gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
