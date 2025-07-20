import { createElement } from "../../components/createElement.js";
import { editPlaceForm, deletePlace, analyticsPlace } from "./placeService.js";
import Button from "../../components/base/Button.js";
import { SRC_URL } from "../../api/api.js";
import { reportPost } from "../reporting/reporting.js";

function renderPlaceDetails(isLoggedIn, content, place, isCreator) {
    content.innerHTML = "";

    const createdDate = new Date(place.created_at).toLocaleString();
    const updatedDate = new Date(place.updated_at).toLocaleString();
    const latitude = place.coordinates?.lat || "N/A";
    const longitude = place.coordinates?.lng || "N/A";

    // Banner section
    const bannerSection = createElement("section", { id: "place-banner", class: "placedetails" }, [
        createElement("img", {
            src: place.banner ? `${SRC_URL}/placepic/${place.banner}` : "https://via.placeholder.com/1200x400?text=No+Banner",
            alt: place.name,
            loading: "lazy",
        }),
    ]);

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

    // Button and edit container (if creator)
    if (isCreator) {
        const actionsWrapper = createElement("div", { class: "hvflex" }, []);

        const editContainer = createElement("div", { id: "editplace" }, []);

        actionsWrapper.appendChild(
            Button("Edit Place", "edit-place-btn", {
                click: () => editPlaceForm(isLoggedIn, place.placeid, editContainer),
            })
        );

        actionsWrapper.appendChild(
            Button("Delete Place", "delete-place-btn", {
                click: () => deletePlace(isLoggedIn, place.placeid),
            }, "delete-btn")
        );

        actionsWrapper.appendChild(
            Button("View Analytics", "analytics-place-btn", {
                click: () => analyticsPlace(isLoggedIn, place.placeid),
            })
        );

        detailsSection.appendChild(actionsWrapper);
        detailsSection.appendChild(editContainer);
    } else {
        const reportBtn = document.createElement("button");
        reportBtn.textContent = "Report";
        reportBtn.className = "report-comment";
        reportBtn.type = "button";

        reportBtn.addEventListener("click", () =>
            reportPost(place.placeid, "place", "", "")
        );
        detailsSection.appendChild(reportBtn);
    }

    // Final composition
    content.appendChild(bannerSection);
    content.appendChild(detailsSection);
}

export { renderPlaceDetails };
