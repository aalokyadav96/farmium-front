import { getState, setState } from '../../state/state.js';
import { apiFetch } from "../../api/api.js";
import { handleError } from "../../utils/utils.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { renderPage, navigate } from "../../routes/index.js";
import { showLoadingMessage, removeLoadingMessage } from "./profileHelpers.js";
import { generateFormField } from "./generators.js";
import { deleteProfile } from "./userProfileService.js";
import { createElement } from "../../components/createElement.js";
import Button from '../../components/base/Button.js';
import Notify from "../../components/ui/Notify.mjs";

async function editProfile(content) {
    content.replaceChildren(); // Clear content

    const profile = getState("userProfile");
    if (!profile) {
        Snackbar("Please log in to edit your profile.", 3000);
        return;
    }

    const { username, name, email, bio, phone_number } = profile;

    const title = createElement("h2", {}, ["Edit Profile"]);

    const form = createElement("form", {
        id: "edit-profile-form",
        class: "create-section"
    });

    const fields = [
        generateFormField("Username", "edit-username", "text", username),
        generateFormField("Name", "edit-name", "text", name),
        generateFormField("Email", "edit-email", "email", email),
        generateFormField("Bio", "edit-bio", "textarea", bio || ""),
        generateFormField("Phone Number", "edit-phone", "text", phone_number || "")
    ];

    fields.forEach(field => {
        if (field) form.appendChild(field);
    });

    const updateBtn = Button("Update Profile", "update-profile-btn", {
        click: () => {
            updateProfile(new FormData(form));
        }
    });

    const cancelBtn = Button("Cancel", "cancel-profile-btn", {
        click: () => {
            Snackbar("Profile editing canceled.", 2000);
            navigate("/profile");
            window.location.pathname = window.location.pathname;
        }
    });

    form.appendChild(updateBtn);
    form.appendChild(cancelBtn);

    const deleteBtn = Button("Delete Profile", "btndelprof", {
        "click": () => {
            deleteProfile();
        }
    }, "btn delete-btn");
    deleteBtn.setAttribute("data-action", "delete-profile");

    content.append(title, form, deleteBtn);
}


async function updateProfile(formData) {
    if (!getState("token")) {
        Snackbar("Please log in to update your profile.", 3000);
        return;
    }

    const currentProfile = getState("userProfile") || {};
    const updatedFields = {};

    for (const [key, value] of formData.entries()) {
        const fieldName = key.replace("edit-", "");
        const trimmedValue = value.trim();

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

        const mergedProfile = { ...currentProfile, ...updatedProfile };
        setState({ userProfile: mergedProfile }, true);

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

// import { getState, setState } from '../../state/state.js';
// import { apiFetch } from "../../api/api.js";
// import { handleError } from "../../utils/utils.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';
// import { renderPage, navigate } from "../../routes/index.js";
// import { showLoadingMessage, removeLoadingMessage } from "./profileHelpers.js";
// import { generateFormField } from "./generators.js";
// import { deleteProfile } from "./userProfileService.js";

// async function editProfile(content) {
//     content.textContent = ""; // Clear existing content

//     const profile = getState("userProfile");
//     if (!profile) {
//         Snackbar("Please log in to edit your profile.", 3000);
//         return;
//     }

//     const { username, name, email, bio, phone_number } = profile;

//     content.innerHTML = `
//         <h2>Edit Profile</h2>
//         <form id="edit-profile-form" class="create-section">
//             ${generateFormField("Username", "edit-username", "text", username)}
//             ${generateFormField("Name", "edit-name", "text", name)}
//             ${generateFormField("Email", "edit-email", "email", email)}
//             ${generateFormField("Bio", "edit-bio", "textarea", bio || "")}
//             ${generateFormField("Phone Number", "edit-phone", "text", phone_number || "")}
//             <button type="button" id="update-profile-btn">Update Profile</button>
//             <button type="button" id="cancel-profile-btn">Cancel</button>
//         </form>
//     `;

//     document.getElementById("update-profile-btn").addEventListener("click", () => {
//         const form = document.getElementById("edit-profile-form");
//         updateProfile(new FormData(form));
//     });

//     document.getElementById("cancel-profile-btn").addEventListener("click", () => {
//         Snackbar("Profile editing canceled.", 2000);
//         navigate("/profile");
//         window.location.pathname = window.location.pathname;
//     });

//     const deleteProfileButton = document.createElement("button");
//     deleteProfileButton.classList.add("btn", "delete-btn");
//     deleteProfileButton.dataset.action = "delete-profile";
//     deleteProfileButton.append("Delete Profile");
//     content.appendChild(deleteProfileButton);

//     deleteProfileButton.addEventListener("click", () => {
//         deleteProfile();
//     });
// }


// async function updateProfile(formData) {
//     if (!getState("token")) {
//         Snackbar("Please log in to update your profile.", 3000);
//         return;
//     }

//     const currentProfile = getState("userProfile") || {};
//     const updatedFields = {};

//     for (const [key, value] of formData.entries()) {
//         const fieldName = key.replace("edit-", "");
//         const trimmedValue = value.trim();

//         if (trimmedValue !== (currentProfile[fieldName] || "").trim()) {
//             updatedFields[fieldName] = trimmedValue;
//         }
//     }

//     if (Object.keys(updatedFields).length === 0) {
//         Snackbar("No changes were made to the profile.", 3000);
//         return;
//     }

//     showLoadingMessage("Updating...");

//     try {
//         const updateFormData = new FormData();
//         Object.entries(updatedFields).forEach(([key, value]) => updateFormData.append(key, value));

//         const updatedProfile = await apiFetch("/profile/edit", "PUT", updateFormData);
//         if (!updatedProfile) throw new Error("No response received for the profile update.");

//         const mergedProfile = { ...currentProfile, ...updatedProfile };
//         setState({ userProfile: mergedProfile }, true);

//         Snackbar("Profile updated successfully.", 3000);
//         renderPage();
//     } catch (error) {
//         console.error("Error updating profile:", error);
//         handleError("Error updating profile. Please try again.");
//     } finally {
//         removeLoadingMessage();
//     }
// }

// export { editProfile };

// // import { state } from '../../state/state.js';
// // import { apiFetch } from "../../api/api.js";
// // import { handleError } from "../../utils/utils.js";
// // import Snackbar from '../../components/ui/Snackbar.mjs';
// // import { renderPage, navigate } from "../../routes/index.js";
// // import { showLoadingMessage, removeLoadingMessage } from "./profileHelpers.js";
// // import { generateFormField } from "./generators.js";
// // import {deleteProfile} from "./userProfileService.js";


// // async function editProfile(content) {
// //     content.textContent = ""; // Clear existing content

// //     if (!getState("userProfile")) {
// //         Snackbar("Please log in to edit your profile.", 3000);
// //         return;
// //     }

// //     const { username, name, email, bio, phone_number } = getState("userProfile");

// //     content.innerHTML = `
// //         <h2>Edit Profile</h2>
// //         <form id="edit-profile-form" class="edit-profile-form">
// //             ${generateFormField("Username", "edit-username", "text", username)}
// //             ${generateFormField("Name", "edit-name", "text", name)}
// //             ${generateFormField("Email", "edit-email", "email", email)}
// //             ${generateFormField("Bio", "edit-bio", "textarea", bio || "")}
// //             ${generateFormField("Phone Number", "edit-phone", "text", phone_number || "")}
// //             <button type="button" id="update-profile-btn">Update Profile</button>
// //             <button type="button" id="cancel-profile-btn">Cancel</button>
// //         </form>
// //     `;

// //     document.getElementById("update-profile-btn").addEventListener("click", () => {
// //         const form = document.getElementById("edit-profile-form");
// //         updateProfile(new FormData(form));
// //     });

// //     document.getElementById("cancel-profile-btn").addEventListener("click", () => {
// //         Snackbar("Profile editing canceled.", 2000);
// //         navigate("/profile"); // Assuming a function to navigate back to the profile view
// //         window.location.pathname = window.location.pathname;
// //         // renderPage();
// //     });

// //     const deleteProfileButton = document.createElement("button");
// //     deleteProfileButton.className = "btn delete-btn";
// //     deleteProfileButton.dataset.action = "delete-profile";
// //     deleteProfileButton.textContent = "Delete Profile";
// //     content.appendChild(deleteProfileButton);
// //     deleteProfileButton.addEventListener("click", () => {
// //         deleteProfile();
// //     });
// // }


// // async function updateProfile(formData) {
// //     if (!getState("token")) {
// //         Snackbar("Please log in to update your profile.", 3000);
// //         return;
// //     }

// //     const currentProfile = getState("userProfile") || {};
// //     const updatedFields = {};

// //     for (const [key, value] of formData.entries()) {
// //         const fieldName = key.replace("edit-", "");
// //         const trimmedValue = value.trim();

// //         console.log(`Comparing: "${trimmedValue}" with "${currentProfile[fieldName] || ""}"`);
// //         if (trimmedValue !== (currentProfile[fieldName] || "").trim()) {
// //             updatedFields[fieldName] = trimmedValue;
// //         }
// //     }

// //     if (Object.keys(updatedFields).length === 0) {
// //         Snackbar("No changes were made to the profile.", 3000);
// //         return;
// //     }

// //     showLoadingMessage("Updating...");

// //     try {
// //         const updateFormData = new FormData();
// //         Object.entries(updatedFields).forEach(([key, value]) => updateFormData.append(key, value));

// //         const updatedProfile = await apiFetch("/profile/edit", "PUT", updateFormData);
// //         if (!updatedProfile) throw new Error("No response received for the profile update.");

// //         state.userProfile = { ...currentProfile, ...updatedProfile };
// //         localStorage.setItem("userProfile", JSON.stringify(getState("userProfile")));

// //         Snackbar("Profile updated successfully.", 3000);
// //         renderPage();
// //     } catch (error) {
// //         console.error("Error updating profile:", error);
// //         handleError("Error updating profile. Please try again.");
// //     } finally {
// //         removeLoadingMessage();
// //     }
// // }


// // export { editProfile };