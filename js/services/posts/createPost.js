import { renderPostForm, handlePostSubmit } from './createOrEditPost.js';
import { createElement } from "../../components/createElement.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { navigate } from '../../routes/index.js';

export async function createPost(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    if (!isLoggedIn) {
        Snackbar("Login required to post.", 3000);
        navigate('/login');
        return;
    }

    const section = createElement('div', { class: "create-section" });
    section.appendChild(createElement('h2', {}, ['Create Post']));
    const form = renderPostForm({}, (form) => handlePostSubmit(form, false));
    section.appendChild(form);
    contentContainer.appendChild(section);
}
