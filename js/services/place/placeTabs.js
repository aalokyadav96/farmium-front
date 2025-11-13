import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import Datex from "../../components/base/Datex.js";
import Modal from "../../components/ui/Modal.mjs";

function displayPlaceHome(container, placeData, isCreator, isLoggedIn) {
    container.replaceChildren();

    container.appendChild(createElement("h2", {}, [placeData.name]));
    container.appendChild(
        createElement("p", {}, [placeData.description || "No description available."])
    );
}

function displayPlaceInfo(container, placeData, isCreator) {
    container.replaceChildren();

    const info = {
        category: placeData.category || "N/A",
        description: placeData.description || "N/A",
        capacity: placeData.capacity || "N/A",
        createdDate: Datex(placeData.created_at) || "N/A",
        updatedDate: Datex(placeData.updated_at) || "N/A",
        accessibility: placeData.accessibility || "Not specified",
        services: placeData.services || [],
    };

    const renderInfo = () => {
        container.replaceChildren();

        if (isCreator) {
            const addInfoButton = Button(
                "Add Info",
                "add-info-btn",
                { click: handleAddInfo },
                "buttonx"
            );
            container.appendChild(addInfoButton);
        }

        const infoDisplay = createElement("div", { class: "place-info" }, [
            createElement("p", {}, [
                createElement("strong", {}, ["Description: "]),
                createElement("span", {}, [info.description]),
            ]),
            createElement("p", {}, [
                createElement("strong", {}, ["Category: "]),
                createElement("span", {}, [info.category]),
            ]),
            createElement("p", {}, [
                createElement("strong", {}, ["Capacity: "]),
                createElement("span", {}, [info.capacity]),
            ]),
            createElement("p", {}, [
                createElement("strong", {}, ["Created On: "]),
                createElement("span", {}, [info.createdDate]),
            ]),
            createElement("p", {}, [
                createElement("strong", {}, ["Last Updated: "]),
                createElement("span", {}, [info.updatedDate]),
            ]),
            createElement("p", {}, [
                createElement("strong", {}, ["Accessibility: "]),
                createElement("span", {}, [info.accessibility]),
            ]),
            createElement("p", {}, [
                createElement("strong", {}, ["Services: "]),
                createElement("span", {}, [
                    info.services.length > 0 ? info.services.join(", ") : "None",
                ]),
            ]),
        ]);

        container.appendChild(infoDisplay);
    };

    const handleAddInfo = () => {
        const form = document.createElement("form");

        const accessibilityInput = document.createElement("input");
        accessibilityInput.type = "text";
        accessibilityInput.placeholder = "Accessibility Info";
        accessibilityInput.value =
            info.accessibility !== "Not specified" ? info.accessibility : "";

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

        const { close } = Modal({
            title: "Add Info",
            content: form,
        });

        cancelButton.addEventListener("click", () => close());

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const accValue = accessibilityInput.value.trim();
            const serviceValue = serviceInput.value.trim();

            if (accValue) info.accessibility = accValue;
            if (serviceValue) info.services.push(serviceValue);

            close();
            renderInfo();
        });
    };

    renderInfo();
}

export { displayPlaceHome, displayPlaceInfo };
