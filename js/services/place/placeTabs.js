import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import Modal from "../../components/ui/Modal.mjs";
// import { Button } from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { renderPlaceDetails } from "./renderPlaceDetails.js";

function displayPlaceHome(container, placeData, isCreator, isLoggedIn) {
    container.innerHTML = "";
    // renderPlaceDetails(isLoggedIn, container, placeData, isCreator);
    container.appendChild(createElement("h2", {}, [placeData.name]));
    container.appendChild(
        createElement("p", {}, [placeData.description || "No description available."])
    );
}



// async function displayPlaceNearby(container, placeId) {
//     container.innerHTML = "";

//     const nearbyPlaces = await apiFetch(`/suggestions/places/nearby?place=${placeId}&lat=28.6139&lng=77.2090`);

//     if (nearbyPlaces == null) {
//         container.innerHTML = "No nearby Places found";
//         return
//     }

//     // Nearby places section
//     const nearbySection = createElement("div", { class: "nearby-section hvflex" }, [
//         // createElement("h3", {}, ["Nearby Places"]),
//         ...nearbyPlaces.map((place, index) =>
//             createElement("div", { class: "nearby-item" }, [
//                 createElement("div", { class: "nearby-details" }, [
//                     createElement("h4", {}, [place.name]),
//                     createElement("p", {}, [`Category: ${place.category}`]),
//                     // createElement("p", {}, [`Distance: ${place.distance}`]),
//                     createElement("p", {}, [`Capacity: ${place.capacity || 1}`]),
//                     createElement("p", {}, [`⭐ Review Count: ${place.reviewCount}`]),
//                 ]),
//                 Button("View Details", `nearby-btn-${index}`, {
//                     // click: () => alert(`More details about ${place.name}`),
//                     click: () => navigate(`/place/${place.placeid}`),
//                 }),
//             ])
//         ),
//     ]);

//     container.appendChild(createElement("h3", {}, ["Nearby Places"]));
//     container.appendChild(nearbySection);
// }


// function displayPlaceInfo(container, placeData, isCreator) {
//     // Clear the container
//     container.innerHTML = "";
//     console.log(placeData);
//     // Initialize place information
//     const info = {
//         category: placeData.category || "N/A",
//         description: placeData.description || "N/A",
//         capacity: placeData.capacity || "N/A",
//         createdDate: placeData.created_at || "N/A",
//         updatedDate: placeData.updated_at || "N/A",
//         accessibility: placeData.accessibility || "Not specified",
//         services: placeData.services || [],
//     };


//     // Function to render place information
//     const renderInfo = () => {
//         container.innerHTML = "";

//         // Add the "Add Info" button if the user is the creator
//         if (isCreator) {
//             const addInfoButton = Button("Add Info", "add-info-btn", {
//                 click: handleAddInfo,
//             });
//             container.appendChild(addInfoButton);
//         }

//         // Create the info display

//         // Create the info display
//         const infoDisplay = createElement("div", { class: "place-info" }, [
//             // createElement("h2", {}, [placeData.name || "Unknown Place"]),
//             createElement("p", {}, [createElement("strong", {}, ["Description: "]),createElement("span", {}, [`${info.description}`])]),
//             createElement("p", {}, [createElement("strong", {}, ["Category: "]),createElement("span", {}, [`${info.category}`])]),
//             createElement("p", {}, [createElement("strong", {}, ["Capacity: "]),createElement("span", {}, [`${info.capacity}`])]),
//             createElement('p', {}, [createElement("strong", {}, ["Created On: "]),createElement("span", {}, [`${info.createdDate}`])]),
//             createElement('p', {}, [createElement("strong", {}, ["Last Updated: "]),createElement("span", {}, [`${info.updatedDate}`])]),
//             createElement("p", {}, [createElement("strong", {}, ["Accessibility: "]),createElement("span", {}, [`${info.accessibility}`])]),
//             createElement("p", {}, [createElement("strong", {}, ["Services: "]),createElement("span", {}, [`${info.services.length > 0 ? info.services.join(", ") : "None"}`])]),
//         ]);

//         container.appendChild(infoDisplay);

//     };

//     // Function to handle adding new information
//     const handleAddInfo = () => {
//         const accessibility = prompt("Enter accessibility info:");
//         const service = prompt("Enter a service to add:");

//         if (accessibility) info.accessibility = accessibility;
//         if (service) info.services.push(service);

//         renderInfo(); // Re-render the updated information
//     };

//     // Initial render
//     renderInfo();
// }

function displayPlaceInfo(container, placeData, isCreator) {
    container.innerHTML = "";

    const info = {
        category: placeData.category || "N/A",
        description: placeData.description || "N/A",
        capacity: placeData.capacity || "N/A",
        createdDate: placeData.created_at || "N/A",
        updatedDate: placeData.updated_at || "N/A",
        accessibility: placeData.accessibility || "Not specified",
        services: placeData.services || [],
    };

    const renderInfo = () => {
        container.innerHTML = "";

        if (isCreator) {
            const addInfoButton = Button("Add Info", "add-info-btn", {
                click: handleAddInfo,
            });
            container.appendChild(addInfoButton);
        }

        const infoDisplay = createElement("div", { class: "place-info" }, [
            createElement("p", {}, [createElement("strong", {}, ["Description: "]), createElement("span", {}, [info.description])]),
            createElement("p", {}, [createElement("strong", {}, ["Category: "]), createElement("span", {}, [info.category])]),
            createElement("p", {}, [createElement("strong", {}, ["Capacity: "]), createElement("span", {}, [info.capacity])]),
            createElement("p", {}, [createElement("strong", {}, ["Created On: "]), createElement("span", {}, [info.createdDate])]),
            createElement("p", {}, [createElement("strong", {}, ["Last Updated: "]), createElement("span", {}, [info.updatedDate])]),
            createElement("p", {}, [createElement("strong", {}, ["Accessibility: "]), createElement("span", {}, [info.accessibility])]),
            createElement("p", {}, [createElement("strong", {}, ["Services: "]), createElement("span", {}, [info.services.length > 0 ? info.services.join(", ") : "None"])])
        ]);

        container.appendChild(infoDisplay);
    };

    const handleAddInfo = () => {
        const form = document.createElement("form");

        const accessibilityInput = document.createElement("input");
        accessibilityInput.type = "text";
        accessibilityInput.placeholder = "Accessibility Info";
        accessibilityInput.value = info.accessibility !== "Not specified" ? info.accessibility : "";

        const serviceInput = document.createElement("input");
        serviceInput.type = "text";
        serviceInput.placeholder = "Add a service";

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Save";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";

        form.append(accessibilityInput, serviceInput, submitButton, cancelButton);

        const modal = Modal({
            title: "Add Info",
            content: form,
            onClose: () => modal.remove()
        });

        cancelButton.addEventListener("click", () => modal.remove());

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const accValue = accessibilityInput.value.trim();
            const serviceValue = serviceInput.value.trim();

            if (accValue) info.accessibility = accValue;
            if (serviceValue) info.services.push(serviceValue);

            modal.remove();
            renderInfo();
        });
    };

    renderInfo();
}


export { displayPlaceHome, displayPlaceInfo };