import { SRC_URL, state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { handleError } from "../../utils/utils.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { renderPage } from "../../routes/index.js";
import { createForm } from "../../components/createForm.js"; 
import { showLoadingMessage, removeLoadingMessage, capitalize } from "./profileHelpers.js";


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

async function updatePicture(type) {
    if (!state.token) {
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

        state.userProfile = { ...state.userProfile, ...updatedProfile };
        localStorage.setItem("userProfile", JSON.stringify(state.userProfile));

        Snackbar(`${capitalize(type)} picture updated successfully.`, 3000);
        window.location.pathname = window.location.pathname;
    } catch (error) {
        console.error(`Error updating ${type} picture:`, error);
        handleError(`Error updating ${type} picture. Please try again.`);
    } finally {
        removeLoadingMessage();
    }
}


async function updateProfilePics(type) {
    await updatePicture(type);
}

function generateFormField(label, id, type, value) {
    if (value == undefined) {value = ""};
    if (type === "textarea") {
        return `
            <label for="${id}">${label}</label>
            <textarea id="${id}" name="${id}">${value}</textarea>
        `;
    }
    return `
    <div class="form-group">
        <label for="${id}">${label}</label>
        <input id="${id}" name="${id}" type="${type}" value="${value}" />
    </div>
    `;
}



export { generateBannerForm, generateAvatarForm, generateFormField };
