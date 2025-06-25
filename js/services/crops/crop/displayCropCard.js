import { createElement } from "../../../components/createElement.js";

export function displayCropCard(crop) {
    const card = createElement("div", { class: "crop-card" });

    if (crop.imageUrl) {
        card.appendChild(createElement("img", {
            src: crop.imageUrl,
            alt: crop.name,
            class: "crop-card-image"
        }));
    }

    card.append(
        createElement("h4", {}, [crop.name]),
        createElement("p", {}, [`💰 ₹${crop.price} per ${crop.unit}`]),
        createElement("p", {}, [`📦 In Stock: ${crop.quantity}`]),
        createElement("p", {}, [`👨‍🌾 Farm: ${crop.farmName || "Unknown"}`])
    );

    return card;
}
