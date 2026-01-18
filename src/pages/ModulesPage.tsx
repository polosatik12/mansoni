import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
interface Module {
  id: string;
  name: string;
  description: string;
  image: string;
  available: boolean;
  gradient: string;
}

const modules: Module[] = [
  {
    id: "taxi",
    name: "Такси",
    description: "Быстрые поездки по городу",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80",
    available: true,
    gradient: "from-yellow-500/30 to-orange-600/40",
  },
  {
    id: "carsharing",
    name: "Каршеринг",
    description: "Аренда авто поминутно",
    image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80",
    available: true,
    gradient: "from-blue-500/30 to-cyan-600/40",
  },
  {
    id: "delivery",
    name: "Доставка",
    description: "Еда, продукты, курьеры",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&q=80",
    available: true,
    gradient: "from-green-500/30 to-emerald-600/40",
  },
  {
    id: "marketplace",
    name: "Маркетплейс",
    description: "Товары и услуги",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
    available: true,
    gradient: "from-purple-500/30 to-violet-600/40",
  },
  {
    id: "realestate",
    name: "Недвижимость",
    description: "Аренда и продажа",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    available: true,
    gradient: "from-slate-600/30 to-zinc-700/40",
  },
  {
    id: "insurance",
    name: "Страхование",
    description: "Защита имущества и жизни",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80",
    available: true,
    gradient: "from-teal-500/30 to-cyan-600/40",
  },
  {
    id: "jobs",
    name: "Работа",
    description: "Вакансии и резюме",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80",
    available: false,
    gradient: "from-indigo-500/30 to-blue-600/40",
  },
  {
    id: "banking",
    name: "Банк",
    description: "Финансовые услуги",
    image: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400&q=80",
    available: false,
    gradient: "from-emerald-500/30 to-green-600/40",
  },
  {
    id: "investments",
    name: "Инвестиции",
    description: "Акции и портфели",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
    available: false,
    gradient: "from-amber-500/30 to-yellow-600/40",
  },
  {
    id: "auto",
    name: "Автопродажи",
    description: "Купля-продажа авто",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80",
    available: false,
    gradient: "from-red-500/30 to-rose-600/40",
  },
  {
    id: "travel",
    name: "Путешествия",
    description: "Авиа, ж/д, автобусы",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
    available: false,
    gradient: "from-sky-500/30 to-blue-600/40",
  },
  {
    id: "hotels",
    name: "Отели",
    description: "Бронирование номеров",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    available: false,
    gradient: "from-orange-500/30 to-amber-600/40",
  },
  {
    id: "entertainment",
    name: "Развлечения",
    description: "Кино, театр, концерты",
    image: "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=400&q=80",
    available: false,
    gradient: "from-pink-500/30 to-rose-600/40",
  },
  {
    id: "sport",
    name: "Спорт",
    description: "Залы, секции, билеты",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
    available: false,
    gradient: "from-lime-500/30 to-green-600/40",
  },
  {
    id: "education",
    name: "Образование",
    description: "Курсы и репетиторы",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    available: false,
    gradient: "from-violet-500/30 to-purple-600/40",
  },
  {
    id: "music",
    name: "Музыка",
    description: "Стриминг и треки",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
    available: false,
    gradient: "from-fuchsia-500/30 to-pink-600/40",
  },
];

function ModuleCard({ module, onClick }: { module: Module; onClick?: () => void }) {
  return (
    <div 
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3]">
        {/* Background Image */}
        <img
          src={module.image}
          alt={module.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Dark overlay for text readability - only at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Coming Soon Badge */}
        {!module.available && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[11px] font-medium rounded-full">
              Скоро
            </span>
          </div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-base mb-0.5">
            {module.name}
          </h3>
          <p className="text-white/80 text-xs">
            {module.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ModulesPage() {
  const navigate = useNavigate();
  const availableModules = modules.filter((m) => m.available);
  const comingSoonModules = modules.filter((m) => !m.available);

  const handleModuleClick = (moduleId: string) => {
    if (moduleId === "realestate") {
      navigate("/realestate");
    } else if (moduleId === "insurance") {
      navigate("/insurance");
    }
    // Add more module routes here as they're implemented
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Поиск сервисов..."
          className="pl-10 h-12 rounded-2xl bg-card border-border"
        />
      </div>

      {/* Available Modules */}
      <div className="grid grid-cols-2 gap-3">
        {availableModules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            onClick={() => handleModuleClick(module.id)}
          />
        ))}
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 text-lg">Скоро появятся</h2>
        <div className="grid grid-cols-2 gap-3">
          {comingSoonModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
}
