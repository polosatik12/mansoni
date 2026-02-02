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
type AuthStep = "phone" | "otp";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("select");
  const [step, setStep] = useState<AuthStep>("phone");
  
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('send-sms-otp', {
        body: { phone: digits }
      });

      if (response.error) {
        console.error("Send OTP error:", response.error);
        toast.error("Ошибка отправки SMS. Попробуйте позже.");
        return;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      toast.success("Код отправлен на ваш номер");
      setOtpSent(true);
      setStep("otp");
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Ошибка отправки SMS");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 4) {
      toast.error("Введите 4-значный код");
      return;
    }
    
    setLoading(true);

    try {
      const digits = phone.replace(/\D/g, '');
      const response = await supabase.functions.invoke('verify-sms-otp', {
        body: { 
          phone: digits, 
          code: otpCode,
          displayName: mode === "register" ? displayName : undefined
        }
      });

      if (response.error) {
        console.error("Verify OTP error:", response.error);
        toast.error("Ошибка проверки кода");
        return;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      // Sign in with the returned credentials
      if (response.data?.email && response.data?.password) {
        // New user - sign in with password
        const signInResult = await signIn(response.data.email, response.data.password);
        if (signInResult.error) {
          toast.error("Ошибка входа. Попробуйте ещё раз.");
          return;
        }
      } else if (response.data?.email) {
        // Existing user - try to sign in
        const fakePassword = `ph_${digits}_secure`;
        const signInResult = await signIn(response.data.email, fakePassword);
        if (signInResult.error) {
          // Try alternative password formats
          const altPasswords = [
            `ph_${digits}_secure_1`,
            `ph_${digits}_secure_2`,
          ];
          let success = false;
          for (const pwd of altPasswords) {
            const result = await signIn(response.data.email, pwd);
            if (!result.error) {
              success = true;
              break;
            }
          }
          if (!success) {
            toast.error("Ошибка входа. Обратитесь в поддержку.");
            return;
          }
        }
      }

      toast.success(response.data?.isNewUser ? "Аккаунт создан! Добро пожаловать!" : "Добро пожаловать!");
      navigate("/");
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Ошибка проверки кода");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpCode("");
    await handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtpCode("");
      setOtpSent(false);
    } else if (mode === "select") {
      navigate(-1);
    } else {
      setMode("select");
      setPhone("");
      setDisplayName("");
      setOtpCode("");
      setOtpSent(false);
      setStep("phone");
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
      {(mode !== "select" || step === "otp") && (
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
              {mode === "login" && step === "phone" && "Вход"}
              {mode === "login" && step === "otp" && "Код подтверждения"}
              {mode === "register" && step === "phone" && "Регистрация"}
              {mode === "register" && step === "otp" && "Код подтверждения"}
            </h1>
            <p className="text-white/70 text-base">
              {mode === "select" && "Выберите действие для продолжения"}
              {step === "phone" && mode === "login" && "Введите номер телефона"}
              {step === "phone" && mode === "register" && "Создайте новый аккаунт"}
              {step === "otp" && `Код отправлен на ${phone}`}
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

          {/* Phone input step */}
          {(mode === "login" || mode === "register") && step === "phone" && (
            <>
              <div className="relative">
                <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl" />
                
                <form 
                  onSubmit={handleSendOTP} 
                  className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  
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
                        <span>Отправка...</span>
                      </div>
                    ) : (
                      "Получить код"
                    )}
                  </Button>
                </form>
              </div>

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

          {/* OTP verification step */}
          {step === "otp" && (
            <>
              <div className="relative">
                <div className="absolute -inset-1 bg-white/10 rounded-3xl blur-xl" />
                
                <form 
                  onSubmit={handleVerifyOTP} 
                  className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  
                  {/* OTP Input */}
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpCode[index] || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            const newCode = otpCode.split('');
                            newCode[index] = value;
                            setOtpCode(newCode.join('').slice(0, 4));
                            // Auto-focus next input
                            const nextInput = e.target.nextElementSibling as HTMLInputElement;
                            if (nextInput && value) {
                              nextInput.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpCode[index]) {
                            const prevInput = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                            if (prevInput) {
                              prevInput.focus();
                            }
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                          setOtpCode(paste);
                        }}
                        className="w-14 h-16 text-center text-2xl font-bold bg-white/10 border border-white/30 rounded-xl text-white focus:border-white/60 focus:outline-none focus:ring-0"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-white/90 hover:bg-white text-slate-800 shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading || otpCode.length !== 4}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                        <span>Проверка...</span>
                      </div>
                    ) : (
                      "Подтвердить"
                    )}
                  </Button>
                </form>
              </div>

              <p className="text-center text-white/50 text-sm px-4">
                Не получили код?{" "}
                <button 
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-white/80 underline hover:text-white disabled:opacity-50"
                >
                  Отправить повторно
                </button>
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
