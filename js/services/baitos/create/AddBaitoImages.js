import { createElement } from "../../../components/createElement.js";
import { navigate } from "../../../routes/index.js";
import { bannerFetch } from "../../../api/api.js";
import Notify from "../../../components/ui/Notify.mjs";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

export async function baitoAddImages({ baito = {}, isLoggedIn = false, contentContainer = null }) {
  const container = contentContainer || document.querySelector("#content");
  container.replaceChildren();

  if (!isLoggedIn) {
    Notify("You must be logged in to update images.", { type: "warning", duration: 3000, dismissible: true });
    navigate("/login");
    return;
  }

  const section = createElement("div", { class: "edit-images-section" });
  const form = createElement("form", { enctype: "multipart/form-data" });
  section.appendChild(form);

  const title = createElement("h2", {}, ["Edit Images"]);
  section.appendChild(title);

  // ---- Existing images with remove buttons ----
  const existingDiv = createElement("div", { class: "existing-images" });
  const keptImages = new Set(baito.images || []);

  const renderExisting = () => {
    existingDiv.replaceChildren();
    keptImages.forEach(img => {
      const wrapper = createElement("div", { class: "img-wrapper", style: "display:inline-block;position:relative;margin:5px;" });
      const imgEl = createElement("img", {
        src: resolveImagePath(EntityType.BAITO, PictureType.PHOTO, img),
        style: "max-width:120px;border:1px solid #ccc;border-radius:4px;"
      });
      const removeBtn = createElement("button", {
        type: "button",
        style: "position:absolute;top:0;right:0;background:red;color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;"
      }, ["×"]);
      removeBtn.addEventListener("click", () => {
        keptImages.delete(img);
        renderExisting();
      });
      wrapper.append(imgEl, removeBtn);
      existingDiv.appendChild(wrapper);
    });
  };
  renderExisting();
  form.appendChild(existingDiv);

  // ---- New images uploader ----
  const uploadInput = createElement("input", { type: "file", id: "baito-images", accept: "image/*", multiple: true });
  form.appendChild(uploadInput);

  // ---- Submit button ----
  const submitBtn = createElement("button", { type: "submit", class: "btn btn-primary" }, ["Update Images"]);
  form.appendChild(submitBtn);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    submitBtn.disabled = true;

    const payload = new FormData();
    // Keep list
    Array.from(keptImages).forEach(img => payload.append("keepImages", img));
    // New files
    Array.from(uploadInput.files).forEach(file => payload.append("images", file));

    try {
      Notify("Updating images...", { type: "info", duration: 2000, dismissible: true });
      await bannerFetch(`/gallery/baito/${baito.baitoid}/images`, "PUT", payload);
      Notify("Images updated successfully!", { type: "success", duration: 3000, dismissible: true });
      navigate(`/baito/${baito.baitoid}`);
    } catch (err) {
      Notify(`Error: ${err.message || "Failed to update images."}`, { type: "error", duration: 4000, dismissible: true });
    } finally {
      submitBtn.disabled = false;
    }
  });

  container.appendChild(section);
}