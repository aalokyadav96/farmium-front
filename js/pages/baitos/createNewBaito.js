import { createBaito } from "../../services/baitos/create/createBaito.js";

async function Create(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createBaito(isLoggedIn, contentContainer);
}

export { Create };
