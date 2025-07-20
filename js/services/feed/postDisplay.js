// import { SRC_URL, state } from "../../state/state.js";
import { createElement } from "../../components/createElement.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
// import Button from "../../components/base/Button.js";
import { renderPost } from "./renders/renderPost.js";
import { apiFetch } from "../../api/api.js";

async function displayPost(isLoggedIn, postId, contentContainer) {
    try {
        const postData = await apiFetch(`/feed/post/${postId}`);

        if (!contentContainer) {
            contentContainer = document.getElementById("content");
        }
        contentContainer.innerHTML = "";
        renderPost(postData, contentContainer, 0);
    } catch (error) {
        contentContainer.innerHTML = "";
        if (error.message === '404') {
            contentContainer.appendChild(
                createElement("h1", {}, ["Post not found"])
            );
        } else {
            // contentContainer.appendChild(
            //     createElement("h1", {}, [`Error loading post details: ${error.message}`])
            // );
            Snackbar("Failed to load post details. Please try again later.", 3000);
        }
    }
}


export { displayPost };
