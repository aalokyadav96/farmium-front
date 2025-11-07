import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { renderPost } from "./renders/renderPost.js";
import { fetchBulkPostMetadata } from "./renders/bulkMeta.js";

export async function fetchFeed(container) {
    try {
        const posts = await loadFeedData();
        if (!posts.length) {
            container.appendChild(createElement("p", {}, ["No posts available."]));
            return;
        }

        const postIds = posts.map(p => p.postid);

        // Fetch metadata in bulk, returned as map keyed by postId
        const postmetadata = await fetchBulkPostMetadata(postIds);

        // Render all posts with metadata
        await renderPost(posts, container, postmetadata);

    } catch (err) {
        console.error("Feed error:", err);
        container.appendChild(createElement("p", {}, ["Error loading posts."]));
    }
}

async function loadFeedData() {
    const response = await apiFetch("/feed/feed");
    if (!response.ok || !Array.isArray(response.data)) {
        throw new Error("Invalid feed response");
    }
    return response.data;
}

// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { renderPost } from "./renderNewPost.js";
// import { fetchBulkPostMetadata } from "./renders/bulkMeta.js";

// export async function fetchFeed(container) {
//     try {
//         const posts = await loadFeedData();
//         if (!posts.length) {
//             container.appendChild(createElement("p", {}, ["No posts available."]));
//             return;
//         }

//         // ✅ Step 1: collect post IDs
//         const postIds = posts.map(p => p.postid);

//         // ✅ Step 2: fetch metadata in bulk
//         const metadataList = await fetchBulkPostMetadata(postIds);
// console.log(metadataList);
//         // Convert array → lookup map for faster access
//         const postmetadata = {};
//         metadataList.forEach(m => postmetadata[m.postId] = m);

//         // ✅ Step 3: render all posts
//         await renderPost(posts, container, postmetadata);

//     } catch (err) {
//         console.error("Feed error:", err);
//         container.appendChild(createElement("p", {}, ["Error loading posts."]));
//     }
// }

// async function loadFeedData() {
//     const response = await apiFetch("/feed/feed");
//     if (!response.ok || !Array.isArray(response.data)) {
//         throw new Error("Invalid feed response");
//     }
//     return response.data;
// }

// // import { apiFetch } from "../../api/api.js";
// // import { createElement } from "../../components/createElement.js";
// // import { renderPost } from "./renderNewPost.js";
// // import { fetchBulkPostMetadata } from "./renders/bulkMeta.js";


// // export async function fetchFeed(container) {
// //     try {
// //         const posts = await loadFeedData();
// //         if (!posts.length) {
// //             container.appendChild(
// //                 createElement("p", {}, ["No posts available."])
// //             );
// //             return;
// //         }
// //         const postIds = posts.map(p => p.postid);
// //         const metadata = await fetchBulkPostMetadata(postIds);

// //         posts.forEach((post, i) => {
// //             const meta = metadata[post.postid] || { likes: 0, comments: 0, likedByUser: false };
// //             const actions = createActions(post.postid, postsContainer, post.creatorId === user._id, post.element, i, meta);
// //             post.element.appendChild(actions);
// //         });

// //         renderPost(posts, container, postmetadata);

// //     } catch (err) {
// //         container.appendChild(
// //             createElement("p", {}, ["Error loading posts."])
// //         );
// //         console.error("Feed error:", err);
// //     }
// // }


// // async function loadFeedData() {
// //     const response = await apiFetch("/feed/feed");

// //     if (!response.ok || !Array.isArray(response.data)) {
// //         throw new Error("Invalid feed response");
// //     }
// //     return response.data;
// // }
