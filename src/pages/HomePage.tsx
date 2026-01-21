import { useState } from "react";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { PullToRefresh } from "@/components/feed/PullToRefresh";
import { toast } from "sonner";

const initialPosts = [
  {
    author: {
      name: "Dubai Tech Hub",
      username: "dubaitech",
      avatar: "https://i.pravatar.cc/150?img=15",
      verified: true,
    },
    content:
      "Новые офисы в Dubai Internet City открыты для стартапов! Подавайте заявки до конца месяца. Резиденция включает визу, рабочее пространство и менторскую поддержку.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    likes: 2800,
    comments: 342,
    shares: 189,
    timeAgo: "2ч",
  },
  {
    author: {
      name: "Алиса Морозова",
      username: "alice_dev",
      avatar: "https://i.pravatar.cc/150?img=1",
      verified: false,
    },
    content:
      "Только что закончила новый проект на React + TypeScript 🚀 Делюсь опытом: всегда начинайте с планирования архитектуры!",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    likes: 856,
    comments: 94,
    shares: 45,
    timeAgo: "4ч",
  },
  {
    author: {
      name: "Crypto News",
      username: "cryptonews",
      avatar: "https://i.pravatar.cc/150?img=20",
      verified: true,
    },
    content:
      "Bitcoin преодолел отметку $100k! Аналитики прогнозируют дальнейший рост. Следите за нашими обновлениями.",
    likes: 5200,
    comments: 1200,
    shares: 890,
    timeAgo: "6ч",
  },
  {
    author: {
      name: "Максим Волков",
      username: "max_photo",
      avatar: "https://i.pravatar.cc/150?img=3",
      verified: false,
    },
    content:
      "Закат в горах Кавказа. Природа — лучший художник 🏔️ #photography #nature #mountains",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
    likes: 4521,
    comments: 287,
    shares: 156,
    timeAgo: "8ч",
  },
  {
    author: {
      name: "Figma Community",
      username: "figma.create",
      avatar: "https://i.pravatar.cc/150?img=25",
      verified: true,
    },
    content:
      "Новый UI Kit для мобильных приложений уже доступен! 50+ компонентов, тёмная и светлая темы. Скачивайте бесплатно 🎨",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
    likes: 3200,
    comments: 456,
    shares: 678,
    timeAgo: "10ч",
  },
  {
    author: {
      name: "Анна Петрова",
      username: "anna.food",
      avatar: "https://i.pravatar.cc/150?img=5",
      verified: false,
    },
    content:
      "Домашняя паста с трюфельным маслом 🍝 Рецепт в сторис! Готовится за 30 минут.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    likes: 1890,
    comments: 234,
    shares: 89,
    timeAgo: "12ч",
  },
  {
    author: {
      name: "TechCrunch RU",
      username: "techcrunch_ru",
      avatar: "https://i.pravatar.cc/150?img=30",
      verified: true,
    },
    content:
      "Apple представила новый MacBook Pro с чипом M4 Ultra. Производительность выросла на 40% по сравнению с предыдущим поколением.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
    likes: 6700,
    comments: 892,
    shares: 445,
    timeAgo: "14ч",
  },
  {
    author: {
      name: "Иван Сидоров",
      username: "ivan_travel",
      avatar: "https://i.pravatar.cc/150?img=8",
      verified: false,
    },
    content:
      "Бали — это не только пляжи! Рисовые террасы Убуда просто невероятны 🌴 Советую приезжать в сезон дождей — меньше туристов.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    likes: 2340,
    comments: 178,
    shares: 234,
    timeAgo: "16ч",
  },
  {
    author: {
      name: "Startup Daily",
      username: "startup_daily",
      avatar: "https://i.pravatar.cc/150?img=35",
      verified: true,
    },
    content:
      "Российский стартап привлёк $15M на развитие AI-ассистента для бизнеса. Инвесторы: Sequoia, Y Combinator.",
    likes: 1560,
    comments: 145,
    shares: 67,
    timeAgo: "18ч",
  },
  {
    author: {
      name: "Кира Новикова",
      username: "kira_fitness",
      avatar: "https://i.pravatar.cc/150?img=9",
      verified: false,
    },
    content:
      "Утренняя тренировка — лучший способ начать день! 💪 Сегодня кардио + силовая. Кто со мной?",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    likes: 987,
    comments: 112,
    shares: 34,
    timeAgo: "20ч",
  },
  {
    author: {
      name: "Дмитрий Кузнецов",
      username: "dmitry_cars",
      avatar: "https://i.pravatar.cc/150?img=12",
      verified: true,
    },
    content:
      "Тест-драйв нового Porsche Taycan Turbo S ⚡ 0-100 за 2.8 секунды. Будущее уже здесь!",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    likes: 4100,
    comments: 367,
    shares: 189,
    timeAgo: "22ч",
  },
  {
    author: {
      name: "Art Gallery",
      username: "art_gallery",
      avatar: "https://i.pravatar.cc/150?img=40",
      verified: true,
    },
    content:
      "Новая выставка современного искусства открылась в Москве. Работы 50 художников со всего мира 🎨",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    likes: 2890,
    comments: 234,
    shares: 156,
    timeAgo: "1д",
  },
];

export function HomePage() {
  const [posts, setPosts] = useState(initialPosts);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Shuffle posts to simulate new content
    setPosts(prev => [...prev].sort(() => Math.random() - 0.5));
    setRefreshKey(prev => prev + 1);
    
    toast.success("Лента обновлена!", {
      duration: 2000,
      position: "top-center",
    });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen" key={refreshKey}>
        <FeedHeader />
        <CreatePost />
        
        <div className="space-y-0">
          {posts.map((post, index) => (
            <PostCard key={`${post.author.username}-${index}`} {...post} />
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
