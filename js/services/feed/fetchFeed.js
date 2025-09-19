import { apigFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { renderPost } from "./renderNewPost.js";

// export async function displayMediaFeed(container, entityType, entityID, isLoggedIn) {
//     const feedContainer = createElement("div",{class:"tumblr-layout"},[]);
//     container.appendChild(feedContainer);

//     try {
//         const response = await apigFetch(`/feed/media/${entityType}/${entityID}`);
//         if (!response.ok || !Array.isArray(response.data)) {
//             throw new Error("Invalid feed response");
//         }

//         const posts = response.data;
//         if (!posts.length) {
//             feedContainer.appendChild(
//                 createElement("p", {}, ["No posts available."])
//             );
//             return;
//         }

//         // Use renderPost directly
//         renderPost(posts, feedContainer);

//     } catch (err) {
//         feedContainer.appendChild(
//             createElement("p", {}, ["Error loading posts."])
//         );
//         console.error("Feed error:", err);
//     }
// }



export async function fetchFeed(container) {
    try {
        const posts = await loadFeedData();
        if (!posts.length) {
            container.appendChild(
                createElement("p", {}, ["No posts available."])
            );
            return;
        }
        renderPost(posts, container);

        // posts
        //     .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        //     .forEach((post, i) => renderNewPost(post, i, container));

    } catch (err) {
        container.appendChild(
            createElement("p", {}, ["Error loading posts."])
        );
        console.error("Feed error:", err);
    }
}


async function loadFeedData() {
    const response = await apigFetch("/feed/feed");

    if (!response.ok || !Array.isArray(response.data)) {
        throw new Error("Invalid feed response");
    }
    return response.data;
}
