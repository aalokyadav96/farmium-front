// postCreation/domUtils.js

import { removeFileFromInput } from "./helpers.js";

export function createMediaWrapper(mediaElement, type, file, inputElement, onRemove) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("media-preview-item");

  const removeButton = document.createElement("button");
  removeButton.textContent = "Remove";
  removeButton.classList.add("remove-btn");

  removeButton.addEventListener("click", () => {
    wrapper.remove();
    removeFileFromInput(inputElement, file);
    onRemove(mediaElement.src);
  });

  wrapper.appendChild(mediaElement);
  wrapper.appendChild(removeButton);
  return wrapper;
}
