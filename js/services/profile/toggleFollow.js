import { setState, getState } from '../../state/state.js';
import { apiFetch } from "../../api/api.js";
import { fetchProfile } from './fetchProfile.js';
import Notify from "../../components/ui/Notify.mjs";

async function toggleFollow(userId, followButton, profile) {
    if (!getState("token")) {
        Notify("Please log in to follow users.", {type:"warning",duration:3000, dismissible:true});
        return;
    }

    if (!followButton) {
        Notify("Follow button not found.", {type:"info",duration:3000, dismissible:true});
        return;
    }

    if (!profile) {
        console.warn("Profile object not provided.");
        Notify("Profile data is unavailable.", {type:"error",duration:3000, dismissible:true});
        return;
    }

    const action = followButton.textContent === 'Follow' ? 'PUT' : 'DELETE';
    const apiEndpoint = `/follows/${userId}`;

    const originalText = followButton.textContent;
    const originalClass = followButton.className;
    const isFollowAction = action === 'PUT';

    // Optimistically update the UI
    followButton.disabled = true;
    followButton.textContent = isFollowAction ? 'Unfollow' : 'Follow';
    followButton.classList.toggle('following', isFollowAction);
    profile.isFollowing = isFollowAction;

    try {
        const response = await apiFetch(apiEndpoint, action);
        followButton.disabled = false;

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        // After successful follow/unfollow, update user profile in state
        const updatedProfile = await fetchProfile();
        setState({ userProfile: updatedProfile }, true);
    } catch (error) {
        // Revert UI changes on failure
        followButton.textContent = originalText;
        followButton.className = originalClass;
        profile.isFollowing = !isFollowAction;

        followButton.disabled = false;
        console.error("Error toggling follow status:", error);
        Notify(`Failed to update follow status: ${error.message}`, {type:"error",duration:3000, dismissible:true});
        return;
    }

    Notify(
        `You have ${isFollowAction ? 'followed' : 'unfollowed'} ${profile.username || 'the user'}.`,
        {type:"success",duration:3000, dismissible:true}
    );
}

export { toggleFollow };
