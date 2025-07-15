import {renderPost} from "./renders/renderPost";

function renderNewPost(post, i) {
    const postsContainer = document.getElementById("postsContainer");
    renderPost(post, postsContainer, i);
}

export { renderNewPost, renderPost };