import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Heart, Share2, ChevronLeft, ChevronRight, MapPin, Phone, MessageCircle, Train, Clock, Eye, CheckCircle, Percent, Copy, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PropertyMap } from "@/components/maps/PropertyMap";

const propertyData = {
  id: "1",
  title: "Продаётся Студия, 21,3 м²",
  complex: "River Park Кутузовский",
  address: "Москва, ЗАО, Дорогомилово, Кутузовский проезд, 16А/1",
  price: "28 373 089 ₽",
  pricePerMeter: "1 332 070 ₽/м²",
  mortgageFrom: "172 643 ₽/мес",
  area: 21.3,
  kitchen: 3.1,
  floor: 2,
  totalFloors: 46,
  ceiling: 3.6,
  finish: "White Box",
  view: "Москва-Сити, Москва-река",
  images: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  ],
  metro: [
    { name: "Фили", time: 11, color: "bg-blue-500" },
    { name: "Кутузовская", time: 18, color: "bg-blue-500" },
    { name: "Кутузовская", time: 18, color: "bg-yellow-500", type: "МЦД" },
  ],
  transportRating: 7.4,
  infrastructureRating: 6.2,
  developer: {
    name: "Аеон-Девелопмент",
    logo: "https://i.pravatar.cc/80?img=65",
    online: true,
  },
  views: 9261,
  viewsToday: 17,
  updatedAt: "29 дек в 17:33",
  badges: ["Только на Циан", "Онлайн-бронирование", "От застройщика"],
  promos: ["Рассрочка 0%", "Материнский капитал"],
  coordinates: { lat: 55.7459, lng: 37.5298 }, // Москва-Сити coordinates
};

export function PropertyDetailPage() {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % propertyData.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + propertyData.images.length) % propertyData.images.length);
  };

  // Gallery View
  if (showGallery) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 safe-area-top">
          <span className="text-white text-lg font-medium">
            {currentImage + 1}/{propertyData.images.length}
          </span>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsFavorite(!isFavorite)}>
              <Heart className={cn("w-6 h-6", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
            </button>
            <button onClick={() => setShowGallery(false)}>
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center relative">
          <img
            src={propertyData.images[currentImage]}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={prevImage}
            className="absolute left-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Bottom */}
        <div className="px-4 py-4 safe-area-bottom">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{propertyData.price}</p>
              <p className="text-white/70 text-sm">{propertyData.title}</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6">
              <Phone className="w-4 h-4 mr-2" />
              Позвонить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          <button onClick={() => navigate("/realestate")}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-medium text-sm truncate max-w-[200px]">{propertyData.title}</span>
          <div className="flex items-center gap-3">
            <button>
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => setIsFavorite(!isFavorite)}>
              <Heart className={cn("w-5 h-5", isFavorite ? "fill-red-500 text-red-500" : "")} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative" onClick={() => setShowGallery(true)}>
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={propertyData.images[currentImage]}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {propertyData.images.slice(0, 5).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentImage ? "bg-white w-4" : "bg-white/50"
              )}
            />
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); prevImage(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextImage(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Badges */}
      <div className="px-4 py-3">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {propertyData.badges.map((badge, idx) => (
              <span
                key={idx}
                className="flex-shrink-0 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20"
              >
                {badge}
              </span>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Price */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
          <CheckCircle className="w-4 h-4" />
          <span>Цена от застройщика</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{propertyData.price}</h2>
            <p className="text-muted-foreground text-sm">{propertyData.pricePerMeter}</p>
          </div>
          <button onClick={() => setIsFavorite(!isFavorite)}>
            <Heart className={cn("w-7 h-7", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
        </div>
      </div>

      {/* Specs */}
      <div className="px-4 py-4 border-b border-border">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xl font-bold">{propertyData.area} м²</p>
            <p className="text-sm text-muted-foreground">общая пл.</p>
          </div>
          <div>
            <p className="text-xl font-bold">{propertyData.kitchen} м²</p>
            <p className="text-sm text-muted-foreground">кухня</p>
          </div>
          <div>
            <p className="text-xl font-bold">{propertyData.floor} из {propertyData.totalFloors}</p>
            <p className="text-sm text-muted-foreground">этаж</p>
          </div>
        </div>
      </div>

      {/* Mortgage */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Percent className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">В ипотеку от {propertyData.mortgageFrom}</p>
            <p className="text-sm text-primary">Рассчитать ипотеку</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Complex Info */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-primary font-semibold text-lg mb-2">ЖК «{propertyData.complex}»</h3>
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm">{propertyData.address}</p>
          <button className="ml-auto">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Metro */}
        <div className="space-y-2 mb-4">
          {propertyData.metro.map((m, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded-full", m.color)} />
              <span className="text-sm">{m.name}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                {m.time} мин.
              </span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="relative rounded-xl overflow-hidden mb-3 h-40">
          <PropertyMap 
            lat={propertyData.coordinates.lat} 
            lng={propertyData.coordinates.lng}
            address={propertyData.complex}
          />
        </div>
        <Button 
          variant="outline" 
          className="w-full rounded-xl"
          onClick={() => window.open(`https://yandex.ru/maps/?pt=${propertyData.coordinates.lng},${propertyData.coordinates.lat}&z=16&l=map`, '_blank')}
        >
          Построить маршрут
        </Button>
      </div>

      {/* Developer */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="font-semibold mb-4">Позвоните застройщику</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={propertyData.developer.logo}
              alt=""
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <p className="font-medium text-primary">{propertyData.developer.name}</p>
              <p className="text-sm text-muted-foreground">Застройщик</p>
            </div>
          </div>
          <Button size="icon" className="rounded-full w-12 h-12">
            <Phone className="w-5 h-5" />
          </Button>
        </div>
        {propertyData.developer.online && (
          <p className="text-sm text-muted-foreground mt-3">
            Свяжитесь, пока он онлайн <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" />
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-sm text-muted-foreground">
          Обновлено: {propertyData.updatedAt}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {propertyData.views} просмотр, {propertyData.viewsToday} за сегодня
        </p>
      </div>

      {/* Ratings */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="font-semibold text-lg mb-4">Рейтинг транспортной доступности</h3>
        <p className="text-sm text-muted-foreground mb-4">По данным Департамента транспорта Москвы</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Транспортная доступность</p>
              <p className="font-bold">{propertyData.transportRating} из 10</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Инфраструктура от застройщика</p>
              <p className="font-bold">{propertyData.infrastructureRating} из 10</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Promos */}
      <div className="px-4 py-4">
        <h3 className="font-semibold text-lg mb-4">Акции в ЖК «{propertyData.complex}»</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-3">
            {propertyData.promos.map((promo, idx) => (
              <div key={idx} className="flex-shrink-0 p-4 bg-muted rounded-xl min-w-[160px]">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="font-medium text-sm">{promo}</p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 safe-area-bottom z-50">
        <div className="flex gap-3">
          <Button className="flex-1 h-12 rounded-xl bg-primary">
            <Phone className="w-5 h-5 mr-2" />
            Позвонить застройщику
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
        <Button variant="ghost" className="w-full mt-2 h-10">
          Заявка на бронирование
        </Button>
      </div>
    </div>
  );
}