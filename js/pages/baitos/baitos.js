import { displayBaitos } from "../../services/baitos/BaitosService.js";

async function Baitos(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayBaitos(contentContainer, isLoggedIn);
}

export { Baitos };
