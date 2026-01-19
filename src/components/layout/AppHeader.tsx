import { ServicesMenu } from "./ServicesMenu";

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
}

export function AppHeader({ title, showLogo = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-center h-12 px-4 max-w-lg mx-auto">
        <ServicesMenu />
      </div>
    </header>
  );
}
