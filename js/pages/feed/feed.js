import { displayFeed } from "../../services/feed/fetchFeed.js";

async function Feed(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayFeed(isLoggedIn, contentContainer);
}

export { Feed };
