import { createElement } from "../../components/createElement.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import { renderPost } from "./renders/renderPost.js";
import { apiFetch } from "../../api/api.js";
import Notify from "../../components/ui/Notify.mjs";

async function displayPost(isLoggedIn, postId, contentContainer) {
    alert("dgfg");
    try {
        const postData = await apiFetch(`/feed/post/${postId}`);

        if (!contentContainer) {
            contentContainer = document.getElementById("content");
        }
        contentContainer.innerHTML = "";
        renderPost(postData, contentContainer, 0);
    } catch (error) {
        contentContainer.innerHTML = "";
        if (error.message === "404") {
            contentContainer.appendChild(
                createElement("h1", {}, ["Post not found"])
            );
        } else {
            Snackbar("Failed to load post details. Please try again later.", 3000);
        }
    }
}

export { displayPost };
