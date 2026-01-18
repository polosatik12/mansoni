import { Button } from "@/components/ui/button";

export function CreatePost() {
  return (
    <div className="mx-4 mb-4 p-3 bg-card rounded-2xl border border-border shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <img
          src="https://i.pravatar.cc/150?img=32"
          alt="Your avatar"
          className="w-9 h-9 rounded-full object-cover"
        />
      </div>
      <input
        type="text"
        placeholder="Что нового?"
        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
      />
      <Button size="sm" className="rounded-full px-5 font-semibold">
        Создать
      </Button>
    </div>
  );
}
