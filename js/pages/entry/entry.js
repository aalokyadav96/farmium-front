import { displayEntryPage } from "../../services/entry/entryService.js";

async function Entry(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayEntryPage(contentContainer, isLoggedIn);
}

export { Entry };
