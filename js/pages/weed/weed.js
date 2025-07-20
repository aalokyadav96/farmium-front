import { displayWeed } from "../../services/weed/weed.js";

async function Weed(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayWeed(isLoggedIn, contentContainer);
}

export { Weed };
