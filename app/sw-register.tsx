"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Service worker caching is disabled. Unregister any previously
    // installed worker and wipe its caches so no stale content is served.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    caches?.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }, []);

  return null;
}
