import { state } from '../../state/state.js';
import { apiFetch } from "../../api/api.js";
import { handleError } from "../../utils/utils.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { renderPage, navigate } from "../../routes/index.js";
import { showLoadingMessage, removeLoadingMessage } from "./profileHelpers.js";
import { generateFormField } from "./generators.js";
import {deleteProfile} from "./userProfileService.js";


async function editProfile(content) {
    content.textContent = ""; // Clear existing content

    if (!state.userProfile) {
        Snackbar("Please log in to edit your profile.", 3000);
        return;
    }

    const { username, name, email, bio, phone_number } = state.userProfile;

    content.innerHTML = `
        <h2>Edit Profile</h2>
        <form id="edit-profile-form" class="edit-profile-form">
            ${generateFormField("Username", "edit-username", "text", username)}
            ${generateFormField("Name", "edit-name", "text", name)}
            ${generateFormField("Email", "edit-email", "email", email)}
            ${generateFormField("Bio", "edit-bio", "textarea", bio || "")}
            ${generateFormField("Phone Number", "edit-phone", "text", phone_number || "")}
            <button type="button" id="update-profile-btn">Update Profile</button>
            <button type="button" id="cancel-profile-btn">Cancel</button>
        </form>
    `;

    document.getElementById("update-profile-btn").addEventListener("click", () => {
        const form = document.getElementById("edit-profile-form");
        updateProfile(new FormData(form));
    });

    document.getElementById("cancel-profile-btn").addEventListener("click", () => {
        Snackbar("Profile editing canceled.", 2000);
        navigate("/profile"); // Assuming a function to navigate back to the profile view
        window.location.pathname = window.location.pathname;
        // renderPage();
    });

    const deleteProfileButton = document.createElement("button");
    deleteProfileButton.className = "btn delete-btn";
    deleteProfileButton.dataset.action = "delete-profile";
    deleteProfileButton.textContent = "Delete Profile";
    content.appendChild(deleteProfileButton);
    deleteProfileButton.addEventListener("click", () => {
        deleteProfile();
    });
}


async function updateProfile(formData) {
    if (!state.token) {
        Snackbar("Please log in to update your profile.", 3000);
        return;
    }

    const currentProfile = state.userProfile || {};
    const updatedFields = {};

    for (const [key, value] of formData.entries()) {
        const fieldName = key.replace("edit-", "");
        const trimmedValue = value.trim();

        console.log(`Comparing: "${trimmedValue}" with "${currentProfile[fieldName] || ""}"`);
        if (trimmedValue !== (currentProfile[fieldName] || "").trim()) {
            updatedFields[fieldName] = trimmedValue;
        }
    }

    if (Object.keys(updatedFields).length === 0) {
        Snackbar("No changes were made to the profile.", 3000);
        return;
    }

    showLoadingMessage("Updating...");

    try {
        const updateFormData = new FormData();
        Object.entries(updatedFields).forEach(([key, value]) => updateFormData.append(key, value));

        const updatedProfile = await apiFetch("/profile/edit", "PUT", updateFormData);
        if (!updatedProfile) throw new Error("No response received for the profile update.");

        state.userProfile = { ...currentProfile, ...updatedProfile };
        localStorage.setItem("userProfile", JSON.stringify(state.userProfile));

        Snackbar("Profile updated successfully.", 3000);
        renderPage();
    } catch (error) {
        console.error("Error updating profile:", error);
        handleError("Error updating profile. Please try again.");
    } finally {
        removeLoadingMessage();
    }
}


export { editProfile };