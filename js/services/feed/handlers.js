// postCreation/handlers.js

import { postTypeConfig } from "./config.js";
import { CheckFile, GetFileHash } from "../../utils/getFileHash.js";
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { createMediaWrapper } from "./domUtils.js";
import { getCsrfToken } from "./helpers.js";
import { renderNewPost } from "./renderNewPost.js";

export function setupHandlers(fileInputs, mediaPreview, postButton, postTypeSelector) {
  let uploadedMedia = [];

  postTypeSelector.addEventListener("change", handlePostTypeChange);
  postButton.addEventListener("click", handlePostButtonClick);
  postButton.disabled = true;
  postButton.style.display = "none";

  Object.entries(fileInputs).forEach(([type, input]) => {
    input.addEventListener("change", (e) => {
      handleMediaFileChange(e, input, type);
    });
  });

  function handlePostTypeChange(e) {
    const selectedType = e.target.value;

    Object.entries(fileInputs).forEach(([type, input]) => {
      input.style.display = type === selectedType ? "block" : "none";
      if (type !== selectedType) input.value = "";
    });

    mediaPreview.innerHTML = "";
    uploadedMedia = [];
  }

  async function handlePostButtonClick() {
    const selectedType = postTypeSelector.value;
    const content = "";

    postButton.disabled = true;
    postButton.style.display = "none";

    const files = Array.from(fileInputs[selectedType].files);

    if (files.length > 0 || content) {
      await addPost(selectedType, content, files);
      postButton.disabled = true;
      postButton.style.display = "none";
    }
  }

  async function handleMediaFileChange(event, inputElement, type) {
    const config = postTypeConfig[type];

    postButton.disabled = false;
    postButton.style.display = "block";

    Array.from(event.target.files).forEach(async (file) => {
      if (!config.validateFile(file)) {
        alert(`Invalid ${type} file. Size must be 10KB - 1GB.`);
        return;
      }

      // const res = await CheckFile(file);
      // if (res.exists === true) {
      //   alert(`You already uploaded this file: ${res.url}`);
      //   mediaPreview.appendChild(
      //     createElement("a", { href: `/post/${res.postid}` }, ["Go To Post"])
      //   );
      //   return;
      // }

      const res = await CheckFile(file);
      if (res.exists === true) {
        alert(`You already uploaded this file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        if (uploadedMedia.some((item) => item.src === src)) {
          alert("Duplicate file.");
          return;
        }

        const mediaElement = config.createMediaElement(src);
        const wrapper = createMediaWrapper(
          mediaElement,
          type,
          file,
          inputElement,
          (srcToRemove) => {
            uploadedMedia = uploadedMedia.filter((m) => m.src !== srcToRemove);
          }
        );

        mediaPreview.appendChild(wrapper);
        uploadedMedia.push({ src, file, type });
      };
      reader.readAsDataURL(file);
    });
  }

  async function addPost(type, content, files) {
    const csrfToken = getCsrfToken();
    const formData = new FormData();
    formData.append("type", type);
    formData.append("text", content);
    formData.append("csrf_token", csrfToken);

    files.forEach((file) => {
      const hash = GetFileHash(file);
      formData.append("hash", hash);
      formData.append(postTypeConfig[type].fileKey, file);
    });

    try {
      const data = await apiFetch("/feed/post", "POST", formData);
      if (data.ok) {
        renderNewPost(data.data, 0);
        clearForm();
      } else {
        alert("Failed to post");
      }
    } catch (err) {
      console.error("Post error:", err);
      alert("An error occurred while posting.");
    }
  }

  function clearForm() {
    mediaPreview.innerHTML = "";
    Object.values(fileInputs).forEach((input) => (input.value = ""));
    uploadedMedia = [];
    postButton.disabled = false;
    postButton.style.display = "block";
  }
}
