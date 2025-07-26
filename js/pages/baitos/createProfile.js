import { displayCreateBaitoProfile } from "../../services/baitos/create/createBaitoProfile.js";

async function CreateProfile(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayCreateBaitoProfile(isLoggedIn, contentContainer);
}

export { CreateProfile };
