/**
 * Officer PIN storage for admin API calls.
 *
 * The PIN is entered once on the Admin lock screen, verified by the SERVER
 * (POST /api/admin/verify), and then kept in sessionStorage only — it is
 * cleared when the tab/session ends or the officer locks the desk.
 * It is sent to the server as the `x-admin-pin` header on admin requests;
 * the server re-checks it on every call. The PIN is never fetched from
 * the server and never compared in the browser.
 */
const ADMIN_PIN_KEY = 'facevote_admin_pin';

export function getAdminPin(): string {
  try {
    return sessionStorage.getItem(ADMIN_PIN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminPin(pin: string): void {
  try {
    sessionStorage.setItem(ADMIN_PIN_KEY, pin);
  } catch {}
}

export function clearAdminPin(): void {
  try {
    sessionStorage.removeItem(ADMIN_PIN_KEY);
  } catch {}
}

export function adminHeaders(): Record<string, string> {
  const pin = getAdminPin();
  return pin ? { 'x-admin-pin': pin } : {};
}
