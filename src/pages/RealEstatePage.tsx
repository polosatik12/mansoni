import { useState } from "react";
import { Search, MapPin, BedDouble, Bath, Square, Star, Heart, Phone, MessageCircle, ChevronLeft, Building2, Home, Castle, Building, CheckCircle, X, Plus, ShoppingCart, Key, Landmark, TreePine, Store, Calendar, Calculator, Shield, BarChart3, FileCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RealEstateFilters } from "@/components/realestate/RealEstateFilters";

// Main categories like Cian
const mainCategories = [
  { id: "buy", label: "Купить", icon: ShoppingCart },
  { id: "rent", label: "Снять", icon: Key },
  { id: "new", label: "Новостройки", icon: Landmark },
  { id: "houses", label: "Дома, участки", icon: TreePine },
  { id: "commercial", label: "Коммерческая", icon: Store },
  { id: "daily", label: "Посуточно", icon: Calendar },
];

// Services horizontal scroll
const services = [
  { id: "newbuilding", label: "Подбор новостройки", icon: Building2 },
  { id: "check", label: "Проверка жилья", icon: FileCheck },
  { id: "mortgage", label: "Ипотечный калькулятор", icon: Calculator },
  { id: "analytics", label: "Аналитика бизнесу", icon: BarChart3 },
  { id: "insurance", label: "Страхование", icon: Shield },
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

const roomOptions = [
  { id: "studio", label: "Студия" },
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4+", label: "4+" },
];

export function RealEstatePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [areaRange, setAreaRange] = useState([0, 500]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("Москва");
  const [filterOptions, setFilterOptions] = useState({
    verified: false,
    withPhoto: true,
    fromOwner: false,
    newBuilding: false,
    withBalcony: false,
    withParking: false,
    withFurniture: false,
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev =>
      prev.includes(roomId) ? prev.filter(r => r !== roomId) : [...prev, roomId]
    );
  };

  const resetFilters = () => {
    setPriceRange([0, 100]);
    setAreaRange([0, 500]);
    setSelectedRooms([]);
    setFilterOptions({
      verified: false,
      withPhoto: true,
      fromOwner: false,
      newBuilding: false,
      withBalcony: false,
      withParking: false,
      withFurniture: false,
    });
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setFilterCategory(catId);
    setShowFilters(true);
  };

  const getCategoryTitle = () => {
    const cat = mainCategories.find(c => c.id === filterCategory);
    return cat ? cat.label : "Фильтры";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Avito-style Filters Header */}
      <RealEstateFilters 
        onShowResults={() => {}} 
        resultsCount={allProperties.length * 350}
      />

      {/* Post Ad Button */}
      <div className="px-4 pb-4">
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-2xl border-2 border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10"
        >
          <Plus className="w-5 h-5 mr-2" />
          Разместить за 0 ₽
        </Button>
      </div>

      {/* Services Scroll */}
      <div className="pb-6">
        <ScrollArea className="w-full">
          <div className="flex gap-3 px-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  className="flex-shrink-0 flex flex-col items-center w-20 p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-2 shadow-sm">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-[11px] text-center text-foreground font-medium leading-tight">
                    {service.label}
                  </span>
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

      {/* Filters Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0" hideCloseButton>
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-4 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
                <SheetTitle className="text-lg font-semibold">{getCategoryTitle()}</SheetTitle>
                <button 
                  onClick={resetFilters}
                  className="text-primary text-sm font-medium"
                >
                  Сбросить
                </button>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* City Selection */}
              <div>
                <h3 className="font-semibold mb-3">Город</h3>
                <div className="flex gap-2 flex-wrap">
                  {["Москва", "Санкт-Петербург", "Дубай", "Сочи"].map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                        selectedCity === city
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms - show for buy/rent/daily */}
              {(filterCategory === "buy" || filterCategory === "rent" || filterCategory === "daily") && (
                <div>
                  <h3 className="font-semibold mb-3">Комнаты</h3>
                  <div className="flex gap-2">
                    {roomOptions.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => toggleRoom(room.id)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                          selectedRooms.includes(room.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {room.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3">
                  {filterCategory === "rent" || filterCategory === "daily" ? "Цена, ₽/мес" : "Цена, млн ₽"}
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <Input 
                      type="number" 
                      placeholder="От" 
                      value={priceRange[0] || ''} 
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <span className="text-muted-foreground">—</span>
                  <div className="flex-1">
                    <Input 
                      type="number" 
                      placeholder="До" 
                      value={priceRange[1] || ''} 
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={filterCategory === "rent" ? 500 : 300}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Area Range */}
              <div>
                <h3 className="font-semibold mb-3">Площадь, м²</h3>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <Input 
                      type="number" 
                      placeholder="От" 
                      value={areaRange[0] || ''} 
                      onChange={(e) => setAreaRange([Number(e.target.value), areaRange[1]])}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <span className="text-muted-foreground">—</span>
                  <div className="flex-1">
                    <Input 
                      type="number" 
                      placeholder="До" 
                      value={areaRange[1] || ''} 
                      onChange={(e) => setAreaRange([areaRange[0], Number(e.target.value)])}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <Slider
                  value={areaRange}
                  onValueChange={setAreaRange}
                  max={filterCategory === "houses" ? 2000 : 500}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Floor - for apartments */}
              {(filterCategory === "buy" || filterCategory === "rent" || filterCategory === "new") && (
                <div>
                  <h3 className="font-semibold mb-3">Этаж</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input 
                        type="number" 
                        placeholder="От" 
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div>
                      <Input 
                        type="number" 
                        placeholder="До" 
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-4 py-2 rounded-xl bg-muted text-sm font-medium">
                      Не первый
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-muted text-sm font-medium">
                      Не последний
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Options */}
              <div>
                <h3 className="font-semibold mb-3">Дополнительно</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                    <Checkbox 
                      checked={filterOptions.withPhoto}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, withPhoto: !!checked }))
                      }
                    />
                    <span className="font-medium text-sm">С фото</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                    <Checkbox 
                      checked={filterOptions.verified}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, verified: !!checked }))
                      }
                    />
                    <span className="font-medium text-sm">Проверенные объявления</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                    <Checkbox 
                      checked={filterOptions.fromOwner}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, fromOwner: !!checked }))
                      }
                    />
                    <span className="font-medium text-sm">От собственника</span>
                  </label>

                  {(filterCategory === "rent" || filterCategory === "daily") && (
                    <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                      <Checkbox 
                        checked={filterOptions.withFurniture}
                        onCheckedChange={(checked) => 
                          setFilterOptions(prev => ({ ...prev, withFurniture: !!checked }))
                        }
                      />
                      <span className="font-medium text-sm">С мебелью</span>
                    </label>
                  )}

                  <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                    <Checkbox 
                      checked={filterOptions.withBalcony}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, withBalcony: !!checked }))
                      }
                    />
                    <span className="font-medium text-sm">С балконом/лоджией</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                    <Checkbox 
                      checked={filterOptions.withParking}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, withParking: !!checked }))
                      }
                    />
                    <span className="font-medium text-sm">С парковкой</span>
                  </label>

                  {filterCategory === "new" && (
                    <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                      <Checkbox 
                        checked={filterOptions.newBuilding}
                        onCheckedChange={(checked) => 
                          setFilterOptions(prev => ({ ...prev, newBuilding: !!checked }))
                        }
                      />
                      <span className="font-medium text-sm">Сдача в этом году</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border bg-background">
              <Button 
                className="w-full h-12 rounded-xl"
                onClick={() => setShowFilters(false)}
              >
                Показать {allProperties.length} объектов
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}