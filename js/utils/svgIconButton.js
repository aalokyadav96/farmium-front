import { createElement } from "../components/createElement";

// --- Icon button utility with optional label ---
export function createIconButton({ classSuffix, svgMarkup, onClick, label = "", id = "" }) {
  const button = createElement("div", { 
    class: `logoicon ${classSuffix}`, 
    id 
  });

  // Wrap SVG in span
  const iconSpan = createElement("span", {});
  iconSpan.innerHTML = svgMarkup;

  const children = [iconSpan];

  // If label text provided, add another span
  if (label) {
    const textSpan = createElement("span", {}, [label]);
    children.push(textSpan);
  }

  children.forEach(child => button.appendChild(child));

  if (onClick) {
    button.addEventListener("click", (e) => { 
      e.preventDefault(); 
      onClick(); 
    });
  }

  return button;
}
