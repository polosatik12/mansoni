import { Search, Building2, Shield, Car, Briefcase, GraduationCap, Heart, Plane, ShoppingBag, UtensilsCrossed, Dumbbell, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  available: boolean;
}

const availableModules: Module[] = [
  {
    id: "realestate",
    name: "Недвижимость",
    description: "Аренда и продажа",
    icon: Building2,
    color: "bg-blue-500/10 text-blue-500",
    available: true,
  },
  {
    id: "insurance",
    name: "Страхование",
    description: "Все виды страховок",
    icon: Shield,
    color: "bg-emerald-500/10 text-emerald-500",
    available: true,
  },
];

const comingSoonModules: Module[] = [
  {
    id: "auto",
    name: "Авто",
    description: "Купля-продажа авто",
    icon: Car,
    color: "bg-rose-500/10 text-rose-500",
    available: false,
  },
  {
    id: "jobs",
    name: "Работа",
    description: "Вакансии и резюме",
    icon: Briefcase,
    color: "bg-orange-500/10 text-orange-500",
    available: false,
  },
  {
    id: "education",
    name: "Образование",
    description: "Курсы и обучение",
    icon: GraduationCap,
    color: "bg-violet-500/10 text-violet-500",
    available: false,
  },
  {
    id: "health",
    name: "Здоровье",
    description: "Медицина и wellness",
    icon: Heart,
    color: "bg-pink-500/10 text-pink-500",
    available: false,
  },
  {
    id: "travel",
    name: "Путешествия",
    description: "Туры и билеты",
    icon: Plane,
    color: "bg-cyan-500/10 text-cyan-500",
    available: false,
  },
  {
    id: "marketplace",
    name: "Маркетплейс",
    description: "Покупки онлайн",
    icon: ShoppingBag,
    color: "bg-amber-500/10 text-amber-500",
    available: false,
  },
  {
    id: "food",
    name: "Еда",
    description: "Доставка и рестораны",
    icon: UtensilsCrossed,
    color: "bg-red-500/10 text-red-500",
    available: false,
  },
  {
    id: "fitness",
    name: "Фитнес",
    description: "Спорт и тренировки",
    icon: Dumbbell,
    color: "bg-green-500/10 text-green-500",
    available: false,
  },
];

function ModuleCard({ module }: { module: Module }) {
  const Icon = module.icon;
  
  return (
    <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer relative">
      {!module.available && (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 text-[10px] px-2 py-0.5"
        >
          Скоро
        </Badge>
      )}
      <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{module.name}</h3>
      <p className="text-sm text-muted-foreground">{module.description}</p>
    </div>
  );
}

export function ModulesPage() {
  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Поиск модулей..."
          className="pl-10 h-12 rounded-xl bg-card border-border"
        />
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-4">Доступные модули</h2>
        <div className="grid grid-cols-2 gap-3">
          {availableModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Скоро появятся</h2>
        <div className="grid grid-cols-2 gap-3">
          {comingSoonModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
}
