import { ChevronDown } from "lucide-react";

interface AccountSwitcherProps {
  currentUsername: string;
}

export function AccountSwitcher({ currentUsername }: AccountSwitcherProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-semibold text-lg">{currentUsername}</span>
      <ChevronDown className="w-4 h-4 text-primary" />
    </div>
  );
}

