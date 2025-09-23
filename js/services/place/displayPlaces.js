import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { displayListingPage } from "../../utils/displayListingPage.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";

export function displayPlaces(isLoggedIn, container) {
  container.replaceChildren();

  displayListingPage(container, {
    title: "All Places",
    apiEndpoint: "/places/places?page=1&limit=10",
    cardBuilder: createPlaceCard,
    type: "places",
    pageSize: 10,
    sidebarActions: aside => {
      aside.appendChild(createElement("h3", {}, ["Actions"]));
      if (isLoggedIn) {
        aside.appendChild(
          Button("Create Place", "", { click: () => navigate("/create-place") }, "buttonx primary")
        );
      }
      aside.appendChild(
        Button("Create Itinerary", "", { click: () => navigate("/itinerary") }, "buttonx primary")
      );
      aside.appendChild(
        Button("Manage Places", "", { click: () => navigate("/places/manage") }, "buttonx secondary")
      );
      aside.appendChild(
        Button("Help / FAQ", "", { click: () => navigate("/help") }, "buttonx secondary")
      );
    },
    onDataRender: (listContainer, data) => {
      if (!data || !data.length) {
        listContainer.appendChild(createElement("p", {}, ["No matching places."]));
        return;
      }

      // Optional: render grid/list view based on preference
      data.forEach(place => listContainer.appendChild(createPlaceCard(place)));
    }
  });
}

function createPlaceCard(place) {
  const bannerUrl = place.banner
    ? resolveImagePath(EntityType.PLACE, PictureType.THUMB, place.banner)
    : resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");

  const image = Imagex({
    src: bannerUrl,
    alt: `${place.name || "Unnamed"} Banner`,
    loading: "lazy"
  });

  image.onerror = () => {
    image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
  };

  const metaRow = createElement("div", {
    style: "display:flex;align-items:center;justify-content:space-between;margin-top:4px;"
  }, [
    createElement("span", { class: "badge" }, [place.category || "-"])
  ]);

  return createElement("div", { class: "place-card" }, [
    createElement("a", {
      href: `/place/${place.placeid}`,
      style: "text-decoration:none;color:inherit;display:block;"
    }, [
      image,
      createElement("div", { class: "place-info" }, [
        createElement("h2", {}, [place.name || "Unnamed Place"]),
        createElement("p", {}, [place.address || "-"]),
        createElement("p", {}, [place.short_desc || "-"]),
        metaRow
      ])
    ])
  ]);
}
