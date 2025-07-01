import { createElement } from "../../createElement";

export function createSpeedDropdown(video) {
  const dropdown = createElement("select", { class: "playback-speed" }, []);
  [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].forEach(speed => {
    const opt = createElement("option", { value: speed }, []);
    opt.textContent = `${speed}x`;
    if (speed === 1) opt.selected = true;
    dropdown.appendChild(opt);
  });

  dropdown.addEventListener("change", e => {
    video.playbackRate = parseFloat(e.target.value);
  });

  return dropdown;
}
