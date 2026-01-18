import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Shield, 
  Calculator, 
  FileText, 
  Clock, 
  Headphones,
  Car,
  Heart,
  Home,
  Plane,
  Star,
  Check,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "Все", icon: Shield },
  { id: "osago", label: "ОСАГО/КАСКО", icon: Car },
  { id: "health", label: "Здоровье", icon: Heart },
  { id: "property", label: "Имущество", icon: Home },
  { id: "travel", label: "Путешествия", icon: Plane },
];

const features = [
  { icon: Calculator, title: "Онлайн расчёт", description: "Узнайте стоимость за 2 минуты" },
  { icon: FileText, title: "Электронный полис", description: "Получите на email мгновенно" },
  { icon: Clock, title: "Быстрые выплаты", description: "Деньги за 3-5 рабочих дней" },
  { icon: Headphones, title: "Поддержка 24/7", description: "Консультация в чате" },
];

interface InsuranceProduct {
  id: string;
  name: string;
  company: string;
  companyLogo: string;
  description: string;
  features: string[];
  rating: number;
  reviews: number;
  coverage: string;
  priceFrom: string;
  category: string;
  badge?: string;
  verified?: boolean;
  popular?: boolean;
}

const products: InsuranceProduct[] = [
  {
    id: "1",
    name: "ОСАГО Премиум",
    company: "АльфаСтрахование",
    companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&q=80",
    description: "Обязательное страхование автогражданской ответственности с расширенным покрытием",
    features: ["Выплата за 3 дня", "Европротокол", "Аварийный комиссар", "Эвакуатор бесплатно"],
    rating: 4.8,
    reviews: 1250,
    coverage: "500 000 ₽",
    priceFrom: "8 500 ₽/год",
    category: "osago",
    badge: "Хит",
    verified: true,
    popular: true,
  },
  {
    id: "2",
    name: "КАСКО Полное",
    company: "Ингосстрах",
    companyLogo: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=100&q=80",
    description: "Полная защита вашего автомобиля от всех рисков",
    features: ["Угон и ущерб", "Без справок до 50 000 ₽", "Ремонт у дилера", "Подменный авто"],
    rating: 4.9,
    reviews: 890,
    coverage: "3 000 000 ₽",
    priceFrom: "45 000 ₽/год",
    category: "osago",
    verified: true,
    popular: true,
  },
  {
    id: "3",
    name: "ДМС Комфорт",
    company: "СОГАЗ",
    companyLogo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&q=80",
    description: "Добровольное медицинское страхование для всей семьи",
    features: ["1000+ клиник", "Стоматология", "Телемедицина 24/7", "Госпитализация"],
    rating: 4.7,
    reviews: 2100,
    coverage: "2 000 000 ₽",
    priceFrom: "35 000 ₽/год",
    category: "health",
    verified: true,
    popular: true,
  },
  {
    id: "4",
    name: "Защита квартиры",
    company: "Ренессанс Страхование",
    companyLogo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&q=80",
    description: "Страхование квартиры и имущества от всех рисков",
    features: ["Залив соседей", "Пожар и взрыв", "Кража", "Гражданская ответственность"],
    rating: 4.6,
    reviews: 567,
    coverage: "5 000 000 ₽",
    priceFrom: "3 500 ₽/год",
    category: "property",
    verified: true,
  },
  {
    id: "5",
    name: "Туристическая страховка",
    company: "ВСК",
    companyLogo: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&q=80",
    description: "Защита путешественников по всему миру",
    features: ["Медицинские расходы", "Потеря багажа", "Отмена поездки", "Спортивные риски"],
    rating: 4.5,
    reviews: 1890,
    coverage: "100 000 $",
    priceFrom: "1 200 ₽/поездка",
    category: "travel",
    verified: true,
  },
  {
    id: "6",
    name: "Страхование жизни",
    company: "Сбербанк Страхование",
    companyLogo: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=100&q=80",
    description: "Накопительное страхование жизни с инвестиционным доходом",
    features: ["Защита жизни", "Накопления", "Инвестиционный доход", "Налоговый вычет"],
    rating: 4.4,
    reviews: 780,
    coverage: "10 000 000 ₽",
    priceFrom: "5 000 ₽/мес",
    category: "health",
    verified: true,
  },
];

function ProductCard({ product }: { product: InsuranceProduct }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={product.companyLogo}
          alt={product.company}
          className="w-12 h-12 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
            {product.popular && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[11px] font-medium rounded-full flex-shrink-0">
                Популярное
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{product.company}</p>
          {product.verified && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" />
              Проверено
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {product.description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-2 mb-3">
        {product.features.slice(0, 4).map((feature, idx) => (
          <span key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3 text-primary" />
            {feature}
          </span>
        ))}
      </div>

      {/* Rating & Coverage */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{product.rating}</span>
          <span className="text-muted-foreground">({product.reviews})</span>
        </div>
        <span className="text-muted-foreground">Покрытие до {product.coverage}</span>
      </div>

      {/* Price & Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg font-bold text-foreground whitespace-nowrap">от {product.priceFrom}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl flex-1">
            <Calculator className="w-4 h-4 mr-1" />
            Рассчитать
          </Button>
          <Button size="sm" className="rounded-xl bg-primary flex-1">
            <MessageCircle className="w-4 h-4 mr-1" />
            Консультация
          </Button>
        </div>
      </div>
    </div>
  );
}

function PopularProductCard({ product }: { product: InsuranceProduct }) {
  return (
    <div className="flex-shrink-0 w-[280px] bg-card rounded-2xl p-4 border border-border">
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <img
          src={product.companyLogo}
          alt={product.company}
          className="w-10 h-10 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{product.company}</span>
            {product.badge && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded-full">
                {product.badge}
              </span>
            )}
          </div>
          {product.verified && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Проверено
            </p>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {product.description}
      </p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {product.features.slice(0, 2).map((feature, idx) => (
          <span key={idx} className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3 text-primary" />
            {feature}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-foreground">от {product.priceFrom}</span>
        <Button size="sm" className="rounded-xl bg-primary h-8 text-xs">
          Оформить
        </Button>
      </div>
    </div>
  );
}

export function InsurancePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const popularProducts = products.filter(p => p.popular);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/modules")}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-semibold">Страхование</span>
          <div className="w-6" />
        </div>
      </div>

      {/* Hero - Apple style minimal */}
      <div className="px-6 pt-10 pb-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/25">
          <Shield className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-2">
          Страхование
        </h1>
        <p className="text-base text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
          Оформите полис за пару минут — без визита в офис
        </p>
      </div>

      {/* Features - clean horizontal scroll */}
      <div className="px-4 pb-6">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-1">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="flex-shrink-0 w-[140px] bg-muted/50 rounded-2xl p-4 hover:bg-muted/80 transition-colors"
              >
                <feature.icon className="w-6 h-6 text-foreground mb-3" strokeWidth={1.5} />
                <h3 className="font-medium text-foreground text-[13px] leading-tight mb-1">
                  {feature.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Categories */}
      <div className="px-4 py-3">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full flex-shrink-0",
                  activeCategory === cat.id && "bg-primary"
                )}
                onClick={() => setActiveCategory(cat.id)}
              >
                <cat.icon className="w-4 h-4 mr-1.5" />
                {cat.label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Popular Products */}
      <div className="py-4">
        <h2 className="font-semibold text-lg px-4 mb-3">Популярные продукты</h2>
        <ScrollArea className="w-full">
          <div className="flex gap-3 px-4">
            {popularProducts.map((product) => (
              <PopularProductCard key={product.id} product={product} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* All Products */}
      <div className="px-4 py-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Все продукты</h2>
          <span className="text-sm text-muted-foreground">{filteredProducts.length} предложений</span>
        </div>
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
