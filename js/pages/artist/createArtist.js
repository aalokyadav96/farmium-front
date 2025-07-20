import { createArtistForm } from "../../services/artist/createArtist.js";

async function Create(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createArtistForm(isLoggedIn, contentContainer);
}

export { Create };
