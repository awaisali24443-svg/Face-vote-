// ============================================================
// Device Mode switch + API interceptor.
//
// In Device Mode (the default for the expo demo), every /api/*
// call is answered on this device by the local backend — no
// server, no internet. In Server Mode, calls go to the real
// backend exactly as before.
// ============================================================

import { handleLocalApi } from './localBackend';

export type AppMode = 'device' | 'server';

const MODE_KEY = 'facevote_app_mode';

export function getAppMode(): AppMode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'server' ? 'server' : 'device';
  } catch {
    return 'device';
  }
}

export function setAppMode(mode: AppMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {}
}

export function isDeviceMode(): boolean {
  return getAppMode() === 'device';
}

let installed = false;

export function installLocalApiInterceptor(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (getAppMode() === 'device') {
      try {
        const rawUrl =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const url = new URL(rawUrl, window.location.origin);
        if (url.pathname.startsWith('/api/')) {
          const method = (
            init?.method ||
            (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET') ||
            'GET'
          ).toUpperCase();

          let body: any = undefined;
          const rawBody = init?.body;
          if (typeof rawBody === 'string' && rawBody.length > 0) {
            try {
              body = JSON.parse(rawBody);
            } catch {
              body = undefined;
            }
          }

          const headers: Record<string, string> = {};
          const rawHeaders = init?.headers;
          if (rawHeaders) {
            if (typeof Headers !== 'undefined' && rawHeaders instanceof Headers) {
              rawHeaders.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
              });
            } else if (Array.isArray(rawHeaders)) {
              for (const [k, v] of rawHeaders) headers[String(k).toLowerCase()] = String(v);
            } else {
              for (const [k, v] of Object.entries(rawHeaders as Record<string, string>)) {
                headers[k.toLowerCase()] = String(v);
              }
            }
          }

          const result = await handleLocalApi(url.pathname, method, body, headers);
          return new Response(JSON.stringify(result.data), {
            status: result.status,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (err) {
        console.error('[DeviceMode] local API failed, falling back to network fetch:', err);
      }
    }
    return nativeFetch(input as any, init);
  };
}
