import { createElement } from "../../components/createElement.js";
import { editPlaceForm, deletePlace, analyticsPlace } from "./placeService.js";
import Button from "../../components/base/Button.js";
import { SRC_URL } from "../../api/api.js";
import { reportPost } from "../reporting/reporting.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { updateImageWithCrop } from "../../utils/bannerEditor.js"; // adjust path

function renderPlaceDetails(isLoggedIn, content, place, isCreator) {
  content.replaceChildren();
console.log(place);
  const createdDate = new Date(place.created_at).toLocaleString();
  const updatedDate = new Date(place.updated_at).toLocaleString();
  const latitude = place.coordinates?.lat || "N/A";
  const longitude = place.coordinates?.lng || "N/A";

  // Banner section
  // const bannerFilename = place.banner || "placeholder.png";
  const bannerSrc = resolveImagePath(EntityType.PLACE, PictureType.BANNER, place.banner);

  const bannerImg = createElement("img", {
    id: "place-banner-img",
    src: bannerSrc,
    alt: place.name || "Place Banner",
    loading: "lazy",
  });

  bannerImg.onerror = () => {
    bannerImg.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
  };

  const bannerSection = createElement("section", {
    id: "place-banner",
    class: "placedetails"
  }, [bannerImg]);

  if (isCreator){
    // Add Banner Edit Button here
    const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
    bannerEditButton.addEventListener("click", () => {
      updateImageWithCrop({
        entityType: EntityType.PLACE,
        imageType: "banner",
        stateKey: "banner",
        stateEntityKey: "place",
        previewElementId: "place-banner-img",
        pictureType: PictureType.BANNER,
        entityId: place.placeid  // <-- pass placeid here
      });
    });
    
    bannerSection.appendChild(bannerEditButton);
  }
  // Core details section
  const detailsSection = createElement("section", { id: "placedetails", class: "placedetails" }, [
    createElement("h1", {}, [place.name]),
    createElement("p", {}, [createElement("strong", {}, ["Description: "]), place.description || "N/A"]),
    createElement("p", {}, [createElement("strong", {}, ["Address: "]), place.address || "N/A"]),
    createElement("p", {}, [createElement("strong", {}, ["Coordinates: "]), `Lat: ${latitude}, Lng: ${longitude}`]),
    createElement("p", {}, [createElement("strong", {}, ["Category: "]), place.category || "N/A"]),
    createElement("p", {}, [createElement("strong", {}, ["Created: "]), createdDate]),
    createElement("p", {}, [createElement("strong", {}, ["Last Updated: "]), updatedDate]),
  ]);

  if (isCreator) {
    const actionsWrapper = createElement("div", { class: "hvflex" }, []);
    const editContainer = createElement("div", { id: "editplace" }, []);

    actionsWrapper.appendChild(
      Button("Edit Place", "edit-place-btn", {
        click: () => editPlaceForm(isLoggedIn, place.placeid, editContainer),
      }, "buttonx secondary")
    );

    actionsWrapper.appendChild(
      Button("Delete Place", "delete-place-btn", {
        click: () => deletePlace(isLoggedIn, place.placeid),
      }, "delete-btn buttonx")
    );

    actionsWrapper.appendChild(
      Button("View Analytics", "analytics-place-btn", {
        click: () => analyticsPlace(isLoggedIn, place.placeid),
      }, "buttonx secondary")
    );

    detailsSection.appendChild(actionsWrapper);
    detailsSection.appendChild(editContainer);
  } else {
    const reportBtn = createElement("button", { class: "report-comment", type: "button" }, ["Report"]);
    reportBtn.addEventListener("click", () => reportPost(place.placeid, "place", "", ""));
    detailsSection.appendChild(reportBtn);
  }

  content.appendChild(bannerSection);
  content.appendChild(detailsSection);
}

export { renderPlaceDetails };
