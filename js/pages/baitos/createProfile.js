import { displayCreateBaitoProfile } from "../../services/baitos/createBaitoProfile.js";

async function CreateProfile(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayCreateBaitoProfile(isLoggedIn, contentContainer);
}

export { CreateProfile };
