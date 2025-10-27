import { displayMusic } from "../../services/wukong/wuzic.js";

async function Music(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayMusic(contentContainer, isLoggedIn);
}

export { Music };
