import { displayLiveStream } from "../../services/vlive/livePage.js";

async function Vlive(isLoggedIn, liveid, contentContainer) {
    displayLiveStream(isLoggedIn, liveid, contentContainer)
}


export { Vlive };
