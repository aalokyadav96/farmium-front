import { createElement } from "../../components/createElement.js";
import { t } from "../../i18n/i18n.js";

let adCounter = 0;

export function advertEmbed(page, position = "", options = {}) {
  adCounter++;

  const { classes = "", fallbackText = t("advertisement", {}, "Advertisement") } = options;

  const slotId = `ad-slot-${page}-${Date.now()}-${adCounter}`;

  return createElement("div", {
    id: slotId,
    class: `ad-slot ${classes}`.trim(),
    "data-page": page,
    "data-position": position
  }, [
    createElement("span", { class: "ad-fallback" }, [fallbackText])
  ]);
}

// import { createElement } from "../../components/createElement.js";

// export function advertEmbed(page, position="") {
//   console.log("Embedding advert slot for:", page, position);

//   // Each slot has a unique id so multiple ads can exist on a page
//   const slotId = `ad-slot-${page}-${Math.random().toString(36).slice(2, 8)}`;

//   return createElement("div", {
//     id: slotId,
//     class: "ad-slot",
//     "data-page": page
//   }, [
//     // Optional fallback content (only shows if ads fail to load)
//     createElement("span", { class: "ad-fallback" }, ["Advertisement"])
//   ]);
// }
