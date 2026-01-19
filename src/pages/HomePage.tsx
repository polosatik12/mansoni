import { FeedTabs } from "@/components/feed/FeedTabs";
import { Stories } from "@/components/feed/Stories";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";

const posts = [
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
];

export function HomePage() {
  return (
    <div className="min-h-screen">
      <FeedTabs />
      <Stories />
      <CreatePost />
      
      <div className="space-y-0">
        {posts.map((post, index) => (
          <PostCard key={index} {...post} />
        ))}
      </div>
    </div>
  );
}
