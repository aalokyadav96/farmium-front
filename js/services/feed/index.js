// postCreation/index.js

import { postTypeConfig } from "./config.js";
import { setupHandlers } from "./handlers.js";

export function setupPostCreation() {
  const postButton = document.getElementById("postButton");
  const mediaPreview = document.getElementById("mediaPreview");
  const postTypeSelector = document.getElementById("postType");

  const fileInputs = {};
  Object.entries(postTypeConfig).forEach(([type, config]) => {
    fileInputs[type] = document.getElementById(config.inputId);
  });

  setupHandlers(fileInputs, mediaPreview, postButton, postTypeSelector);
}
