import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  
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

  // Convert phone to fake email for Supabase auth
  const phoneToEmail = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `${digits}@phone.local`;
  };

  // Generate deterministic password from phone
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
      if (isLogin) {
        const { error } = await signIn(fakeEmail, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("Номер не зарегистрирован");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Добро пожаловать!");
          navigate("/");
        }
      } else {
        const name = displayName || phone;
        const { error } = await signUp(fakeEmail, password, name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Этот номер уже зарегистрирован");
          } else {
            toast.error(error.message);
          }
        } else {
          // Update profile with phone number
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').update({ 
              phone: phone,
              display_name: name 
            }).eq('user_id', user.id);
          }
          toast.success("Аккаунт создан!");
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
          email: "79991234567@phone.local",
          password: "ph_79991234567_secure",
          display_name: "Тестовый пользователь",
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Тестовый пользователь готов", {
        description: "Номер: +7 (999) 123-45-67",
      });

      setPhone("+7 (999) 123-45-67");
      setIsLogin(true);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{isLogin ? "Вход" : "Регистрация"}</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-sm mx-auto w-full space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary-foreground">S</span>
            </div>
            <h2 className="text-2xl font-bold">
              {isLogin ? "С возвращением!" : "Создать аккаунт"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Войдите по номеру телефона" 
                : "Зарегистрируйтесь по номеру телефона"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Имя (необязательно)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            )}

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={handlePhoneChange}
                required
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>

          {/* Switch mode */}
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium"
            >
              {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войти"}
            </button>

            {import.meta.env.DEV && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={createTestUser}
                  disabled={seeding}
                >
                  {seeding ? "Создаю..." : "Создать тестового пользователя"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}