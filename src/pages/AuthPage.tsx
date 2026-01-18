import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
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
                ? "Войдите, чтобы продолжить" 
                : "Зарегистрируйтесь для доступа ко всем функциям"
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
              {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>

          {/* Switch mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium"
            >
              {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
