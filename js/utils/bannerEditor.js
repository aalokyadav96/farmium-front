import { createElement } from "../components/createElement";
import Notify from "../components/ui/Notify.mjs";
import { openCropper } from "./cropper";
import { bannerFetch } from "../api/api.js";
import { resolveImagePath } from "./imagePaths.js";
import { showLoadingMessage, removeLoadingMessage, capitalize } from "../services/profile/profileHelpers.js";
import { handleError } from "./utils.js";

// updateImageWithCrop
export async function updateImageWithCrop({
  entityType,
  imageType,
  stateKey,
  stateEntityKey,
  previewElementId,
  pictureType,
  entityId
}) {
  const modal = createElement("div", { style: "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;" });
  const box = createElement("div", { style: "background:#fff;padding:20px;border-radius:8px;text-align:center;min-width:300px;" }, [
    createElement("p", {}, [`Choose how to update your ${imageType} picture:`])
  ]);
  const uploadBtn = createElement("button", { style: "margin:5px;" }, ["Upload Image"]);
  const linkBtn = createElement("button", { style: "margin:5px;" }, ["Use URL"]);
  const cancelBtn = createElement("button", { style: "margin:5px;" }, ["Cancel"]);

  box.append(uploadBtn, linkBtn, cancelBtn);
  modal.appendChild(box);
  document.body.appendChild(modal);

  return new Promise((resolve) => {
    const cleanup = () => document.body.removeChild(modal);

    uploadBtn.addEventListener("click", async () => {
      cleanup();
      const fileInput = createElement("input", { type: "file", accept: "image/*", style: "display:none;" });
      document.body.appendChild(fileInput);
      fileInput.click();

      fileInput.addEventListener("change", async () => {
        if (!fileInput.files?.[0]) {
          document.body.removeChild(fileInput);
          return resolve(false);
        }

        const croppedBlob = await openCropper({ file: fileInput.files[0], type: imageType });
        document.body.removeChild(fileInput);
        if (!croppedBlob) return resolve(false);

        showLoadingMessage(`Updating ${imageType} picture...`);
        try {
          const formData = new FormData();
          formData.append(stateKey, croppedBlob, `${imageType}.jpg`);

          const endpoint = `/picture/${entityType.toLowerCase()}/${entityId}`;
          const response = await bannerFetch(endpoint, "PUT", formData);

          if (!response) throw new Error(`No response for ${imageType} picture update.`);

          // const newImageName = response[stateKey];
          const newImageName = response.data[stateKey];
          if (!newImageName) throw new Error("No image name returned from server.");

          Notify(`${capitalize(imageType)} picture updated successfully.`, { type: "success", duration: 3000 });
          const preview = document.getElementById(previewElementId);
          if (preview) preview.src = resolveImagePath(entityType, pictureType, newImageName) + `?t=${Date.now()}`;

          resolve(response); // return API response, not just true
        } catch (err) {
          console.error(err);
          handleError(`Error updating ${imageType} picture. Please try again.`);
          resolve(false);
        } finally {
          removeLoadingMessage();
        }
      }, { once: true });
    }, { once: true });

    linkBtn.addEventListener("click", async () => {
      cleanup();
      const url = window.prompt("Enter the image URL:");
      if (!url) return resolve(false);

      showLoadingMessage(`Updating ${imageType} picture from URL...`);
      try {
        const response = await bannerFetch(
          `/picture/${entityType.toLowerCase()}/${entityId}`,
          "PUT",
          { [stateKey]: url }
        );
        
        if (!response) throw new Error("No response from server.");

        Notify(`${capitalize(imageType)} picture updated successfully.`, { type: "success", duration: 3000 });
        const preview = document.getElementById(previewElementId);
        if (preview) preview.src = url + `?t=${Date.now()}`;

        resolve(response); // return API response
      } catch (err) {
        console.error(err);
        handleError(`Error updating ${imageType} picture. Please try again.`);
        resolve(false);
      } finally {
        removeLoadingMessage();
      }
    }, { once: true });

    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(false);
    }, { once: true });
  });
}