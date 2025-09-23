import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { displayListingPage } from "../../utils/displayListingPage.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";

export function displayArtists(container, isLoggedIn) {
  container.replaceChildren();

  displayListingPage(container, {
    title: "Artists",
    apiEndpoint: "/artists?offset=0&limit=10",
    cardBuilder: createArtistCard,
    type: "artists",
    pageSize: 10,
    sidebarActions: aside => {
      aside.appendChild(createElement("h3", {}, ["Actions"]));
      if (isLoggedIn) {
        aside.appendChild(
          Button("Create Artist", "", { click: () => navigate("/create-artist") }, "buttonx primary")
        );
      }
    },
    onDataRender: (listContainer, data) => {
      // Optional: grid or list view toggle
      data.forEach(artist => listContainer.appendChild(createArtistCard(artist)));
    }
  });
}

function createArtistCard(artist) {
  const imgSrc = artist.photo
    ? resolveImagePath(EntityType.ARTIST, PictureType.THUMB, artist.photo)
    : "https://via.placeholder.com/300x300?text=No+Image";

  return createElement("div", { class: "artist-card" }, [
    Imagex({ src: imgSrc, alt: artist.name || "Unnamed Artist", classes: "artist-thumb" }),
    createElement("h3", {}, [artist.name || "Unnamed"]),
    createElement("p", { class: "artist-category" }, [artist.category || "-"]),
    createElement("p", { class: "artist-bio" }, [
      ((artist.bio || "") + "").substring(0, 100) + ((artist.bio || "").length > 100 ? "..." : "")
    ]),
    Button("View Details", `view-${artist.artistid}`, {
      click: () => navigate(`/artist/${artist.artistid}`)
    }, "artist-view-btn")
  ]);
}
