import { getState, setState } from "../../state/state.js"; // You forgot this
import { SRC_URL } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { handleError } from "../../utils/utils.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { createForm } from "../../components/createForm.js"; 
import { showLoadingMessage, removeLoadingMessage, capitalize } from "./profileHelpers.js";
import Notify from "../../components/ui/Notify.mjs";

import { createElement } from "../../components/createElement.js";

async function updatePicture(type) {
    if (!getState("token")) {
        Snackbar(`Please log in to update your ${type} picture.`, 3000);
        return;
    }

    const fileInput = document.getElementById(`edit-${type}-picture`);
    if (!fileInput || !fileInput.files[0]) {
        Snackbar(`No ${type} picture selected.`, 3000);
        return;
    }

    showLoadingMessage(`Updating ${type} picture...`);

    try {
        const formData = new FormData();
        formData.append(`${type}_picture`, fileInput.files[0]);

        const updatedProfile = await apiFetch(`/profile/${type}`, 'PUT', formData);
        if (!updatedProfile) throw new Error(`No response received for ${type} picture update.`);

        const currentProfile = getState("userProfile") || {};
        setState({ userProfile: { ...currentProfile, ...updatedProfile } }, true);

        Snackbar(`${capitalize(type)} picture updated successfully.`, 3000);
        window.location.pathname = window.location.pathname;
    } catch (error) {
        console.error(`Error updating ${type} picture:`, error);
        handleError(`Error updating ${type} picture. Please try again.`);
    } finally {
        removeLoadingMessage();
    }
}


function generateBannerForm(content, pic) {
    const bannerPictureSrc = `${SRC_URL}/userpic/banner/${pic}`;
    const fields = [
        {
            label: "Banner Picture",
            id: "edit-banner-picture",
            currentSrc: bannerPictureSrc,
            previewId: "banner-picture-preview",
        },
    ];
    return createForm(content, fields, "edit-banner-form", "update-banner-pics-btn", "Update Banner Pics", () => {
        const formData = new FormData(document.getElementById("edit-banner-form"));
        updateProfilePics('banner', formData);
    });
}

function generateAvatarForm(content, pic) {
    const profilePictureSrc = `${SRC_URL}/userpic/${pic}`;
    const fields = [
        {
            label: "Profile Picture",
            id: "edit-avatar-picture",
            currentSrc: profilePictureSrc,
            previewId: "profile-picture-preview",
        },
    ];
    return createForm(content, fields, "edit-avatar-form", "update-avatar-pics-btn", "Update Profile Pics", () => {
        const formData = new FormData(document.getElementById("edit-avatar-form"));
        updateProfilePics('avatar', formData);
    });
}

async function updateProfilePics(type) {
    await updatePicture(type);
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


export { generateBannerForm, generateAvatarForm, generateFormField };
