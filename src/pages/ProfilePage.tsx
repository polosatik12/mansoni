import { Settings, Edit3, Grid3X3, Bookmark, Heart, MoreHorizontal, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const userPosts = [
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80",
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80",
];

export function ProfilePage() {
  return (
    <div className="min-h-screen">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2 p-4">
        <Button variant="ghost" size="icon">
          <Edit3 className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-6">
        <div className="flex items-start gap-4 mb-4">
          <img
            src="https://i.pravatar.cc/150?img=32"
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground mb-1">Иван Петров</h1>
            <p className="text-muted-foreground mb-2">@ivan_petrov</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Link2 className="w-3 h-3" />
                mywebsite.com
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-foreground mb-4">
          Full-stack разработчик 💻 | React, TypeScript | Dubai 🇦🇪
          Делюсь знаниями и опытом в IT
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <p className="font-bold text-foreground">128</p>
            <p className="text-sm text-muted-foreground">Постов</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">12.5K</p>
            <p className="text-sm text-muted-foreground">Подписчиков</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">892</p>
            <p className="text-sm text-muted-foreground">Подписок</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 rounded-xl">Редактировать</Button>
          <Button variant="outline" className="flex-1 rounded-xl">
            Поделиться
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start px-4 h-12 bg-transparent border-b border-border rounded-none">
          <TabsTrigger
            value="posts"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Grid3X3 className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Bookmark className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Heart className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <div className="grid grid-cols-3 gap-0.5">
            {userPosts.map((post, i) => (
              <div key={i} className="aspect-square">
                <img
                  src={post}
                  alt={`Post ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="p-8 text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Сохранённые посты</p>
        </TabsContent>

        <TabsContent value="liked" className="p-8 text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Понравившиеся посты</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
