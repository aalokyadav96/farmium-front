import { getState, setState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { showLoadingMessage, removeLoadingMessage, capitalize } from "./profileHelpers.js";
import { createElement } from "../../components/createElement.js";
import { handleError } from "../../utils/utils.js";
import SightBox from "../../components/ui/SightBox.mjs";
import { openCropper } from "../../utils/cropper.js";
import Notify from "../../components/ui/Notify.mjs";


// async function updatePictureWithCrop(type, aspect) {}
async function updatePictureWithCrop(type) {
    if (!getState("token")) {
      Notify(`Please log in to update your ${type} picture.`, {type:"warning",duration:3000, dismissible:true});
      return false;
    }
  
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
  
          // Preserve the original API endpoint
          const response = await apiFetch(`/profile/${type}`, 'PUT', formData);
  
          if (!response) throw new Error(`No response for ${type} picture update.`);
  
          // Determine the correct key for the response image name
          const imageKey = type === "avatar" ? "profile_picture" : `${type}_picture`;
          const newImageName = response[imageKey];
          if (!newImageName) throw new Error("No image name returned from server.");
  
          // Update local profile state with new image name
          const currentProfile = getState("userProfile") || {};
          setState({
            userProfile: {
              ...currentProfile,
              [imageKey]: newImageName
            }
          }, true);
  
          Notify(`${capitalize(type)} picture updated successfully.`, {type:"success",duration:3000, dismissible:true});
  
          // Update preview image src immediately
          const preview = document.getElementById(`${type}-picture-preview`);
          if (preview) {
            const pictureType = (type === "banner") ? PictureType.BANNER : PictureType.THUMB;
            preview.src = resolveImagePath(EntityType.USER, pictureType, newImageName) + `?t=${Date.now()}`;
          }
  
          resolve(true);
        } catch (err) {
          console.error(`Error updating ${type} picture:`, err);
          handleError(`Error updating ${type} picture. Please try again.`);
          resolve(false);
        } finally {
          removeLoadingMessage();
        }
      }, { once: true });
    });
  }
  
  function createBanner(profile) {
    const bgImg = createElement("span", { class: "bg_img" });
    const banncon = createElement("span", { style: "position: relative;" });

    const bannerFilename = profile.banner_picture || "default.webp";
    const bannerPath = resolveImagePath(EntityType.USER, PictureType.BANNER, bannerFilename);
    const sightPath = resolveImagePath(EntityType.USER, PictureType.BANNER, bannerFilename);
    const fallbackPath = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "default-banner.png");

    // Function to set background image safely
    function setBg(url) {
        const img = new Image();
        img.onload = () => bgImg.style.backgroundImage = `url(${url})`;
        img.onerror = () => bgImg.style.backgroundImage = `url(${fallbackPath})`;
        img.src = url;
    }

    setBg(bannerPath);

    bgImg.addEventListener("click", () => SightBox(sightPath, "image"));

    appendChildren(banncon, createBannerEditButton(profile), bgImg);
    return banncon;
}



function createBannerEditButton(profile) {
    if (profile.userid !== getState("user")) return document.createDocumentFragment();
    const editButton = createElement("button", { class: "edit-banner-pic" }, ["B"]);
    // editButton.addEventListener("click", () => updatePictureWithCrop("banner", "3/1"));
    editButton.addEventListener("click", () => updatePictureWithCrop("banner"));
    return editButton;
}

function createProfilePicture(profile) {
    const profileArea = createElement("div", { class: "profile_area" });
    const thumb = createElement("span", { class: "thumb" });

    const thumbSrc = resolveImagePath(EntityType.USER, PictureType.THUMB, `${profile.userid}.jpg`);
    const fullSrc = resolveImagePath(EntityType.USER, PictureType.PHOTO, profile.profile_picture);

    const img = new Image();
    img.src = thumbSrc;
    img.alt = "Profile Picture";
    img.loading = "lazy";
    img.onerror = () => { img.src = "/assets/icon-192.png"; };
    img.classList.add("imgful");

    thumb.appendChild(img);

    if (profile.profile_picture) {
        thumb.addEventListener("click", () => SightBox(fullSrc, "image"));
    }

    profileArea.appendChild(thumb);

    if (profile.userid === getState("user")) {
        const editProfileButton = createElement("button", { class: "edit-profile-pic" }, ["P"]);
        // editProfileButton.addEventListener("click", () => updatePictureWithCrop("avatar", "1/1"));
        editProfileButton.addEventListener("click", () => updatePictureWithCrop("avatar"));
        profileArea.appendChild(editProfileButton);
    }

    return profileArea;
}

export {
    createBanner,
    createBannerEditButton,
    createProfilePicture,
    updatePictureWithCrop,
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

