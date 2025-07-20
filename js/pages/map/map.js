import { loadMap } from "../../services/map/mapUI.js";

async function Map(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    loadMap(contentContainer, isLoggedIn, { type: "all", id: 0 });
}

export { Map };
