import { fetchUserProfileData } from "./fetchProfile.js";
import { renderEntityData } from "./entityRenderer.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import Notify from "../../components/ui/Notify.mjs";

/** Fetch and render data only when the tab is first opened. */
async function renderTabContent(container, username, entityType) {
    try {
        container.textContent = "Loading...";
        const data = await fetchUserProfileData(username, entityType);
        renderEntityData(container, data, entityType);
    } catch (error) {
        console.error(`Error fetching data for ${entityType}:`, error);
        Snackbar(`Failed to load ${entityType} data. Please try again.`, 3000);
        container.textContent = "Error loading data.";
    }
}

export { renderTabContent };
