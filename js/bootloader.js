let API_URL = "http://localhost:4000/api/v1"; 

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then((reg) => console.log("🔌 Service worker registered:", reg.scope))
      .catch((err) => console.error("❌ Service worker registration failed:", err));
  });
}

(async () => {
  console.log("🔧 Bootloader initializing...");

  const retryKey = "bootloader-retry";
  const retries = Number(localStorage.getItem(retryKey) || 0);
  if (retries > 2) {
    console.error("🚫 Bootloader: retry limit exceeded.");
    localStorage.removeItem(retryKey);
    return;
  }

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const measurePerformance = async () => {
    const t0 = performance.now();
    for (let i = 0; i < 100000; i++) Math.sqrt(i);
    const t1 = performance.now();
    return Math.max(100 - (t1 - t0), 0);
  };

  const environment = {
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    browser: isSafari ? "safari" :
             navigator.userAgent.includes("Firefox") ? "firefox" :
             navigator.userAgent.includes("Chrome") ? "chrome" : "unknown",
    networkSpeed: navigator.connection?.effectiveType || "unknown",
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    online: navigator.onLine,
    performanceScore: await measurePerformance()
  };

  console.log("🌐 Environment profile:", environment);
  window.__env = environment;

  // telemetry
  navigator.sendBeacon?.(`${API_URL}/telemetry/env`, JSON.stringify({
    event: "env-profile",
    ts: Date.now(),
    environment
  }));

  // offline banner
  const showOfflineBanner = () => {
    if (document.getElementById("offline-banner")) return;
    const banner = document.createElement("div");
    banner.id = "offline-banner";
    Object.assign(banner.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      background: "#b00020",
      color: "#fff",
      textAlign: "center",
      padding: "0.5rem",
      zIndex: "9999",
      fontSize: "0.9rem"
    });
    banner.textContent = "📴 You're offline. Some features may not work.";
    document.body.appendChild(banner);
  };

  const removeOfflineBanner = () => {
    const banner = document.getElementById("offline-banner");
    if (banner) banner.remove();
  };

  window.addEventListener("offline", showOfflineBanner);
  window.addEventListener("online", removeOfflineBanner);

  if (!environment.online) {
    showOfflineBanner();
    console.warn("📴 Offline detected. Bootloader continuing in degraded mode.");
  }

  const preloadScript = (href) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = href;
    document.head.appendChild(link);
  };

  const loadScript = (src, integrity = "", timeout = 7000) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.type = "module";
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = "anonymous";
      }
      const timer = setTimeout(() => reject(`⏰ Timeout loading ${src}`), timeout);
      script.onload = () => {
        clearTimeout(timer);
        resolve(`✅ Loaded ${src}`);
      };
      script.onerror = () => {
        clearTimeout(timer);
        reject(`❌ Failed to load ${src}`);
      };
      document.head.appendChild(script);
    });
  };

  const reportBootError = async (err, env) => {
    try {
      await fetch("/telemetry/boot-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.toString(), environment: env })
      });
    } catch (_) {}
  };

  let uiTier = localStorage.getItem("ui-tier-v1");

  if (!uiTier) {
    if (environment.deviceType === "mobile" || environment.networkSpeed.includes("2g")) {
      uiTier = "light";
    } else if (environment.performanceScore < 50) {
      uiTier = "medium";
    } else {
      uiTier = "full";
    }
    localStorage.setItem("ui-tier-v1", uiTier);
  }

  const uiPath = `/js/modules/${uiTier}-ui.js`;
  preloadScript(uiPath);

  try {
    await loadScript(uiPath);
    if (environment.browser === "safari") {
      await loadScript("/js/polyfills/safari-polyfill.js");
    }

    await loadScript("/js/app.js");

    localStorage.removeItem(retryKey);
    console.log("🚀 Bootloader complete.");
  } catch (err) {
    console.error("💥 Bootloader error:", err);
    await reportBootError(err, environment);
    localStorage.removeItem("ui-tier-v1");
    localStorage.setItem(retryKey, retries + 1);
    location.reload();
  }
})();
