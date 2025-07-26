import { apiFetch } from "../../api/api.js";
import { renderNewPost } from "./renderNewPost.js";
import { createTabs } from "../../components/ui/createTabs.js";
import { createElement } from "../../components/createElement.js";
import { persistTabs } from "../../utils/persistTabs.js";

/**
 * Preferred tab order
 */
const preferredOrder = ["text", "image", "video", "audio", "blog"];

/**
 * Fetch feed data and create tabs based on post types dynamically, ordered by preference
 */
export async function setupFeedTabs(container) {
    const response = await apiFetch("/feed/feed");

    if (!response.ok || !Array.isArray(response.data)) {
        container.appendChild(createElement("p", {}, ["Error loading posts."]));
        return;
    }

    const posts = response.data;

    // Group posts by normalized type
    const grouped = new Map();

    posts.forEach(post => {
        const type = normalizePostType(post.type);
        if (!grouped.has(type)) grouped.set(type, []);
        grouped.get(type).push(post);
    });

    // Sort by preferred order first, then append any unknown types
    const sortedTypes = [
        ...preferredOrder.filter(type => grouped.has(type)),
        ...[...grouped.keys()].filter(type => !preferredOrder.includes(type))
    ];

    const tabs = sortedTypes.map(type => {
        const postsOfType = grouped.get(type);

        return {
            id: `${type}-tab`,
            title: capitalize(type),
            render: tabContent => {
                if (!postsOfType.length) {
                    tabContent.appendChild(createElement("p", {}, [`No ${type} posts.`]));
                    return;
                }

                postsOfType
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .forEach((post, i) => renderNewPost(post, i, tabContent));
            }
        };
    });

    persistTabs(container, tabs, `feed-tabs`);
    // const tabsElement = createTabs(tabs, "feedTabs");
    // container.appendChild(tabsElement);
}

/**
 * Normalize post types into known logical buckets
 */
function normalizePostType(type) {
    switch (type) {
        case "blog":
        case "image":
        case "video":
        case "audio":
        case "text":
            return type;
        default:
            return "text"; // fallback bucket for unknowns
    }
}

/**
 * Capitalize a string (for tab titles)
 */
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

export {setupFeedTabs as fetchFeed};


// import { apiFetch } from "../../api/api.js";
// import { renderNewPost } from "./renderNewPost.js";
// import { createTabs } from "../../components/ui/createTabs.js";
// import { createElement } from "../../components/createElement.js";

// /**
//  * Fetch feed data and create tabs based on post types dynamically
//  */
// export async function setupFeedTabs(container) {
//     const response = await apiFetch("/feed/feed");

//     if (!response.ok || !Array.isArray(response.data)) {
//         container.appendChild(createElement("p", {}, ["Error loading posts."]));
//         return;
//     }

//     const posts = response.data;

//     // Group posts by normalized type
//     const grouped = new Map();

//     posts.forEach(post => {
//         const type = normalizePostType(post.type);
//         if (!grouped.has(type)) grouped.set(type, []);
//         grouped.get(type).push(post);
//     });

//     // Sort post types alphabetically or leave as-is to keep backend order
//     const sortedTypes = [...grouped.keys()].sort();

//     const tabs = sortedTypes.map(type => {
//         const postsOfType = grouped.get(type);

//         return {
//             id: `${type}-tab`,
//             title: capitalize(type),
//             render: tabContent => {
//                 if (!postsOfType.length) {
//                     tabContent.appendChild(createElement("p", {}, [`No ${type} posts.`]));
//                     return;
//                 }

//                 postsOfType
//                     .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
//                     .forEach((post, i) => renderNewPost(post, i, tabContent));
//             }
//         };
//     });

//     const tabsElement = createTabs(tabs, "feedTabs");
//     container.appendChild(tabsElement);
// }

// /**
//  * Normalize post types into known logical buckets
//  */
// function normalizePostType(type) {
//     switch (type) {
//         case "blog":
//         case "image":
//         case "video":
//         case "audio":
//         case "text":
//             return type;
//         default:
//             return "text"; // fallback bucket for unknowns
//     }
// }

// /**
//  * Capitalize a string (for tab titles)
//  */
// function capitalize(str) {
//     return str[0].toUpperCase() + str.slice(1);
// }

// export {setupFeedTabs as fetchFeed};


// // import { apiFetch } from "../../api/api.js";
// // import { renderNewPost } from "./renderNewPost.js";
// // import { createTabs } from "../../components/ui/createTabs.js"; // assuming you placed it here
// // import { createElement } from "../../components/createElement.js";

// // const POST_TYPES = ["text", "image", "audio", "video", "blog"];

// // export async function setupFeedTabs(container) {
// //     const data = await apiFetch("/feed/feed");

// //     if (!data.ok || !Array.isArray(data.data)) {
// //         container.appendChild(createElement("p", {}, ["Error loading posts."]));
// //         return;
// //     }

// //     // Group posts by type
// //     const grouped = POST_TYPES.reduce((acc, type) => {
// //         acc[type] = [];
// //         return acc;
// //     }, {});

// //     data.data.forEach(post => {
// //         const type = normalizePostType(post.type);
// //         if (grouped[type]) grouped[type].push(post);
// //     });

// //     // Create tabs
// //     const tabs = POST_TYPES.map(type => ({
// //         id: `${type}-tab`,
// //         title: capitalize(type),
// //         render: tabContent => {
// //             const posts = grouped[type];
// //             if (!posts.length) {
// //                 tabContent.appendChild(createElement("p", {}, [`No ${type} posts.`]));
// //                 return;
// //             }

// //             posts
// //                 .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
// //                 .forEach((post, i) => renderNewPost(post, i, tabContent));
// //         }
// //     }));

// //     const tabsElement = createTabs(tabs, "feedTabs");
// //     container.appendChild(tabsElement);
// // }

// // // helper to normalize unknown post types
// // function normalizePostType(type) {
// //     switch (type) {
// //         case "blog": return "blog";
// //         case "image": return "image";
// //         case "video": return "video";
// //         case "audio": return "audio";
// //         case "text": return "text";
// //         default: return "text"; // fallback
// //     }
// // }

// // function capitalize(str) {
// //     return str[0].toUpperCase() + str.slice(1);
// // }

// // export {setupFeedTabs as fetchFeed};

// // // import { apiFetch } from "../../api/api.js";
// // // import { renderNewPost } from "./renderNewPost.js";



// // // // Function to fetch posts from the backend and render them
// // // async function fetchFeed() {
// // //     const postsContainer = document.getElementById("postsContainer");
// // //     postsContainer.innerHTML = '<p>Loading posts...</p>';

// // //     try {
// // //         const data = await apiFetch('/feed/feed');
// // //         if (!data.ok || !Array.isArray(data.data)) {
// // //             throw new Error("Invalid data received from the server");
// // //         }

// // //         // Sort posts by timestamp (latest first)
// // //         const sortedPosts = data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// // //         // Clear the container before rendering
// // //         postsContainer.innerHTML = '';

// // //         // Render each post in sorted order
// // //         sortedPosts.forEach(renderNewPost);
// // //     } catch (error) {
// // //         postsContainer.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
// // //     }
// // // }

// // // export {fetchFeed};