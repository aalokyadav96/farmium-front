// domUtils.js
/**
 * Lightweight element creator and appender.
 */
export function createElement(tag, attributes = {}, children = []) {
    const el = document.createElement(tag);
  
    for (const key in attributes) {
      const val = attributes[key];
      if (key === "textContent") {
        el.textContent = val;
      } else if (key === "onclick") {
        el.onclick = val;
      } else if (key === "className") {
        el.className = val;
      } else if (key === "style") {
        el.style.cssText = val;
      } else {
        el.setAttribute(key, val);
      }
    }
  
    for (const child of (Array.isArray(children) ? children : [children])) {
      if (child) el.appendChild(child);
    }
  
    return el;
  }
  