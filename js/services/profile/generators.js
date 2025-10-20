import { getState, setState } from "../../state/state.js";
import { apiFetch, bannerFetch } from "../../api/api.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { showLoadingMessage, removeLoadingMessage, capitalize } from "./profileHelpers.js";
import { createElement } from "../../components/createElement.js";
import { handleError } from "../../utils/utils.js";
import SightBox from "../../components/ui/SightBox.mjs";
import { openCropper } from "../../utils/cropper.js";
import Notify from "../../components/ui/Notify.mjs";
import { updateImageWithCrop } from "../../utils/bannerEditor.js";
// import Imagex from "../../components/base/Imagex.js";
import Bannerx from "../../components/base/Bannerx.js";

async function updateUserPicture(type) {
  if (!getState("token")) {
    Notify(`Please log in to update your ${type} picture.`, { type: "warning", duration: 3000, dismissible: true });
    return false;
  }

  if (type === "avatar") {
    // Avatar-specific flow (manual crop + FormData + apiFetch)
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
          type
        });

        document.body.removeChild(fileInput);
        if (!croppedBlob) return resolve(false);

        showLoadingMessage(`Updating ${type} picture...`);
        try {
          const formData = new FormData();
          formData.append(`${type}_picture`, croppedBlob, `${type}.jpg`);

          const response = await bannerFetch(`/profile/${type}`, 'PUT', formData);
          if (!response) throw new Error(`No response for ${type} picture update.`);

          const newImageName = response.avatar;
          if (!newImageName) throw new Error("No image name returned from server.");

          const currentProfile = getState("userProfile") || {};
          setState({
            userProfile: {
              ...currentProfile,
              avatar: newImageName
            }
          }, true);

          Notify(`Avatar picture updated successfully.`, { type: "success", duration: 3000, dismissible: true });

          const preview = document.getElementById("avatar-picture-preview");
          if (preview) {
            preview.src = resolveImagePath(EntityType.USER, PictureType.THUMB, newImageName) + `?t=${Date.now()}`;
          }

          resolve(true);
        } catch (err) {
          console.error(`Error updating avatar picture:`, err);
          handleError(`Error updating avatar picture. Please try again.`);
          resolve(false);
        } finally {
          removeLoadingMessage();
        }
      }, { once: true });
    });
  } else {
    // Non-avatar flow (delegates to existing helper)
    const profile = getState("userProfile");
    if (!profile?.userid) {
      handleError("No user profile found. Cannot update picture.");
      return false;
    }

    try {
      const response = await updateImageWithCrop({
        entityType: EntityType.USER,
        imageType: type,
        stateKey: type,
        stateEntityKey: "user",
        previewElementId: "user-avatar-img",
        pictureType: PictureType.PHOTO,
        entityId: profile.userid
      });

      if (!response) return false;

      const imageKey = `${type}`;
      const newImageName = response[imageKey];
      if (!newImageName) throw new Error("No image name returned from server.");

      const currentProfile = getState("userProfile") || {};
      setState({
        userProfile: {
          ...currentProfile,
          [imageKey]: newImageName
        }
      }, true);

      Notify(`${capitalize(type)} picture updated successfully.`, { type: "success", duration: 3000, dismissible: true });

      const preview = document.getElementById(`${type}-picture-preview`);
      if (preview) {
        const pictureType = (type === "banner") ? PictureType.BANNER : PictureType.THUMB;
        preview.src = resolveImagePath(EntityType.USER, pictureType, newImageName) + `?t=${Date.now()}`;
      }

      return true;
    } catch (err) {
      console.error(err);
      handleError(`Error updating ${type} picture. Please try again.`);
      return false;
    }
  }
}

function createBanner(profile, isCreator) {
  return Bannerx({
    isCreator: isCreator,
    bannerkey: profile.banner,
    banneraltkey: `Banner for ${profile.username || "User"}`,
    bannerentitytype: EntityType.USER,
    stateentitykey: "user",
    bannerentityid: profile.userid
  });
}

function createAvatar(profile) {
  const profileArea = createElement("div", { class: "profile_area" });
  const thumb = createElement("span", { class: "thumb" });

  const thumbSrc = resolveImagePath(EntityType.USER, PictureType.THUMB, `${profile.userid}.jpg`);
  const fullSrc = resolveImagePath(EntityType.USER, PictureType.PHOTO, profile.avatar);

  const img = new Image();
  img.src = thumbSrc;
  img.alt = "Profile Picture";
  img.loading = "lazy";
  img.onerror = () => { img.src = "/assets/icon-192.png"; };
  img.classList.add("imgful");

  thumb.appendChild(img);

  if (profile.avatar) {
    thumb.addEventListener("click", () => SightBox(fullSrc, "image"));
  }

  profileArea.appendChild(thumb);

  if (profile.userid === getState("user")) {
    const editProfileButton = createElement("button", { class: "edit-profile-pic" }, ["P"]);
    // editProfileButton.addEventListener("click", () => updatePictureWithCrop("avatar", "1/1"));
    editProfileButton.addEventListener("click", () => updateUserPicture("avatar"));
    profileArea.appendChild(editProfileButton);
  }

  return profileArea;
}

export {
  createBanner,
  createAvatar,
  updateUserPicture,
};

// Utility: append multiple children safely
function appendChildren(parent, ...children) {
  children.forEach(child => {
    if (child instanceof Node) parent.appendChild(child);
    else console.error("Invalid child passed to appendChildren:", child);
  });
}

function generateFormField(label, id, type, value = "") {
  const wrapper = createElement("div", { class: "form-group" });

  const labelEl = createElement("label", { for: id }, [label]);

  let inputEl;
  if (type === "textarea") {
    inputEl = createElement("textarea", {
      id,
      name: id,
      rows: 4
    });
    inputEl.value = value;
  } else {
    inputEl = createElement("input", {
      id,
      name: id,
      type,
      value
    });
  }

  wrapper.appendChild(labelEl);
  wrapper.appendChild(inputEl);

  return wrapper;
}

export { generateFormField, appendChildren };

