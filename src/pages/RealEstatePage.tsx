import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, BedDouble, Bath, Square, Star, Heart, Phone, MessageCircle, ChevronLeft, Building2, Home, Castle, Building, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

type DealType = "buy" | "rent";

const propertyTypes = [
  { id: "all", label: "Все", icon: Building2 },
  { id: "apartment", label: "Квартиры", icon: Building },
  { id: "house", label: "Дома", icon: Home },
  { id: "villa", label: "Виллы", icon: Castle },
];

const featuredProperties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    type: "Продажа",
    verified: true,
    location: "Москва",
    address: "Пресненская наб., 12",
    title: "Современные апартаменты в Москва-Сити",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    price: "45.0 млн ₽",
    rating: 4.9,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    type: "Продажа",
    verified: true,
    location: "Дубай",
    address: "Downtown Dubai",
    title: "Пентхаус с видом на Бурдж-Халифа",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    price: "85.0 млн ₽",
    rating: 5.0,
    reviews: 18,
  },
];

const allProperties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    type: "Продажа",
    location: "Москва",
    address: "Пресненская наб., 12",
    title: "Современные апартаменты в Москва-Сити",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    price: "45.0 млн ₽",
    rating: 4.9,
    reviews: 24,
    agent: {
      name: "Александр Петров",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    type: "Продажа",
    location: "Дубай",
    address: "Downtown Dubai",
    title: "Пентхаус с видом на Бурдж-Халифа",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    price: "85.0 млн ₽",
    rating: 5.0,
    reviews: 18,
    agent: {
      name: "Мария Иванова",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    type: "Продажа",
    location: "Дубай",
    address: "Palm Jumeirah",
    title: "Вилла на Palm Jumeirah",
    bedrooms: 6,
    bathrooms: 7,
    area: 850,
    price: "250.0 млн ₽",
    rating: 5.0,
    reviews: 8,
    agent: {
      name: "Елена Смирнова",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
  },
];

export function RealEstatePage() {
  const navigate = useNavigate();
  const [dealType, setDealType] = useState<DealType>("buy");
  const [selectedType, setSelectedType] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate("/modules")}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Недвижимость</h1>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          Найдите идеальную<br />недвижимость
        </h2>
        <p className="text-center text-primary-foreground/80 mb-6">
          Москва, Дубай и другие города мира
        </p>

        {/* Deal Type Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            onClick={() => setDealType("buy")}
            className={cn(
              "rounded-full px-6",
              dealType === "buy"
                ? "bg-white text-primary hover:bg-white/90"
                : "bg-white/20 text-white hover:bg-white/30"
            )}
          >
            Купить
          </Button>
          <Button
            onClick={() => setDealType("rent")}
            className={cn(
              "rounded-full px-6",
              dealType === "rent"
                ? "bg-white text-primary hover:bg-white/90"
                : "bg-white/20 text-white hover:bg-white/30"
            )}
          >
            Арендовать
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Город, район или адрес..."
              className="pl-10 h-12 rounded-xl bg-white border-0 text-foreground"
            />
          </div>
          <Button size="icon" className="h-12 w-12 rounded-xl bg-white text-primary hover:bg-white/90">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Property Type Filter */}
      <div className="px-4 py-4">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {propertyTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full flex-shrink-0 transition-all",
                    selectedType === type.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{type.label}</span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Featured Properties */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Рекомендуемые</h3>
          <button className="text-primary text-sm font-medium">Все</button>
        </div>
        <ScrollArea className="w-full">
          <div className="flex gap-4">
            {featuredProperties.map((property) => (
              <div key={property.id} className="flex-shrink-0 w-[260px] cursor-pointer" onClick={() => navigate(`/realestate/${property.id}`)}>
                <div className="relative rounded-2xl overflow-hidden mb-3">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      {property.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleFavorite(property.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center"
                  >
                    <Heart className={cn("w-4 h-4", favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                  </button>
                  {property.verified && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      <span>Проверено</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{property.location}</span>
                </div>
                <h4 className="font-semibold text-sm mb-2 line-clamp-2">{property.title}</h4>
                <div className="flex items-center gap-3 text-muted-foreground text-xs mb-2">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5" />
                    {property.bedrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5" />
                    {property.bathrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="w-3.5 h-3.5" />
                    {property.area} м²
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{property.price}</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {property.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* All Properties */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{allProperties.length} объектов</h3>
          <button className="text-muted-foreground text-sm flex items-center gap-1">
            По популярности
            <ChevronLeft className="w-4 h-4 -rotate-90" />
          </button>
        </div>
        <div className="space-y-4">
          {allProperties.map((property) => (
            <div key={property.id} className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer" onClick={() => navigate(`/realestate/${property.id}`)}>
              <div className="relative">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    {property.type}
                  </span>
                </div>
                <button 
                  onClick={() => toggleFavorite(property.id)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Heart className={cn("w-5 h-5", favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1 text-primary text-sm mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{property.address}, {property.location}</span>
                </div>
                <h4 className="font-semibold mb-2">{property.title}</h4>
                <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {property.bedrooms} спальни
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="w-4 h-4" />
                    {property.area} м²
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg">{property.price}</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {property.rating} ({property.reviews})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={property.agent.avatar}
                      alt={property.agent.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm">{property.agent.name}</p>
                      <p className="text-xs text-muted-foreground">Агент</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="icon" className="rounded-full w-10 h-10">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}