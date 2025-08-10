import { renderPost } from "./renders/renderPost.js";

/**
 * Convenience wrapper to render post into default container
 */
export function renderNewPost(post, i, container) {
  renderPost(post, container, i);
}

// import {renderPost} from "./renders/renderPost";

// function renderNewPost(post, i) {
//     const postsContainer = document.getElementById("postsContainer");
//     renderPost(post, postsContainer, i);
// }

// export { renderNewPost, renderPost };
export { renderPost };