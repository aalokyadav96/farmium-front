import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";

export function buildPagination(onPrev, onNext) {
  const prevBtn = Button("← Prev", "prev-btn", { click: onPrev }, "buttonx");
  const nextBtn = Button("Next →", "next-btn", { click: onNext }, "buttonx");
  const wrapper = createElement("div", { class: "baito-pagination" }, [prevBtn, nextBtn]);
  return { wrapper, prevBtn, nextBtn };
}
