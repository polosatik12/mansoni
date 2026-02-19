import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.message.includes("Importing a module script failed") ||
    error.name === "ChunkLoadError"
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const chunkError = isChunkLoadError(error);
    if (chunkError) {
      // Auto-reload once on chunk errors (stale cache after redeploy)
      const reloaded = sessionStorage.getItem("chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("chunk_reload", "1");
        window.location.reload();
      }
    }
    return { hasError: true, isChunkError: chunkError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 text-white/60 text-sm">
            <p>Обновляем приложение...</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        );
      }
      return (
        this.props.fallback ?? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Произошла ошибка при отображении
          </div>
        )
      );
    }
    return this.props.children;
  }
}

