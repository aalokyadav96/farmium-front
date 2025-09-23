import { createElement } from "../../components/createElement.js";

export function advertEmbed(page) {
  console.log("Embedding advert slot for:", page);

  // Each slot has a unique id so multiple ads can exist on a page
  const slotId = `ad-slot-${page}-${Math.random().toString(36).slice(2, 8)}`;

  return createElement("div", {
    id: slotId,
    class: "ad-slot",
    "data-page": page
  }, [
    // Optional fallback content (only shows if ads fail to load)
    createElement("span", { class: "ad-fallback" }, ["Advertisement"])
  ]);
}
