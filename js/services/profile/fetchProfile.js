// import { API_URL, getState, setState } from "../../state/state.js";
// import { apiFetch } from "../../api/api.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';

// Fetch the profile either from localStorage or via an API request
// async function fetchProfile(isLoggedIn) {
//     if (isLoggedIn) {
//         try {
//             const response = await fetch(`${API_URL}/profile/profile`, {
//                 method: "GET",
//                 headers: {
//                     "Authorization": `Bearer ${getState("token")}`,
//                 },
//             });

//             if (response.ok) {
//                 const profile = await response.json();
//                 setState({ userProfile: profile }, true); // Use setState with persist
//                 return profile;
//             } else {
//                 const errorData = await response.json();
//                 console.error(`Error fetching profile: ${response.status} - ${response.statusText}`, errorData);
//                 Snackbar(`Error fetching profile: ${errorData.error || 'Unknown error'}`, 3000);
//             }
//         } catch (error) {
//             console.error("Error fetching profile:", error);
//             Snackbar("An unexpected error occurred while fetching the profile.", 3000);
//         }
//     } else {
//         // Clear profile state if not logged in
//         setState({ userProfile: null }, true);
//     }

//     return null;
// }
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

// import { API_URL, getState, state } from "../../state/state.js";
// import { apiFetch } from "../../api/api.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';

// // Fetch the profile either from localStorage or via an API request
// async function fetchProfile(isLoggedIn) {
//     // // Try to get the profile from localStorage first
//     // const cachedProfile = localStorage.getItem("userProfile");

//     // // If cached profile is found, use it
//     // if (cachedProfile) {
//     //     state.userProfile = JSON.parse(cachedProfile);
//     //     return state.userProfile; // Return cached profile
//     // }

//     // If there is no cached profile, fetch from the API
//     if (isLoggedIn) {
//         try {
//             const response = await fetch(`${API_URL}/profile/profile`, {
//                 method: "GET",
//                 headers: {
//                     "Authorization": `Bearer ${getState("token")}`,
//                 },
//             });

//             // Check if the response is OK
//             if (response.ok) {
//                 const profile = await response.json();
//                 state.userProfile = profile;
//                 localStorage.setItem("userProfile", JSON.stringify(profile)); // Cache the profile in localStorage
//                 return profile; // Return the fetched profile
//             } else {
//                 const errorData = await response.json();
//                 console.error(`Error fetching profile: ${response.status} - ${response.statusText}`, errorData);

//                 Snackbar(`Error fetching profile: ${errorData.error || 'Unknown error'}`, 3000);
//             }
//         } catch (error) {
//             console.error("Error fetching profile:", error);

//             Snackbar("An unexpected error occurred while fetching the profile.", 3000);
//         }
//     } else {
//         // If no token exists, assume user is not logged in and clear the profile
//         state.userProfile = null;
//     }

//     return null; // Return null if no profile found
// }


// // Fetch the user profile
// async function fetchUserProfile(username) {
//     try {
//         const data = await apiFetch(`/user/${username}`);
//         return data?.is_following !== undefined ? data : null;
//     } catch (error) {
//         console.error("Error fetching user profile:", error);
//         return null;
//     }
// }



// // Fetch user profile data for a specific entity type
// async function fetchUserProfileData(username, entityType) {
//     try {
//         const response = await apiFetch(`/user/${username}/data?entity_type=${entityType}`);
//         return response; // Assuming response is JSON
//     } catch (error) {
//         console.error(`Error fetching ${entityType} data for user:`, error);
//         throw error;
//     }
// }


// export {fetchProfile, fetchUserProfile, fetchUserProfileData};