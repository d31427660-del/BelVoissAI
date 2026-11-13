/**
 * CSRF-защита: ко всем изменяющим запросам (не GET/HEAD) к собственному /api/* автоматически
 * добавляется заголовок X-Requested-With. Сервер (voxi_csrf_guard в api/bootstrap.php) отклоняет
 * такие запросы без заголовка и с чужим Origin. Кросс-сайтовая страница не может выставить этот
 * заголовок без CORS-preflight, который сервер не разрешает.
 */
export function installCsrfHeader(): void {
  if (typeof window === 'undefined' || (window as any).__voxiCsrfInstalled) return;
  (window as any).__voxiCsrfInstalled = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(rawUrl, window.location.origin);
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (url.origin === window.location.origin && url.pathname.startsWith('/api/') && method !== 'GET' && method !== 'HEAD') {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('X-Requested-With', 'XMLHttpRequest');
        return nativeFetch(input, { ...init, headers });
      }
    } catch {
      // fall through to the native call
    }
    return nativeFetch(input, init);
  };
}
