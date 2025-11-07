import { apiFetch } from "../../../api/api.js";

/**
 * Fetch metadata for multiple posts in bulk.
 * Returns an object keyed by postId for fast lookup.
 */
export async function fetchBulkPostMetadata(postIds) {
    if (!Array.isArray(postIds) || postIds.length === 0) return {};

    try {
        const response = await apiFetch("/feed/feed/metadata", "POST", { ids: postIds });
        const data = Array.isArray(response) ? response : response.data || [];

        const metadataMap = {};
        for (const item of data) {
            metadataMap[item.postId] = item;
        }

        return metadataMap;
    } catch (err) {
        console.error("Failed to fetch post metadata", err);
        return {};
    }
}

// import { apiFetch } from "../../../api/api.js";

// export async function fetchBulkPostMetadata(postIds) {
//     if (!Array.isArray(postIds) || postIds.length === 0) return {};

//     try {
//         // Send POST request to backend with IDs
//         const response = await apiFetch("/feed/feed/metadata", "POST", { ids: postIds });

//         // Ensure we have an array of metadata objects
//         const data = Array.isArray(response) ? response : response.data || [];

//         // Convert array → map keyed by postId
//         const metadataMap = {};
//         for (const item of data) {
//             metadataMap[item.postId] = item;
//         }

//         return metadataMap;
//     } catch (err) {
//         console.error("Failed to fetch post metadata", err);
//         return {};
//     }
// }

// // import { apiFetch } from "../../../api/api.js";

// // export async function fetchBulkPostMetadata(postIds) {
// //     if (!Array.isArray(postIds) || postIds.length === 0) return [];

// //     try {
// //         const response = await apiFetch("/feed/feed/metadata", "POST", { ids: postIds });
// //         // Convert to map for easy lookup
// //         const metadataMap = {};
// //         for (const item of response) {
// //             metadataMap[item.postId] = item;
// //         }
// //         return metadataMap;
// //     } catch (err) {
// //         console.error("Failed to fetch post metadata", err);
// //         return {};
// //     }
// // }
