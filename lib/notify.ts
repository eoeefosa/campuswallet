// Lightweight local (browser) notifications for budget alerts.
// Uses the Web Notifications API — no server/push setup required.

export function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

// Must be called from a user gesture (e.g. a click) the first time.
export async function ensureNotifyPermission(): Promise<boolean> {
  if (!canNotify()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
}

export async function showLocalNotification(title: string, body: string) {
  if (!canNotify() || Notification.permission !== "granted") return;

  // Prefer the service worker if one is registered (works on mobile too);
  // otherwise fall back to the Notification constructor (desktop).
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: "/icon",
        badge: "/icon",
        tag: "budget-overspend",
      });
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    new Notification(title, { body, icon: "/icon", tag: "budget-overspend" });
  } catch {
    /* notifications unavailable in this context */
  }
}
