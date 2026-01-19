import { ServicesMenu } from "./ServicesMenu";

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
}

export function AppHeader({ title, showLogo = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <ServicesMenu />
          {showLogo && (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
          )}
          {title && <h1 className="font-semibold text-lg">{title}</h1>}
        </div>
      </div>
    </header>
  );
}
