import { createArtistForm } from "../../services/artist/createArtist.js";

async function CreateArtist(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createArtistForm(isLoggedIn, contentContainer);
}

export { CreateArtist };
