import { renderPost } from "./renders/renderPost.js";

/**
 * Convenience wrapper to render post into default container
 */
export function renderNewPost(post, i, container) {
  renderPost(post, container, i);
}

export { renderPost };