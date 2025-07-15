import { apiFetch } from "../../api/api.js";
import { renderNewPost } from "./renderNewPost.js";



// Function to fetch posts from the backend and render them
async function fetchFeed() {
    const postsContainer = document.getElementById("postsContainer");
    postsContainer.innerHTML = '<p>Loading posts...</p>';

    try {
        const data = await apiFetch('/feed/feed');
        if (!data.ok || !Array.isArray(data.data)) {
            throw new Error("Invalid data received from the server");
        }

        // Sort posts by timestamp (latest first)
        const sortedPosts = data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Clear the container before rendering
        postsContainer.innerHTML = '';

        // Render each post in sorted order
        sortedPosts.forEach(renderNewPost);
    } catch (error) {
        postsContainer.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    }
}

export {fetchFeed};