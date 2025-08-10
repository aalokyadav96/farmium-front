import { apiFetch } from "../../api/api";
import Notify from "../../components/ui/Notify.mjs";

/**
 * Fetch paginated places with optional filters.
 *
 * @param {number} page - Current page (starting from 1)
 * @param {number} limit - Items per page
 * @param {Object} [queryParams={}] - Optional query params to append
 * @returns {Promise<Array|null>}
 */
async function fetchPlaces(page = 1, limit = 20, queryParams = {}) {
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Build query string
    const params = new URLSearchParams({ page, limit, ...queryParams });

    try {
        const places = await apiFetch(`/places/places?${params.toString()}`, "GET", null, { signal });
        return Array.isArray(places) ? places : [];
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Fetch aborted");
            return null;
        }
        console.error("Error fetching places:", error);
        Notify(`Error fetching places: ${error.message || 'Unknown error'}`, {type: "warning", duration: 3000, dismissible: true});
        return null;
    }
}

export { fetchPlaces };

// import { apiFetch } from "../../api/api";

// let abortController; // Keep this scoped to the function if it’s needed only for `fetchEvents`

// async function fetchPlaces() {
//     // Abort the previous fetch if it's still ongoing
//     if (abortController) {
//         abortController.abort();
//     }

//     abortController = new AbortController(); // Create a new instance
//     const signal = abortController.signal; // Get the signal to pass to apiFetch

//     try {
//         // Use apiFetch with the 'GET' method and pass the signal for aborting
//         const places = await apiFetch('/places/places', 'GET', null, { signal });
//         return places;
//     } catch (error) {
//         // If error is due to abort, return null
//         if (error.name === 'AbortError') {
//             console.log('Fetch aborted');
//             return null;
//         }
//         console.error(error);

//         Snackbar(`Error fetching places: ${error.message || 'Unknown error'}`, 3000);
//         return null; // Return null for other errors
//     }
// }

// export {fetchPlaces};