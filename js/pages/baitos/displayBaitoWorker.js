import { displayWorkerPage } from '../../services/baitos/workers/displayWorkerPage.js';

async function Worker(isLoggedIn, baitoid, contentContainer) {
    displayWorkerPage(contentContainer, isLoggedIn, baitoid)
}

export { Worker };
