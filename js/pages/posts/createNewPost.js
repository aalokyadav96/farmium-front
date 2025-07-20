import { createPost } from "../../services/posts/createPost.js";

async function Create(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createPost(isLoggedIn, contentContainer);
}

export { Create };
