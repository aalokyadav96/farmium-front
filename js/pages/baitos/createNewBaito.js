import { createBaito } from "../../services/baitos/createBaito.js";

async function Create(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createBaito(isLoggedIn, contentContainer);
}

export { Create };
