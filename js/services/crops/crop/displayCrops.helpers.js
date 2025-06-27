import { createElement } from "../../../components/createElement";
import { navigate } from "../../../routes";

export function guessCategoryFromName(name) {
  const lower = name.toLowerCase();
  if (/mango|banana|apple|guava/.test(lower)) return "fruits";
  if (/tomato|onion|potato|spinach/.test(lower)) return "vegetables";
  if (/chickpea|lentil|pea/.test(lower)) return "legumes";
  if (/sorghum|millet|bajra/.test(lower)) return "millets";
  if (/rose|lily|marigold/.test(lower)) return "flowers";
  return "others";
}

export function createPromoLink(text, cropName, data) {
  const link = createElement("a", { href: "#", class: "promo-link" }, [text]);
  link.onclick = e => {
    e.preventDefault();
    const found = Object.values(data).flat().find(c =>
      c.name.toLowerCase() === cropName.toLowerCase()
    );
    found ? navigate(`/crop/${cropName.toLowerCase()}`) : alert(`Sorry, ${cropName} not found.`);
  };
  return link;
}
