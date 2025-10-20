import { displayMedia } from "../fanmade/ui/mediaGallery.js";
import { displayLive } from "../vlive/displayLive.js";
import { displayMediaFeed } from "../media/dispMediFeed.js";
import { persistTabs } from "../../utils/persistTabs.js";

// export function renderFanMadeTab(containter, artistid, isL) {
//     try {
//         displayMedia(containter, "fanmade", artistid, isL);
//     } catch (err) {
//         containter.appendChild("p",{},["Error loading posts."]);
//     }
// }

export function renderLiveTab(containter, artistid, isL, isCreator) {
    displayLive(containter, "artist", artistid, isL, isCreator);
}

// export async function renderPostsTab(container, artistID, isLoggedIn) {
//     try {
//         displayMediaFeed(container, "artist", artistID, isLoggedIn);
//     } catch (err) {
//         container.appendChild("p",{},["Error loading posts."]);
//     }
// }

export async function renderPostsTab(container, artistID, isLoggedIn) {
    const tabs = [
      { title: "Fanmade", id: "artist-fanmade", render: (c) => displayMedia(c, "fanmade", artistID, isLoggedIn) },
      { title: "Artist", id: "artist-posts", render: (c) => displayMediaFeed(c, "artist", artistID, isLoggedIn) },
    ];
  
    persistTabs(container, tabs, `media-tabs:${artistID}`);
  }
  