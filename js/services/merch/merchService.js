// Imports
import { apiFetch } from "../../api/api.js";
import MerchCard from '../../components/ui/MerchCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { handlePurchase } from '../payment/pay.js';
import Modal from "../../components/ui/Modal.mjs";
import Notify from "../../components/ui/Notify.mjs";

import { EntityType, PictureType, resolveImagePath } from "../../utils/imagePaths.js";
import { reportPost } from "../reporting/reporting.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import Imagex from "../../components/base/Imagex.js";

import { uploadFile } from "../media/api/mediaApi.js";
import { uid } from "../media/ui/mediaUploadForm.js";

// --- Add Merchandise ---
async function addMerchandise(entityType, eventId, merchList) {
    const name = document.getElementById("merch-name").value.trim();
    const price = parseFloat(document.getElementById("merch-price").value);
    const stock = parseInt(document.getElementById("merch-stock").value, 10);
    const imageFile = document.getElementById("merch-image").files[0];

    if (!name || isNaN(price) || isNaN(stock)) {
        Notify("Please fill in all fields correctly.", { type: "error" });
        return;
    }

    if (imageFile && !imageFile.type.startsWith("image/")) {
        Notify("Please upload a valid image file.", { type: "error" });
        return;
    }

    try {
        let uploadedImage = null;

        // --- Upload image first (if provided) ---
        if (imageFile) {
            const uploadObj = {
                id: uid(),
                file: imageFile,
                previewURL: URL.createObjectURL(imageFile),
                progress: 0,
                uploading: true,
                mediaEntity: "merch",
            };

            Notify("Uploading image...", { type: "info", duration: 2000 });

            uploadedImage = await uploadFile(uploadObj);
            if (!uploadedImage?.filename && !uploadedImage?.file) {
                throw new Error("Image upload failed.");
            }
        }

        // --- Now send merchandise data ---
        const payload = {
            name,
            price,
            stock,
            merch_pic: uploadedImage?.filename || uploadedImage?.file || "",
        };

        const response = await apiFetch(`/merch/${entityType}/${eventId}`, "POST", payload);
        if (!response?.data?.merchid) throw new Error(response?.message || "Invalid server response.");

        Notify(response.message || "Merchandise added successfully.", {
            type: "success",
            duration: 3000,
        });

        displayNewMerchandise(response.data, merchList);
        clearMerchForm();
    } catch (err) {
        console.error("Error adding merchandise:", err);
        Notify(`Error adding merchandise: ${err.message}`, { type: "error" });
    }
}


// --- Clear Form ---
function clearMerchForm() {
    const formContainer = document.getElementById('edittabs');
    if (formContainer) formContainer.replaceChildren();
}

// --- Delete Merchandise ---
async function deleteMerch(entityType, merchId, eventId) {
    if (!confirm('Are you sure you want to delete this merchandise?')) return;

    try {
        const response = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'DELETE');
        if (response.success) {
            Notify('Merchandise deleted successfully!', { type: "success" });
            const merchItem = document.getElementById(`merch-${merchId}`);
            if (merchItem) merchItem.remove();
        } else {
            Notify(`Failed to delete merchandise: ${response.message}`, { type: "error" });
        }
    } catch (err) {
        console.error('Error deleting merchandise:', err);
        Notify('An error occurred while deleting the merchandise.', { type: "error" });
    }
}

// --- Edit Merchandise ---
async function editMerchForm(entityType, merchId, eventId) {
    try {
        const data = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'GET');

        const form = createElement("form", { id: "edit-merch-form" });
        const fields = [
            { label: "Name:", type: "text", id: "merchName", value: data.name, required: true },
            { label: "Price:", type: "number", id: "merchPrice", value: data.price, required: true, step: "0.01" },
            { label: "Stock:", type: "number", id: "merchStock", value: data.stock, required: true }
        ];
        fields.forEach(f => form.appendChild(createFormGroup(f)));

        const submitBtn = Button("Update Merchandise", "", { type: "submit" }, "buttonx");
        form.appendChild(submitBtn);

        const { close: closeModal } = Modal({ title: "Edit Merchandise", content: form });

        form.addEventListener("submit", async e => {
            e.preventDefault();
            const merchData = {
                name: form.querySelector("#merchName").value,
                price: parseFloat(form.querySelector("#merchPrice").value),
                stock: parseInt(form.querySelector("#merchStock").value, 10)
            };
            try {
                const resp = await apiFetch(
                    `/merch/${entityType}/${eventId}/${merchId}`,
                    'PUT',
                    JSON.stringify(merchData),
                    { 'Content-Type': 'application/json' }
                );
                if (resp.success) {
                    Notify('Merchandise updated successfully!', { type: "success" });
                    closeModal();
                } else Notify(`Failed to update merchandise: ${resp.message}`, { type: "error" });
            } catch (err) {
                console.error("Error updating merchandise:", err);
                Notify("An error occurred while updating the merchandise.", { type: "error" });
            }
        });
    } catch (err) {
        console.error("Error fetching merchandise details:", err);
        Notify('An error occurred while fetching the merchandise details.', { type: "error" });
    }
}

// --- Add Merchandise Form ---
function addMerchForm(entityType, eventId, merchList) {
    const form = createElement("form", { id: "add-merch-form", class: "create-section" });
    const fields = [
        { label: "Merchandise Name", type: "text", id: "merch-name", placeholder: "Merchandise Name", required: true },
        { label: "Price", type: "number", id: "merch-price", placeholder: "Price", required: true },
        { label: "Stock Available", type: "number", id: "merch-stock", placeholder: "Stock Available", required: true },
        { label: "Merch Image", type: "file", id: "merch-image", additionalProps: { accept: "image/*" } }
    ];
    fields.forEach(f => form.appendChild(createFormGroup(f)));

    const addBtn = createElement("button", { type: "submit", class: "buttonx" }, ["Add Merchandise"]);
    form.appendChild(addBtn);

    const { close: closeModal } = Modal({ title: "Add Merchandise", content: form });

    form.addEventListener("submit", async e => {
        e.preventDefault();
        await addMerchandise(entityType, eventId, merchList);
        closeModal();
    });
}

// --- Display New Merchandise Item ---
function displayNewMerchandise(merchData, merchList) {
    const item = createElement("div", { class: "merch-item", id: `merch-${merchData.merchid}` });
    item.append(
        createElement("h3", {}, [merchData.name]),
        createElement("p", {}, [`Price: $${(merchData.price / 100).toFixed(2)}`]),
        createElement("p", {}, [`Available: ${merchData.stock}`])
    );
    if (merchData.merch_pic) {
        const img = Imagex({
            src: resolveImagePath(EntityType.MERCH, PictureType.THUMB, merchData.merch_pic),
            alt: merchData.name,
            loading: "lazy",
            style: "max-width:160px"
        });
        item.appendChild(img);
    }
    merchList.prepend(item);
}

// --- Display Merchandise List ---
async function displayMerchandise(container, merchData, entityType, eventId, isCreator, isLoggedIn) {
    container.replaceChildren();
    container.appendChild(createElement("h2", {}, ["Merchandise"]));

    const merchList = createElement("div", { class: "merchcon hvflex" });
    container.appendChild(merchList);

    if (isCreator) {
        const addBtn = Button("Add Merchandise", "", { click: () => addMerchForm(entityType, eventId, merchList) });
        container.appendChild(addBtn);
    }

    merchList.replaceChildren();

    if (!Array.isArray(merchData) || merchData.length === 0) {
        merchList.appendChild(createElement("p", {}, ["No merchandise available for this event."]));
        return;
    }

    merchData.forEach(merch => {
        const card = MerchCard({
            name: merch.name,
            price: merch.price,
            image: resolveImagePath(EntityType.MERCH, PictureType.THUMB, merch.merch_pic),
            stock: merch.stock,
            isCreator,
            isLoggedIn,
            onBuy: () => handlePurchase("merch", merch.merchid, eventId, merch.stock),
            onEdit: () => editMerchForm(entityType, merch.merchid, eventId),
            onDelete: () => deleteMerch(entityType, merch.merchid, eventId),
            onReport: () => reportPost(merch.merchid, "merch", entityType, eventId)
        });
        merchList.appendChild(card);
    });
}

export {
    addMerchForm,
    addMerchandise,
    displayNewMerchandise,
    clearMerchForm,
    displayMerchandise,
    deleteMerch,
    editMerchForm
};
