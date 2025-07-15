import { displayAdmin } from "../../services/admin/adminPage.js";

async function Admin(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayAdmin(contentContainer, isLoggedIn);
}

export { Admin };
