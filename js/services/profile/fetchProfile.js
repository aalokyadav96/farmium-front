import { API_URL, getState, setState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import Notify from "../../components/ui/Notify.mjs";

async function fetchProfile() {
    const token = getState("token");
    if (token) {
        try {
            const response = await fetch(`${API_URL}/profile/profile`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const profile = await response.json();
                setState({ userProfile: profile }, true); // persist in localStorage
                return profile;
            } else {
                const errorData = await response.json();
                console.error(`Error fetching profile: ${response.status} - ${response.statusText}`, errorData);
                Snackbar(`Error fetching profile: ${errorData.error || 'Unknown error'}`, 3000);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            Snackbar("An unexpected error occurred while fetching the profile.", 3000);
        }
    } else {
        setState({ userProfile: null }, true);
    }

    return null;
}


// Fetch the user profile by username
async function fetchUserProfile(username) {
    try {
        const data = await apiFetch(`/user/${username}`);
        return data?.is_following !== undefined ? data : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}


// Fetch user-specific data for a given entity type
async function fetchUserProfileData(username, entityType) {
    try {
        const response = await apiFetch(`/user/${username}/data?entity_type=${entityType}`);
        return response;
    } catch (error) {
        console.error(`Error fetching ${entityType} data for user:`, error);
        throw error;
    }
}


export { fetchProfile, fetchUserProfile, fetchUserProfileData };
