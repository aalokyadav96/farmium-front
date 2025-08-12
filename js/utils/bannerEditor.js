import { createElement } from "../components/createElement";
import Notify from "../components/ui/Notify.mjs";
import { openCropper } from "./cropper";
import { apiFetch } from "../api/api.js";
import { resolveImagePath, EntityType, PictureType } from "./imagePaths.js";
import { showLoadingMessage, removeLoadingMessage, capitalize } from "../services/profile/profileHelpers.js";
import { handleError } from "./utils.js";

export async function updateImageWithCrop({
  entityType,
  imageType,
  stateKey,
  stateEntityKey,
  previewElementId,
  pictureType,
  entityId
}) {
  const fileInput = createElement("input", { type: "file", accept: "image/*", style: "display:none;" });
  document.body.appendChild(fileInput);
  fileInput.click();

  return new Promise((resolve) => {
    fileInput.addEventListener("change", async () => {
      if (!fileInput.files?.[0]) {
        document.body.removeChild(fileInput);
        return resolve(false);
      }

      const croppedBlob = await openCropper({
        file: fileInput.files[0],
        type: imageType
      });

      document.body.removeChild(fileInput);

      if (!croppedBlob) return resolve(false);

      showLoadingMessage(`Updating ${imageType} picture...`);
      try {
        const formData = new FormData();
        formData.append(stateKey, croppedBlob, `${imageType}.jpg`);

        // Correct backend endpoint URL
        const endpoint = `/picture/${entityType.toLowerCase()}/${entityId}`;

        const response = await apiFetch(endpoint, 'PUT', formData);

        if (!response) throw new Error(`No response for ${imageType} picture update.`);

        const newImageName = response[stateKey];
        if (!newImageName) throw new Error("No image name returned from server.");

        Notify(`${capitalize(imageType)} picture updated successfully.`, { type: "success", duration: 3000 });

        const preview = document.getElementById(previewElementId);
        if (preview) {
          preview.src = resolveImagePath(entityType, pictureType, newImageName) + `?t=${Date.now()}`;
        }

        resolve(true);
      } catch (err) {
        console.error(`Error updating ${imageType} picture:`, err);
        handleError(`Error updating ${imageType} picture. Please try again.`);
        resolve(false);
      } finally {
        removeLoadingMessage();
      }
    }, { once: true });
  });
}

