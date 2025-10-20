// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { renderPost } from "../feed/renders/renderPost.js";
import { displayMedia } from "./ui/mediaGallery.js";

export async function displayMediaFeed(container, entityType, entityID, isLoggedIn) {
    displayMedia(container, entityType, entityID, isLoggedIn)
    // const feedContainer = createElement("div",{class:"tumblr-layout"},[]);
    // container.appendChild(feedContainer);

    // try {
    //     const response = await apiFetch(`/feed/media/${entityType}/${entityID}`);
    //     if (!response.ok || !Array.isArray(response.data)) {
    //         throw new Error("Invalid feed response");
    //     }

    //     const posts = response.data;
    //     if (!posts.length) {
    //         feedContainer.appendChild(
    //             createElement("p", {}, ["No posts available."])
    //         );
    //         return;
    //     }

    //     // Use renderPost directly
    //     renderPost(posts, feedContainer);

    // } catch (err) {
    //     feedContainer.appendChild(
    //         createElement("p", {}, ["Error loading posts."])
    //     );
    //     console.error("Feed error:", err);
    // }
}
