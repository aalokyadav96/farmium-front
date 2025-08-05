import { SRC_URL, getState, setState } from "../../state/state.js";
import Sightbox from "../../components/ui/SightBox.mjs";
import Modal from "../../components/ui/Modal.mjs";
import Snackbar from "../../components/ui/Snackbar.mjs";
import { apiFetch } from "../../api/api.js";
import { createForm } from "../../components/createForm.js";
import { handleError } from "../../utils/utils.js";

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getPicturePath(type, name) {
    if (!name) {
        return type === "banner"
            ? `${SRC_URL}/banner/default.webp`
            : `${SRC_URL}/default-profile.png`;
    }
    return type === "banner"
        ? `${SRC_URL}/banner/${name}`
        : `${SRC_URL}/${name}`;
}

function getThumbPath(entityId) {
    return `${SRC_URL}/thumb/${entityId || "thumb"}.jpg`;
}

function showLoadingMessage(message, target = document.body) {
    const loadingMsg = document.createElement("p");
    loadingMsg.id = "loading-msg";
    loadingMsg.textContent = message;
    target.appendChild(loadingMsg);
}

function removeLoadingMessage() {
    const loadingMsg = document.getElementById("loading-msg");
    if (loadingMsg) loadingMsg.remove();
}

function previewPicture(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = () => {
            preview.src = reader.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
}

async function updateEntityPicture({ entityType, entityId, type, previewId, onSuccess = () => {} }) {
    if (!getState("token")) {
        Snackbar(`Please log in to update ${type} picture.`, 3000);
        return;
    }

    const inputId = `edit-${type}-picture-${entityType}-${entityId}`;
    const fileInput = document.getElementById(inputId);
    if (!fileInput || !fileInput.files[0]) {
        Snackbar(`No ${type} picture selected.`, 3000);
        return;
    }

    showLoadingMessage(`Updating ${type} picture...`);

    try {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        const updatedData = await apiFetch(`/${entityType}/${entityId}/${type}`, "PUT", formData);
        if (!updatedData) throw new Error(`No response received for ${type} picture update.`);

        const currentProfile = getState("userProfile") || {};
        setState({ userProfile: { ...currentProfile, ...updatedData } }, true);

        Snackbar(`${capitalize(type)} picture updated successfully.`, 3000);
        onSuccess();
    } catch (error) {
        console.error(`Error updating ${type} picture:`, error);
        handleError(`Error updating ${type} picture. Please try again.`);
    } finally {
        removeLoadingMessage();
    }
}

function generatePictureForm({ entityType, entityId, type, currentPic, onSuccess }) {
    const inputId = `edit-${type}-picture-${entityType}-${entityId}`;
    const previewId = `preview-${type}-${entityType}-${entityId}`;
    const pictureSrc = getPicturePath(type, currentPic);

    const fields = [
        {
            label: `${capitalize(type)} Picture`,
            id: inputId,
            currentSrc: pictureSrc,
            previewId,
            events: {
                change: (e) => previewPicture(e, previewId),
            },
        },
    ];

    const form = createForm(
        document.createElement("div"),
        fields,
        `edit-${type}-form-${entityType}-${entityId}`,
        `update-${type}-btn-${entityType}-${entityId}`,
        `Update ${capitalize(type)} Picture`,
        () => updateEntityPicture({ entityType, entityId, type, previewId, onSuccess })
    );

    return form;
}

function createEditButton(type, onClick) {
    const btn = document.createElement("button");
    btn.className = type === "banner" ? "edit-banner-pic" : "edit-profile-pic";
    btn.textContent = type === "banner" ? "B" : "P";
    btn.addEventListener("click", onClick);
    return btn;
}

function createPictureComponent({ entityType, entityId, type, pictureName, ownerId, editable, onUpdate = () => {} }) {
    const container = document.createElement("div");
    const wrapper = document.createElement("span");
    wrapper.style.position = "relative";

    const fullImageSrc = getPicturePath(type, pictureName);
    const thumbSrc = getThumbPath(entityId);

    const pictureElement = type === "banner" ? document.createElement("span") : document.createElement("div");
    pictureElement.className = type === "banner" ? "bg_img" : "thumb";

    if (type === "banner") {
        pictureElement.style.backgroundImage = `url(${fullImageSrc})`;
    } else {
        const img = document.createElement("img");
        img.src = thumbSrc;
        img.alt = `${capitalize(type)} Picture`;
        img.loading = "lazy";
        img.className = "imgful";
        pictureElement.appendChild(img);
    }

    pictureElement.addEventListener("click", () => Sightbox(fullImageSrc, "image"));
    wrapper.appendChild(pictureElement);

    const currentUserId = getState("user");
    const canEdit = editable ?? ownerId === currentUserId;

    if (canEdit) {
        const editBtn = createEditButton(type, () => {
            const content = generatePictureForm({
                entityType,
                entityId,
                type,
                currentPic: pictureName,
                onSuccess: onUpdate
            });

            const modal = Modal({
                title: `Edit ${capitalize(type)} Picture`,
                content,
                onClose: () => modal.remove(),
            });
        });
        wrapper.appendChild(editBtn);
    }

    container.appendChild(wrapper);
    return container;
}

export { createPictureComponent };

// import { SRC_URL, getState, setState } from "../../state/state.js";
// import Sightbox from "../../components/ui/SightBox.mjs";
// import Modal from "../../components/ui/Modal.mjs";
// import Snackbar from "../../components/ui/Snackbar.mjs";
// import { apiFetch } from "../../api/api.js";
// import { createForm } from "../../components/createForm.js";
// import { handleError } from "../../utils/utils.js";

// function capitalize(string) {
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

// function showLoadingMessage(message) {
//     const loadingMsg = document.createElement("p");
//     loadingMsg.id = "loading-msg";
//     loadingMsg.textContent = message;
//     document.getElementById("content").appendChild(loadingMsg);
// }

// function removeLoadingMessage() {
//     const loadingMsg = document.getElementById("loading-msg");
//     if (loadingMsg) loadingMsg.remove();
// }

// function previewPicture(event) {
//     const file = event.target.files[0];
//     const preview = document.getElementById("picture-preview");
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = () => {
//             preview.src = reader.result;
//             preview.style.display = "block";
//         };
//         reader.readAsDataURL(file);
//     }
// }

// async function updateEntityPicture({ entityType, entityId, type }) {
//     if (!getState("token")) {
//         Snackbar(`Please log in to update ${type} picture.`, 3000);
//         return;
//     }

//     const fileInput = document.getElementById(`edit-${type}-picture`);
//     if (!fileInput || !fileInput.files[0]) {
//         Snackbar(`No ${type} picture selected.`, 3000);
//         return;
//     }

//     showLoadingMessage(`Updating ${type} picture...`);

//     try {
//         const formData = new FormData();
//         formData.append("file", fileInput.files[0]);

//         const updatedData = await apiFetch(`/${entityType}/${entityId}/${type}`, "PUT", formData);
//         if (!updatedData) throw new Error(`No response received for ${type} picture update.`);

//         const currentProfile = getState("userProfile") || {};
//         setState({ userProfile: { ...currentProfile, ...updatedData } }, true);

//         Snackbar(`${capitalize(type)} picture updated successfully.`, 3000);
//         window.location.pathname = window.location.pathname;
//     } catch (error) {
//         console.error(`Error updating ${type} picture:`, error);
//         handleError(`Error updating ${type} picture. Please try again.`);
//     } finally {
//         removeLoadingMessage();
//     }
// }

// function generatePictureForm({ entityType, entityId, type, currentPic }) {
//     const pictureSrc =
//         type === "banner"
//             ? `${SRC_URL}/banner/${currentPic || "default.webp"}`
//             : `${SRC_URL}/${currentPic || "default-profile.png"}`;

//     const fields = [
//         {
//             label: `${capitalize(type)} Picture`,
//             id: `edit-${type}-picture`,
//             currentSrc: pictureSrc,
//             previewId: "picture-preview",
//         },
//     ];

//     return createForm(
//         document.createElement("div"),
//         fields,
//         `edit-${type}-form`,
//         `update-${type}-btn`,
//         `Update ${capitalize(type)} Picture`,
//         () => updateEntityPicture({ entityType, entityId, type })
//     );
// }

// function createPictureComponent({ entityType, entityId, type, pictureName, ownerId }) {
//     const container = document.createElement("div");
// console.log(entityType, entityId, type, pictureName, ownerId);
//     const wrapper = document.createElement("span");
//     wrapper.style.position = "relative";

//     const src =
//         type === "banner"
//             ? `${SRC_URL}/banner/${pictureName || "default.webp"}`
//             : `${SRC_URL}/thumb/${entityId || "thumb"}.jpg`;

//     const fullImageSrc =
//         type === "banner"
//             ? `${SRC_URL}/banner/${pictureName || "default.webp"}`
//             : `${SRC_URL}/${pictureName || "default-profile.png"}`;

//     const pictureElement =
//         type === "banner"
//             ? document.createElement("span")
//             : document.createElement("div");

//     pictureElement.className = type === "banner" ? "bg_img" : "thumb";

//     if (type === "banner") {
//         pictureElement.style.backgroundImage = `url(${src})`;
//     } else {
//         const img = document.createElement("img");
//         img.src = src;
//         img.alt = `${capitalize(type)} Picture`;
//         img.loading = "lazy";
//         img.className = "imgful";
//         pictureElement.appendChild(img);
//     }

//     pictureElement.addEventListener("click", () => Sightbox(fullImageSrc, "image"));
//     wrapper.appendChild(pictureElement);

//     if (ownerId === getState("user")) {
//         const editBtn = document.createElement("button");
//         editBtn.className = type === "banner" ? "edit-banner-pic" : "edit-profile-pic";
//         editBtn.textContent = type === "banner" ? "B" : "P";
//         editBtn.addEventListener("click", () => {
//             const content = generatePictureForm({
//                 entityType,
//                 entityId,
//                 type,
//                 currentPic: pictureName,
//             });

//             const modal = Modal({
//                 title: `Edit ${capitalize(type)} Picture`,
//                 content,
//                 onClose: () => modal.remove(),
//             });
//         });
//         wrapper.appendChild(editBtn);
//     }

//     container.appendChild(wrapper);
//     return container;
// }

// export { createPictureComponent };


// // import { SRC_URL, getState, setState  } from "../../state/state.js";
// // import Sightbox from "../../components/ui/SightBox.mjs";
// // import Modal from "../../components/ui/Modal.mjs";
// // import { apiFetch } from "../../api/api.js";
// // import { handleError } from "../../utils/utils.js";
// // import Snackbar from '../../components/ui/Snackbar.mjs';
// // import { createForm } from "../../components/createForm.js"; 

// // // Utility function to format dates
// // function showLoadingMessage(message) {
// //     const loadingMsg = document.createElement("p");
// //     loadingMsg.id = "loading-msg";
// //     loadingMsg.textContent = message;
// //     document.getElementById("content").appendChild(loadingMsg);
// // }

// // function removeLoadingMessage() {
// //     const loadingMsg = document.getElementById("loading-msg");
// //     if (loadingMsg) loadingMsg.remove();
// // }

// // function capitalize(string) {
// //     return string.charAt(0).toUpperCase() + string.slice(1);
// // }

// // // Preview picture
// // function previewPicture(event) {
// //     const file = event.target.files[0];
// //     const preview = document.getElementById("picture-preview");

// //     if (file) {
// //         const reader = new FileReader();
// //         reader.onload = () => {
// //             preview.src = reader.result;
// //             preview.style.display = 'block';
// //         };
// //         reader.readAsDataURL(file);
// //     }
// // }


// // async function updatePicture(type) {
// //     if (!getState("token")) {
// //         Snackbar(`Please log in to update your ${type} picture.`, 3000);
// //         return;
// //     }

// //     const fileInput = document.getElementById(`edit-${type}-picture`);
// //     if (!fileInput || !fileInput.files[0]) {
// //         Snackbar(`No ${type} picture selected.`, 3000);
// //         return;
// //     }

// //     showLoadingMessage(`Updating ${type} picture...`);

// //     try {
// //         const formData = new FormData();
// //         formData.append(`${type}_picture`, fileInput.files[0]);

// //         const updatedProfile = await apiFetch(`/profile/${type}`, 'PUT', formData);
// //         if (!updatedProfile) throw new Error(`No response received for ${type} picture update.`);

// //         const currentProfile = getState("userProfile") || {};
// //         setState({ userProfile: { ...currentProfile, ...updatedProfile } }, true);

// //         Snackbar(`${capitalize(type)} picture updated successfully.`, 3000);
// //         window.location.pathname = window.location.pathname;
// //     } catch (error) {
// //         console.error(`Error updating ${type} picture:`, error);
// //         handleError(`Error updating ${type} picture. Please try again.`);
// //     } finally {
// //         removeLoadingMessage();
// //     }
// // }


// // function generateBannerForm(content, pic) {
// //     const bannerPictureSrc = `${SRC_URL}/banner/${pic}`;
// //     const fields = [
// //         {
// //             label: "Banner Picture",
// //             id: "edit-banner-picture",
// //             currentSrc: bannerPictureSrc,
// //             previewId: "banner-picture-preview",
// //         },
// //     ];
// //     return createForm(content, fields, "edit-banner-form", "update-banner-pics-btn", "Update Banner Pics", () => {
// //         const formData = new FormData(document.getElementById("edit-banner-form"));
// //         updateProfilePics('banner', formData);
// //     });
// // }

// // function generateAvatarForm(content, pic) {
// //     const profilePictureSrc = `${SRC_URL}/${pic}`;
// //     const fields = [
// //         {
// //             label: "Profile Picture",
// //             id: "edit-avatar-picture",
// //             currentSrc: profilePictureSrc,
// //             previewId: "profile-picture-preview",
// //         },
// //     ];
// //     return createForm(content, fields, "edit-avatar-form", "update-avatar-pics-btn", "Update Profile Pics", () => {
// //         const formData = new FormData(document.getElementById("edit-avatar-form"));
// //         updateProfilePics('avatar', formData);
// //     });
// // }

// // async function updateProfilePics(type) {
// //     await updatePicture(type);
// // }

// // /* Creates the banner image */
// // function createBanner(profile) {
// //     const bgImg = document.createElement("span");
// //     bgImg.className = "bg_img";

// //     const banncon = document.createElement("span");
// //     banncon.style.position = "relative";

// //     // Use user's banner picture if available; otherwise, use default banner
// //     const bannerPicture = profile.banner_picture
// //         ? `${SRC_URL}/banner/${profile.banner_picture}`
// //         : `${SRC_URL}/banner/default.webp`;

// //     bgImg.style.backgroundImage = `url(${bannerPicture})`;
// //     bgImg.addEventListener("click", () => Sightbox(bannerPicture, "image"));

// //     banncon.appendChild(createBannerEditButton(profile));
// //     banncon.appendChild(bgImg);

// //     return banncon;
// // }


// // function createBannerEditButton(profile) {
// //     if (profile.userid !== getState("user")) return document.createDocumentFragment();

// //     const editButton = document.createElement("button");
// //     editButton.className = "edit-banner-pic";
// //     editButton.textContent = "B";
// //     editButton.addEventListener("click", () => {
// //         const content = document.createElement("div");
// //         const contentx = document.createElement("div");
// //         content.appendChild(generateBannerForm(contentx, profile.banner_picture));

// //         const modal = Modal({
// //             title: "Edit Banner",
// //             content,
// //             onClose: () => modal.remove(),
// //         });
// //     });

// //     return editButton;
// // }

// // /* Creates the profile picture area */
// // function createProfilePicture(profile) {
// //     const profileArea = document.createElement("div");
// //     profileArea.className = "profile_area";

// //     const thumb = document.createElement("span");
// //     thumb.className = "thumb";

// //     // Use default profile picture if none is available
// //     const profilexPic = profile.profile_picture ? `${SRC_URL}/${profile.profile_picture}` : `${SRC_URL}/default-profile.png`;

// //     const profilePic = profile.userid
// //         ? `${SRC_URL}/thumb/${profile.userid}.jpg`
// //         : `${SRC_URL}/thumb/thumb.jpg`;

// //     const img = document.createElement("img");
// //     img.src = profilePic;
// //     img.loading = "lazy";
// //     img.alt = "Profile Picture";
// //     img.className = "imgful";
// //     thumb.appendChild(img);

// //     // Add click event to open full image if available
// //     if (profile.profile_picture) {
// //         thumb.addEventListener("click", () => Sightbox(profilexPic, "image"));
// //     }

// //     profileArea.appendChild(thumb);

// //     // Add Edit Profile Pic button if user owns the profile
// //     if (profile.userid === getState("user")) {
// //         const editProfileButton = document.createElement("button");
// //         editProfileButton.className = "edit-profile-pic";
// //         editProfileButton.textContent = "P";
// //         editProfileButton.addEventListener("click", () => {
// //             const content = document.createElement("div");
// //             const contentx = document.createElement("div");
// //             content.id = "hfgfy";
// //             contentx.id = "g54365";
// //             content.appendChild(generateAvatarForm(contentx, profile.profile_picture || "default-profile.png"));

// //             const modal = Modal({
// //                 title: "Edit Profile Picture",
// //                 content,
// //                 onClose: () => modal.remove(),
// //             });
// //         });
// //         profileArea.appendChild(editProfileButton);

// //     }

// //     return profileArea;
// // }



// // export { createBanner, createBannerEditButton, createProfilePicture };
