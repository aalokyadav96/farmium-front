import { getState } from '../../state/state.js';
import { apiFetch } from "../../api/api.js";
import Notify from "../../components/ui/Notify.mjs";

/**
 * Generic toggle action for follow/subscribe actions
 */
async function toggleAction({ entityId, entityType, button, apiPath, labels, actionName }) {
    if (!getState("token")) {
        Notify("Please log in first.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    if (!button) {
        Notify("Action button not found.", { type: "info", duration: 3000, dismissible: true });
        return;
    }

    const isActive = button.dataset.active === "true";
    const action = isActive ? "DELETE" : "PUT";
    const apiEndpoint = `${apiPath}${entityId}`;

    const originalText = button.textContent;

    // Optimistically update UI
    button.disabled = true;
    button.textContent = isActive ? labels.off : labels.on;
    button.dataset.active = String(!isActive);

    try {
        const response = await apiFetch(apiEndpoint, action);
        button.disabled = false;

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        Notify(
            `You have ${!isActive ? actionName : `un${actionName}`} this ${entityType}.`,
            { type: "success", duration: 3000, dismissible: true }
        );
    } catch (error) {
        // Rollback on failure
        button.textContent = originalText;
        button.dataset.active = String(isActive);
        button.disabled = false;

        console.error(`Error toggling ${actionName}:`, error);
        Notify(`Failed to update ${actionName}: ${error.message}`, { type: "error", duration: 3000, dismissible: true });
    }
}

/**
 * Legacy wrapper for user follow button
 */
function toggleFollow(userId, followButton) {
    FollowUser(followButton, userId);
}

export { toggleFollow, toggleAction };

// import { setState, getState } from '../../state/state.js';
// import { apiFetch } from "../../api/api.js";
// // import { fetchProfile } from './fetchProfile.js';
// import Notify from "../../components/ui/Notify.mjs";

// async function toggleAction({ entityId, entityType, button, apiPath, labels, actionName }) {
//     if (!getState("token")) {
//         Notify("Please log in first.", { type: "warning", duration: 3000, dismissible: true });
//         return;
//     }

//     if (!button) {
//         Notify("Action button not found.", { type: "info", duration: 3000, dismissible: true });
//         return;
//     }

//     const isActive = button.dataset.active === "true";
//     const action = isActive ? "DELETE" : "PUT";
//     const apiEndpoint = `${apiPath}${entityId}`;

//     const originalText = button.textContent;
//     const wasActive = isActive;

//     // Optimistically update UI
//     button.disabled = true;
//     button.textContent = isActive ? labels.off : labels.on;
//     button.dataset.active = String(!isActive);

//     try {
//         const response = await apiFetch(apiEndpoint, action);
//         button.disabled = false;

//         if (!response.ok) {
//             throw new Error(`Server responded with ${response.status}`);
//         }

//         // // For user entity, refresh profile state
//         // if (entityType === "user") {
//         //     const updatedProfile = await fetchProfile();
//         //     setState({ userProfile: updatedProfile }, true);
//         // }

//         Notify(
//             `You have ${!wasActive ? actionName : `un${actionName}`} this ${entityType}.`,
//             { type: "success", duration: 3000, dismissible: true }
//         );
//     } catch (error) {
//         // Rollback on failure
//         button.textContent = originalText;
//         button.dataset.active = String(wasActive);
//         button.disabled = false;

//         console.error(`Error toggling ${actionName}:`, error);
//         Notify(`Failed to update ${actionName}: ${error.message}`, { type: "error", duration: 3000, dismissible: true });
//     }
// }

// // Legacy wrapper for compatibility
// function toggleFollow(userId, followButton) {
//     toggleAction({
//         entityId: userId,
//         entityType: "user",
//         button: followButton,
//         apiPath: "/follow/",
//         property: "isFollowing",
//         labels: { on: "Unfollow", off: "Follow" },
//         actionName: "followed"
//     });
// }

// export { toggleFollow, toggleAction };

// // import { getState } from "../../state/state.js";
// // import { apiFetch } from "../../api/api.js";
// // import Notify from "../../components/ui/Notify.mjs";

// // /**
// //  * Generic toggle action (follow/unfollow, subscribe/unsubscribe, etc.)
// //  *
// //  * @param {Object} options
// //  * @param {string} options.entityId - ID of the target entity
// //  * @param {string} [options.entityType] - Optional type (user, artist, etc.)
// //  * @param {HTMLElement} options.button - The toggle button
// //  * @param {Object} options.target - The object being toggled (user, artist, etc.)
// //  * @param {string} options.apiEndpoint - API path with :id placeholder (e.g., "/follows/:id")
// //  * @param {string} options.activeText - Button text when active (e.g., "Unfollow")
// //  * @param {string} options.inactiveText - Button text when inactive (e.g., "Follow")
// //  * @param {string} options.stateKey - Key in target to toggle (e.g., "isFollowing")
// //  * @param {string} options.successMessage - Message template, supports {action} and {username}
// //  */
// // export async function toggleAction({
// //   entityId,
// //   entityType,
// //   button,
// //   target,
// //   apiEndpoint,
// //   activeText,
// //   inactiveText,
// //   stateKey = "isFollowing",
// //   successMessage = "You have {action} {username}."
// // }) {
// //   if (!getState("token")) {
// //     Notify("Please log in to continue.", { type: "warning", duration: 3000, dismissible: true });
// //     return;
// //   }

// //   if (!button) {
// //     Notify("Action button not found.", { type: "error", duration: 3000, dismissible: true });
// //     return;
// //   }

// //   if (!target) {
// //     Notify("Target data is unavailable.", { type: "error", duration: 3000, dismissible: true });
// //     return;
// //   }

// //   const isActive = !!target[stateKey];
// //   const method = isActive ? "DELETE" : "PUT";
// //   const newState = !isActive;
// //   const originalText = button.textContent;

// //   // Optimistic UI update
// //   button.disabled = true;
// //   button.textContent = newState ? activeText : inactiveText;
// //   target[stateKey] = newState;

// //   try {
// //     const endpoint = apiEndpoint.replace(":id", entityId);
// //     const response = await apiFetch(endpoint, method);
// //     if (!response.ok) {
// //       throw new Error(`Server responded with ${response.status}`);
// //     }

// //     const action = newState
// //       ? activeText.toLowerCase()
// //       : inactiveText.toLowerCase();

// //     const username = target.username || target.name || "this entity";

// //     const message = successMessage
// //       .replace("{action}", action)
// //       .replace("{username}", username);

// //     Notify(message, { type: "success", duration: 3000, dismissible: true });
// //   } catch (err) {
// //     // Revert UI on failure
// //     target[stateKey] = isActive;
// //     button.textContent = originalText;
// //     button.disabled = false;

// //     console.error("Toggle action failed:", err);
// //     Notify(`Failed to update action: ${err.message}`, {
// //       type: "error",
// //       duration: 3000,
// //       dismissible: true
// //     });
// //   } finally {
// //     button.disabled = false;
// //   }
// // }

// // // import {  getState } from "../../state/state.js";
// // // import { apiFetch } from "../../api/api.js";
// // // import Notify from "../../components/ui/Notify.mjs";

// // // /**
// // //  * Generic toggle action (e.g., follow/unfollow, subscribe/unsubscribe)
// // //  *
// // //  * @param {Object} options
// // //  * @param {string} options.entityId - ID of the target entity (user, channel, etc.)
// // //  * @param {HTMLElement} options.button - The toggle button element
// // //  * @param {Object} options.targetObject - The object representing the user/channel/etc.
// // //  * @param {string} options.apiEndpoint - The API path (e.g., "/follows/", "/subscriptions/")
// // //  * @param {string} options.property - Boolean property to toggle (e.g., "isFollowing")
// // //  * @param {string} options.labels - Labels for states: { on: "Unfollow", off: "Follow" }
// // //  * @param {string} options.actionName - Action name for Snackbar message (e.g., "followed", "unfollowed")
// // //  */
// // // export async function toggleAction({
// // //     entityId,
// // //     button,
// // //     targetObject,
// // //     apiEndpoint,
// // //     property = "isFollowing",
// // //     labels = { on: "Unfollow", off: "Follow" },
// // //     actionName = "follow",
// // // }) {
// // //     if (!getState("token")) {
// // //         Notify("Please log in to continue.", {type:"warning",duration:3000, dismissible:true});
// // //         return;
// // //     }

// // //     if (!button) {
// // //         Notify("Action button not found.", {type:"error",duration:3000, dismissible:true});
// // //         return;
// // //     }

// // //     if (!targetObject) {
// // //         Notify("Target data is unavailable.", {type:"error",duration:3000, dismissible:true});
// // //         return;
// // //     }

// // //     const isCurrentlyOn = !!targetObject[property];
// // //     const method = isCurrentlyOn ? "DELETE" : "PUT";
// // //     const newState = !isCurrentlyOn;
// // //     const originalText = button.textContent;
// // //     const originalClass = button.className;

// // //     // Optimistic UI update
// // //     button.disabled = true;
// // //     button.textContent = newState ? labels.on : labels.off;
// // //     button.classList.toggle("active", newState);
// // //     targetObject[property] = newState;

// // //     try {
// // //         const response = await apiFetch(`${apiEndpoint}${entityId}`, method);
// // //         if (!response.ok) {
// // //             throw new Error(`Server responded with ${response.status}`);
// // //         }

// // //         // Optional: refresh profile after success
// // //         // setState({ userProfile: fetchProfile() }, true);

// // //         Notify(
// // //             `You have ${newState ? actionName : `un${actionName}`} ${targetObject.username || "the entity"}.`,
// // //             {type:"success",duration:3000, dismissible:true}
// // //         );
// // //     } catch (err) {
// // //         // Revert UI on failure
// // //         targetObject[property] = isCurrentlyOn;
// // //         button.textContent = originalText;
// // //         button.className = originalClass;
// // //         button.disabled = false;

// // //         console.error("Toggle action failed:", err);
// // //         Notify(`Failed to ${newState ? "" : "un"}${actionName}: ${err.message}`, {type:"error",duration:3000, dismissible:true});
// // //     } finally {
// // //         button.disabled = false;
// // //     }
// // // }


// // // /*

// // // ✅ Example Usage for Follow Button


// // // import { toggleAction } from "../path/to/toggleAction.js";

// // // const followBtn = document.getElementById("follow-btn");

// // // followBtn.addEventListener("click", () => {
// // //     toggleAction({
// // //         entityId: user.id,
// // //         button: followBtn,
// // //         targetObject: user,
// // //         apiEndpoint: "/follows/",
// // //         property: "isFollowing",
// // //         labels: { on: "Unfollow", off: "Follow" },
// // //         actionName: "followed",
// // //     });
// // // });



// // // ✅ Example Usage for Subscribe Button

// // // toggleAction({
// // //     entityId: channel.id,
// // //     button: subscribeBtn,
// // //     targetObject: channel,
// // //     apiEndpoint: "/subscriptions/",
// // //     property: "isSubscribed",
// // //     labels: { on: "Unsubscribe", off: "Subscribe" },
// // //     actionName: "subscribed",
// // // });


// // // */