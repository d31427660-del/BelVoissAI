import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-[36px] border border-[#e5e5ea] bg-[#f5f5f7] p-8 text-center space-y-4">
            <h1 className="text-xl font-bold tracking-tight">
              Произошла непредвиденная ошибка интерфейса
            </h1>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Пожалуйста, обновите страницу. Если проблема сохраняется, напишите в поддержку{' '}
              <a href="https://t.me/voxi_support" className="text-[#2563eb] underline font-medium">
                @voxi_support
              </a>.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
