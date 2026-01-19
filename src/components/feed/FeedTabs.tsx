import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "foryou", label: "Рекомендации" },
  { id: "following", label: "Подписки" },
];

export function FeedTabs() {
  const [activeTab, setActiveTab] = useState("foryou");

  return (
    <div className="flex items-center justify-center px-4 py-3">
      <div className="flex bg-muted rounded-full p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
