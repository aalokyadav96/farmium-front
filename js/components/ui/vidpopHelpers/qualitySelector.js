import { createElement } from "../../createElement";

export function createQualitySelector(video, qualities) {
  const select = createElement("select", { class: "quality-selector" }, []);

  const stored = localStorage.getItem("videoQuality") || "480p";

  qualities.forEach(({ label }) => {
    const opt = createElement("option", { value: label }, []);
    opt.textContent = label;
    opt.selected = label === stored;
    select.appendChild(opt);
  });

  select.addEventListener("change", (e) => {
    const selected = qualities.find(q => q.label === e.target.value);
    if (!selected) return;

    localStorage.setItem("videoQuality", selected.label);
    const { currentTime, paused } = video;

    video.src = selected.src;
    video.setAttribute("data-quality", selected.label);
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = currentTime;
      if (!paused) video.play();
    }, { once: true });
  });

  return select;
}
