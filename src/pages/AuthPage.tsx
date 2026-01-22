import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthMode = "phone" | "email";
type AuthStep = "phone_input" | "otp_verify" | "email_login" | "email_register";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithPhone, verifyOtp } = useAuth();
  
  const [authMode, setAuthMode] = useState<AuthMode>("phone");
  const [step, setStep] = useState<AuthStep>("phone_input");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [seeding, setSeeding] = useState(false);
  
  // Phone auth
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  
  // Email auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as +7 (XXX) XXX-XX-XX for Russian numbers
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

  const getCleanPhone = () => {
    return '+' + phone.replace(/\D/g, '');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = getCleanPhone();
    
    if (cleanPhone.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await signInWithPhone(cleanPhone);
      if (error) {
        toast.error(error.message || "Ошибка отправки кода");
      } else {
        toast.success("Код отправлен на " + phone);
        setStep("otp_verify");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otp.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await verifyOtp(getCleanPhone(), otp);
      if (error) {
        toast.error(error.message || "Неверный код");
      } else {
        toast.success("Добро пожаловать!");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === "email_login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Добро пожаловать!");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Аккаунт создан! Добро пожаловать!");
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-test-user", {
        body: {
          email: "dubaitech@test.local",
          password: "12345678",
          display_name: "Dubai Tech Hub",
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Тестовый пользователь готов", {
        description: "Логин: dubaitech@test.local • Пароль: 12345678",
      });

      setEmail("dubaitech@test.local");
      setPassword("12345678");
      setAuthMode("email");
      setStep("email_login");
    } finally {
      setSeeding(false);
    }
  };

  const switchToEmailMode = () => {
    setAuthMode("email");
    setStep("email_login");
  };

  const switchToPhoneMode = () => {
    setAuthMode("phone");
    setStep("phone_input");
    setOtp("");
  };

  const renderPhoneInput = () => (
    <form onSubmit={handleSendCode} className="space-y-4">
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="tel"
          placeholder="+7 (999) 123-45-67"
          value={phone}
          onChange={handlePhoneChange}
          className="pl-10 h-12 rounded-xl text-lg"
          autoFocus
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl text-base font-semibold"
        disabled={loading || phone.replace(/\D/g, '').length < 10}
      >
        {loading ? "Отправка..." : "Получить код"}
      </Button>
    </form>
  );

  const renderOtpVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground mb-2">Введите код из SMS</p>
        <p className="text-sm text-muted-foreground">{phone}</p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleVerifyCode}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
            <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button 
        onClick={handleVerifyCode}
        className="w-full h-12 rounded-xl text-base font-semibold"
        disabled={loading || otp.length !== 6}
      >
        {loading ? "Проверка..." : "Войти"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setStep("phone_input")}
          className="text-primary font-medium text-sm"
        >
          Изменить номер
        </button>
      </div>
    </div>
  );

  const renderEmailForm = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      {step === "email_register" && (
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Имя"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>
      )}

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pl-10 h-12 rounded-xl"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="pl-10 pr-10 h-12 rounded-xl"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Eye className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl text-base font-semibold"
        disabled={loading}
      >
        {loading ? "Загрузка..." : step === "email_login" ? "Войти" : "Создать аккаунт"}
      </Button>
    </form>
  );

  const getTitle = () => {
    if (step === "otp_verify") return "Подтверждение";
    if (step === "email_register") return "Регистрация";
    return "С возвращением!";
  };

  const getSubtitle = () => {
    if (step === "phone_input") return "Войдите по номеру телефона";
    if (step === "otp_verify") return "Мы отправили SMS с кодом";
    if (step === "email_login") return "Войдите через email";
    return "Создайте аккаунт";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => {
          if (step === "otp_verify") {
            setStep("phone_input");
          } else {
            navigate(-1);
          }
        }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{step === "email_login" || step === "email_register" ? "Email" : "Вход"}</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-sm mx-auto w-full space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary-foreground">S</span>
            </div>
            <h2 className="text-2xl font-bold">{getTitle()}</h2>
            <p className="text-muted-foreground">{getSubtitle()}</p>
          </div>

          {/* Form content */}
          {authMode === "phone" && step === "phone_input" && renderPhoneInput()}
          {authMode === "phone" && step === "otp_verify" && renderOtpVerify()}
          {authMode === "email" && renderEmailForm()}

          {/* Mode switchers */}
          <div className="text-center space-y-3">
            {authMode === "phone" && step === "phone_input" && (
              <button
                type="button"
                onClick={switchToEmailMode}
                className="text-primary font-medium text-sm"
              >
                Войти через Email
              </button>
            )}

            {authMode === "email" && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(step === "email_login" ? "email_register" : "email_login")}
                  className="text-primary font-medium block w-full"
                >
                  {step === "email_login" ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войти"}
                </button>
                <button
                  type="button"
                  onClick={switchToPhoneMode}
                  className="text-muted-foreground font-medium text-sm"
                >
                  Войти по телефону
                </button>
              </>
            )}

            {import.meta.env.DEV && (
              <div className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={createTestUser}
                  disabled={seeding}
                >
                  {seeding ? "Создаю тестовый аккаунт..." : "Создать тестового пользователя"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
