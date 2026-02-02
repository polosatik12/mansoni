import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { RegistrationModal } from "@/components/auth/RegistrationModal";

type AuthMode = "select" | "login" | "register";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("select");
  const [phone, setPhone] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    
    setLoading(true);

    try {
      // Try to sign in with phone-based email
      const email = `user.${digits}@phoneauth.app`;
      const password = `ph_${digits}_secure`;
      
      const result = await signIn(email, password);
      
      if (result.error) {
        toast.error("Аккаунт не найден. Зарегистрируйтесь.");
        setMode("select");
      } else {
        toast.success("Добро пожаловать!");
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    
    setShowRegistrationModal(true);
  };

  const handleBack = () => {
    if (mode === "select") {
      navigate(-1);
    } else {
      setMode("select");
      setPhone("");
    }
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationModal(false);
    toast.success("Аккаунт создан! Добро пожаловать!");
    navigate("/");
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
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl" />
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
              {mode === "register" && "Введите номер телефона для регистрации"}
            </p>
          </div>

          {/* Mode selection */}
          {mode === "select" && (
            <div className="space-y-4">
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

          {/* Login form */}
          {mode === "login" && (
            <>
              <div className="relative">
                <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl" />
                
                <form 
                  onSubmit={handleLogin} 
                  className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-2xl group-focus-within:bg-white/10 transition-colors" />
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-white/90 hover:bg-white text-slate-800 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                        <span>Вход...</span>
                      </div>
                    ) : (
                      "Войти"
                    )}
                  </Button>
                </form>
              </div>

              <p className="text-center text-white/50 text-sm px-4">
                Нет аккаунта?{" "}
                <button 
                  onClick={() => setMode("register")} 
                  className="text-white/80 underline hover:text-white"
                >
                  Зарегистрируйтесь
                </button>
              </p>
            </>
          )}

          {/* Register form - just phone, then modal */}
          {mode === "register" && (
            <>
              <div className="relative">
                <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl" />
                
                <form 
                  onSubmit={handleRegisterClick} 
                  className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-2xl group-focus-within:bg-white/10 transition-colors" />
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-white/90 hover:bg-white text-slate-800 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Зарегистрироваться
                  </Button>
                </form>
              </div>

              <p className="text-center text-white/50 text-sm px-4">
                Уже есть аккаунт?{" "}
                <button 
                  onClick={() => setMode("login")} 
                  className="text-white/80 underline hover:text-white"
                >
                  Войти
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bottom safe area gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />

      {/* Registration Modal */}
      <RegistrationModal 
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        phone={phone}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}

export default AuthPage;
