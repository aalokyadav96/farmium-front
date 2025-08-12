import { setState, getState } from '../../state/state.js';
import { apiFetch } from "../../api/api.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { fetchProfile } from './fetchProfile.js';
import Notify from "../../components/ui/Notify.mjs";

async function toggleFollow(userId, followButton, profile) {
    if (!getState("token")) {
        Snackbar("Please log in to follow users.", 3000);
        return;
    }

    if (!followButton) {
        Snackbar("Follow button not found.", 3000);
        return;
    }

    if (!profile) {
        console.warn("Profile object not provided.");
        Snackbar("Profile data is unavailable.", 3000);
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
        Snackbar(`Failed to update follow status: ${error.message}`, 3000);
        return;
    }

    Snackbar(
        `You have ${isFollowAction ? 'followed' : 'unfollowed'} ${profile.username || 'the user'}.`,
        3000
    );
}

export { toggleFollow };
