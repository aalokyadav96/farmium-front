export const environment = {
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    browser: (() => {
      if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return "safari";
      if (navigator.userAgent.includes("Firefox")) return "firefox";
      if (navigator.userAgent.includes("Chrome")) return "chrome";
      return "unknown";
    })(),
    networkSpeed: navigator.connection?.effectiveType || "unknown",
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    online: navigator.onLine
  };
  