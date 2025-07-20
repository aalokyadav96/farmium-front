import { apiFetch } from "../../api/api.js";
import { renderNewPost } from "./renderNewPost.js";

/**
 * Fetches all posts from backend and filters them by post type.
 * @param {string} type - Post type: "video", "audio", "blog", "image", or "all"
 * @param {HTMLElement} targetContainer - Where to render posts
 */
export async function fetchFeedByType(type = "all", targetContainer) {
  targetContainer.innerHTML = '<p>Loading posts...</p>';

  try {
    const res = await apiFetch('/feed/feed');
    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error("Invalid feed response");
    }

    let posts = res.data.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    if (type !== "all") {
      posts = posts.filter(post => post.type === type);
    }

    targetContainer.innerHTML = '';
    posts.forEach((post, i) => renderNewPost(post, i, targetContainer));
  } catch (err) {
    targetContainer.innerHTML = `<p>Error loading feed: ${err.message}</p>`;
  }
}

export function fetchFeed() {
  const postsContainer = document.getElementById("postsContainer");
  postsContainer.innerHTML = '<p>Loading posts...</p>';

  fetchFeedByType("", postsContainer);
}

// import { apiFetch } from "../../api/api.js";
// import { renderNewPost } from "./renderNewPost.js";



// // Function to fetch posts from the backend and render them
// async function fetchFeed() {
//     const postsContainer = document.getElementById("postsContainer");
//     postsContainer.innerHTML = '<p>Loading posts...</p>';

//     try {
//         const data = await apiFetch('/feed/feed');
//         if (!data.ok || !Array.isArray(data.data)) {
//             throw new Error("Invalid data received from the server");
//         }

//         // Sort posts by timestamp (latest first)
//         const sortedPosts = data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

//         // Clear the container before rendering
//         postsContainer.innerHTML = '';

//         // Render each post in sorted order
//         sortedPosts.forEach(renderNewPost);
//     } catch (error) {
//         postsContainer.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
//     }
// }

// export {fetchFeed};