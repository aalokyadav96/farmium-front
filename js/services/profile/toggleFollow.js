import { setState, getState } from '../../state/state.js';
import { apiFetch } from "../../api/api.js";
import { fetchProfile } from './fetchProfile.js';
import Notify from "../../components/ui/Notify.mjs";

async function toggleAction({ entityId, entityType, button, apiPath, property, labels, actionName }) {
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
    const wasActive = isActive;

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

        // For user entity, refresh profile state
        if (entityType === "user") {
            const updatedProfile = await fetchProfile();
            setState({ userProfile: updatedProfile }, true);
        }

        Notify(
            `You have ${!wasActive ? actionName : `un${actionName}`} this ${entityType}.`,
            { type: "success", duration: 3000, dismissible: true }
        );
    } catch (error) {
        // Rollback on failure
        button.textContent = originalText;
        button.dataset.active = String(wasActive);
        button.disabled = false;

        console.error(`Error toggling ${actionName}:`, error);
        Notify(`Failed to update ${actionName}: ${error.message}`, { type: "error", duration: 3000, dismissible: true });
    }
}

// Legacy wrapper for compatibility
function toggleFollow(userId, followButton) {
    toggleAction({
        entityId: userId,
        entityType: "user",
        button: followButton,
        apiPath: "/follow/",
        property: "isFollowing",
        labels: { on: "Unfollow", off: "Follow" },
        actionName: "followed"
    });
}

export { toggleFollow, toggleAction };

// import { setState, getState } from '../../state/state.js';
// import { apiFetch } from "../../api/api.js";
// import { fetchProfile } from './fetchProfile.js';
// import Notify from "../../components/ui/Notify.mjs";

// async function toggleAction({ entityId, button, targetObject, apiPath, property, labels, actionName }) {
//     if (!getState("token")) {
//         Notify("Please log in first.", {type:"warning",duration:3000, dismissible:true});
//         return;
//     }

//     if (!button) {
//         Notify("Action button not found.", {type:"info",duration:3000, dismissible:true});
//         return;
//     }

//     if (!targetObject) {
//         console.warn("Target object not provided.");
//         Notify("Target data is unavailable.", {type:"error",duration:3000, dismissible:true});
//         return;
//     }

//     const isActive = !!targetObject[property];
//     const action = isActive ? "DELETE" : "PUT";
//     const apiEndpoint = `${apiPath}${entityId}`;

//     const originalText = button.textContent;
//     const wasActive = isActive;

//     // Optimistically update UI
//     button.disabled = true;
//     button.textContent = isActive ? labels.off : labels.on;
//     targetObject[property] = !isActive;

//     try {
//         const response = await apiFetch(apiEndpoint, action);
//         button.disabled = false;

//         if (!response.ok) {
//             throw new Error(`Server responded with ${response.status}`);
//         }

//         // Update state after success
//         const updatedProfile = await fetchProfile();
//         setState({ userProfile: updatedProfile }, true);

//         Notify(
//             `You have ${!wasActive ? actionName : `un${actionName}`} ${targetObject.username || "the user"}.`,
//             {type:"success",duration:3000, dismissible:true}
//         );
//     } catch (error) {
//         // Rollback on failure
//         button.textContent = originalText;
//         targetObject[property] = wasActive;
//         button.disabled = false;

//         console.error(`Error toggling ${actionName}:`, error);
//         Notify(`Failed to update ${actionName}: ${error.message}`, {type:"error",duration:3000, dismissible:true});
//     }
// }

// function toggleFollow(userId, followButton, profile) {
//     toggleAction({
//         entityId: userId,
//         button: followButton,
//         targetObject: profile,
//         apiPath: "/follows/",
//         property: "is_following",
//         labels: { on: "Unfollow", off: "Follow" },
//         actionName: "followed"
//     });
// }



// export { toggleFollow, toggleAction };

// // import { setState, getState } from '../../state/state.js';
// // import { apiFetch } from "../../api/api.js";
// // import { fetchProfile } from './fetchProfile.js';
// // import Notify from "../../components/ui/Notify.mjs";

// // async function toggleFollow(userId, followButton, profile) {
// //     if (!getState("token")) {
// //         Notify("Please log in to follow users.", {type:"warning",duration:3000, dismissible:true});
// //         return;
// //     }

// //     if (!followButton) {
// //         Notify("Follow button not found.", {type:"info",duration:3000, dismissible:true});
// //         return;
// //     }

// //     if (!profile) {
// //         console.warn("Profile object not provided.");
// //         Notify("Profile data is unavailable.", {type:"error",duration:3000, dismissible:true});
// //         return;
// //     }

// //     const action = followButton.textContent === 'Follow' ? 'PUT' : 'DELETE';
// //     const apiEndpoint = `/follows/${userId}`;

// //     const originalText = followButton.textContent;
// //     const originalClass = followButton.className;
// //     const isFollowAction = action === 'PUT';

// //     // Optimistically update the UI
// //     followButton.disabled = true;
// //     followButton.textContent = isFollowAction ? 'Unfollow' : 'Follow';
// //     followButton.classList.toggle('following', isFollowAction);
// //     profile.isFollowing = isFollowAction;

// //     try {
// //         const response = await apiFetch(apiEndpoint, action);
// //         followButton.disabled = false;

// //         if (!response.ok) {
// //             throw new Error(`Server responded with ${response.status}`);
// //         }

// //         // After successful follow/unfollow, update user profile in state
// //         const updatedProfile = await fetchProfile();
// //         setState({ userProfile: updatedProfile }, true);
// //     } catch (error) {
// //         // Revert UI changes on failure
// //         followButton.textContent = originalText;
// //         followButton.className = originalClass;
// //         profile.isFollowing = !isFollowAction;

// //         followButton.disabled = false;
// //         console.error("Error toggling follow status:", error);
// //         Notify(`Failed to update follow status: ${error.message}`, {type:"error",duration:3000, dismissible:true});
// //         return;
// //     }

// //     Notify(
// //         `You have ${isFollowAction ? 'followed' : 'unfollowed'} ${profile.username || 'the user'}.`,
// //         {type:"success",duration:3000, dismissible:true}
// //     );
// // }

// // export { toggleFollow };
