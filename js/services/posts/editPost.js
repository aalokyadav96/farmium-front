import { renderPostForm, handlePostSubmit } from './createOrEditPost.js';
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import Snackbar from '../../components/ui/Snackbar.mjs';

export async function editPost(isLoggedIn, postId, contentContainer) {
    contentContainer.innerHTML = '';

    if (!isLoggedIn) {
        Snackbar("Login required to edit post.", 3000);
        navigate('/login');
        return;
    }

    let post;
    try {
        post = await apiFetch(`/posts/${postId}`);
    } catch (err) {
        Snackbar("Failed to load post for editing.", 3000);
        console.error(err);
        return;
    }

    const section = createElement('div', { class: "edit-section" });
    section.appendChild(createElement('h2', {}, ['Edit Post']));
    const form = renderPostForm(post, (form) => handlePostSubmit(form, true, postId));
    section.appendChild(form);
    contentContainer.appendChild(section);
}
