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

// --- Add Merchandise ---
async function addMerchandise(entityType, eventId, merchList) {
    const name = document.getElementById('merch-name').value.trim();
    const price = parseFloat(document.getElementById('merch-price').value);
    const stock = parseInt(document.getElementById('merch-stock').value, 10);
    const imageFile = document.getElementById('merch-image').files[0];

    if (!name || isNaN(price) || isNaN(stock)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    if (imageFile && !imageFile.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('stock', stock);
    if (imageFile) formData.append('image', imageFile);

    try {
        const response = await apiFetch(`/merch/${entityType}/${eventId}`, 'POST', formData);
        if (!response?.data?.merchid) throw new Error(response?.message || 'Invalid server response.');
        Notify(response.message || "Merchandise added successfully.", { type: "success", duration: 3000, dismissible: true });
        displayNewMerchandise(response.data, merchList);
        clearMerchForm();
    } catch (err) {
        console.error("Error adding merchandise:", err);
        alert(`Error adding merchandise: ${err.message}`);
    }
}

// --- Clear Form ---
function clearMerchForm() {
    const formContainer = document.getElementById('edittabs');
    if (formContainer) formContainer.innerHTML = '';
}

// --- Delete Merchandise ---
async function deleteMerch(entityType, merchId, eventId) {
    if (!confirm('Are you sure you want to delete this merchandise?')) return;

    try {
        const response = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'DELETE');
        if (response.success) {
            alert('Merchandise deleted successfully!');
            const merchItem = document.getElementById(`merch-${merchId}`);
            if (merchItem) merchItem.remove();
        } else {
            alert(`Failed to delete merchandise: ${response.message}`);
        }
    } catch (err) {
        console.error('Error deleting merchandise:', err);
        alert('An error occurred while deleting the merchandise.');
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

        const modal = Modal({ title: "Edit Merchandise", content: form, onClose: () => modal.remove() });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const merchData = {
                name: document.getElementById("merchName").value,
                price: parseFloat(document.getElementById("merchPrice").value),
                stock: parseInt(document.getElementById("merchStock").value, 10)
            };
            try {
                const resp = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'PUT', JSON.stringify(merchData), { 'Content-Type': 'application/json' });
                if (resp.success) {
                    alert('Merchandise updated successfully!');
                    modal.remove();
                } else alert(`Failed to update merchandise: ${resp.message}`);
            } catch (err) {
                console.error("Error updating merchandise:", err);
                alert("An error occurred while updating the merchandise.");
            }
        });
    } catch (err) {
        console.error("Error fetching merchandise details:", err);
        alert('An error occurred while fetching the merchandise details.');
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
    const cancelBtn = Button("Cancel", "", { click: () => modal.remove() }, "buttonx");
    form.append(addBtn, cancelBtn);

    const modal = Modal({ title: "Add Merchandise", content: form, onClose: () => modal.remove() });

    form.addEventListener("submit", async e => {
        e.preventDefault();
        await addMerchandise(entityType, eventId, merchList);
        modal.remove();
    });
}

// --- Display New Merchandise Item ---
function displayNewMerchandise(merchData, merchList) {
    const item = createElement("div", { className: "merch-item", id: `merch-${merchData.merchid}` });
    item.append(
        createElement("h3", { textContent: merchData.name }),
        createElement("p", { textContent: `Price: $${(merchData.price / 100).toFixed(2)}` }),
        createElement("p", { textContent: `Available: ${merchData.stock}` })
    );
    if (merchData.merch_pic) {
        const img = createElement("img", {
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

    if (isCreator) {
        const addBtn = Button("Add Merchandise", "", { click: () => addMerchForm(entityType, eventId, merchList) });
        container.appendChild(addBtn);
    }

    const merchList = createElement("div", { className: "merchcon hvflex" });
    container.appendChild(merchList);

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
