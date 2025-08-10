// import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import MerchCard from '../../components/ui/MerchCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { SRC_URL } from "../../state/state.js";
import { handlePurchase } from '../payment/paymentService.js';
// import { handlePurchase } from '../payment/pay.js';
import SnackBar from "../../components/ui/Snackbar.mjs";
import Modal from "../../components/ui/Modal.mjs";
import Notify from "../../components/ui/Notify.mjs";

import { EntityType, PictureType, resolveImagePath } from "../../utils/imagePaths.js";
import { reportPost } from "../reporting/reporting.js";

// Add merchandise to the event
async function addMerchandise(entityType, eventId, merchList) {
    const merchName = document.getElementById('merch-name').value.trim();
    const merchPrice = parseFloat(document.getElementById('merch-price').value);
    const merchStock = parseInt(document.getElementById('merch-stock').value);
    const merchImageFile = document.getElementById('merch-image').files[0];

    if (!merchName || isNaN(merchPrice) || isNaN(merchStock)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    // Check if image file is valid (optional)
    if (merchImageFile && !merchImageFile.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }

    if (!merchName || isNaN(merchPrice) || isNaN(merchStock)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const formData = new FormData();
    formData.append('name', merchName);
    formData.append('price', merchPrice);
    formData.append('stock', merchStock);

    if (merchImageFile) {
        formData.append('image', merchImageFile);
    }
    try {
        const response = await apiFetch(`/merch/${entityType}/${eventId}`, 'POST', formData);
        if (!response || !response.data || !response.data.merchid) {
            throw new Error(response?.message || 'Invalid server response.');
        }
    
        SnackBar(response.message || "Merchandise added successfully.");
        displayNewMerchandise(response.data, merchList);
        clearMerchForm();
    
    } catch (error) {
        console.error(`Error adding merchandise: ${error.message}`);
        alert(`Error adding merchandise: ${error.message}`);
    }
    

    // try {
    //     const response = await apiFetch(`/merch/${entityType}/${eventId}`, 'POST', formData);

    //     if (response && response.data.merchid) {
    //         SnackBar("Merchandise added successfully!");
    //         displayNewMerchandise(response.data, merchList);  // Display the newly added merchandise
    //         clearMerchForm();  // Optionally clear the form after success
    //     } else {
    //         alert(`Failed to add merchandise: ${response?.message || 'Unknown error'}`);
    //     }
    // } catch (error) {
    //     alert(`Error adding merchandise: ${error.message}`);
    // }
}

// Clear the merchandise form
function clearMerchForm() {
    // document.getElementById('editevent').innerHTML = '';
    document.getElementById('edittabs').innerHTML = '';
}

async function deleteMerch(entityType, merchId, eventId) {
    if (confirm('Are you sure you want to delete this merchandise?')) {
        try {
            const response = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'DELETE');

            if (response.success) {
                alert('Merchandise deleted successfully!');
                // Remove the deleted item from the DOM
                const merchItem = document.getElementById(`merch-${merchId}`);
                if (merchItem) merchItem.remove();
            } else {
                const errorData = await response.json();
                alert(`Failed to delete merchandise: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error deleting merchandise:', error);
            alert('An error occurred while deleting the merchandise.');
        }
    }
}



async function editMerchForm(entityType, merchId, eventId) {
    try {
        const response = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'GET');

        const form = document.createElement("form");
        form.id = "edit-merch-form";

        const merchIdInput = document.createElement("input");
        merchIdInput.type = "hidden";
        merchIdInput.name = "merchid";
        merchIdInput.value = merchId;

        const nameLabel = document.createElement("label");
        nameLabel.setAttribute("for", "merchName");
        nameLabel.textContent = "Name:";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "merchName";
        nameInput.name = "merchName";
        nameInput.value = response.name;
        nameInput.required = true;

        const priceLabel = document.createElement("label");
        priceLabel.setAttribute("for", "merchPrice");
        priceLabel.textContent = "Price:";

        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.id = "merchPrice";
        priceInput.name = "merchPrice";
        priceInput.value = response.price;
        priceInput.required = true;
        priceInput.step = "0.01";

        const stockLabel = document.createElement("label");
        stockLabel.setAttribute("for", "merchStock");
        stockLabel.textContent = "Stock:";

        const stockInput = document.createElement("input");
        stockInput.type = "number";
        stockInput.id = "merchStock";
        stockInput.name = "merchStock";
        stockInput.value = response.stock;
        stockInput.required = true;

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.className = "button";
        submitButton.textContent = "Update Merchandise";

        form.append(
            merchIdInput,
            nameLabel, nameInput,
            priceLabel, priceInput,
            stockLabel, stockInput,
            submitButton
        );

        const modal = Modal({
            title: "Edit Merchandise",
            content: form,
            onClose: () => modal.remove()
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const merchData = {
                name: nameInput.value,
                price: parseFloat(priceInput.value),
                stock: parseInt(stockInput.value)
            };

            try {
                const updateResponse = await apiFetch(`/merch/${entityType}/${eventId}/${merchId}`, 'PUT', JSON.stringify(merchData), {
                    'Content-Type': 'application/json'
                });

                if (updateResponse.success) {
                    alert('Merchandise updated successfully!');
                    modal.remove();
                } else {
                    alert(`Failed to update merchandise: ${updateResponse.message}`);
                }
            } catch (error) {
                console.error('Error updating merchandise:', error);
                alert('An error occurred while updating the merchandise.');
            }
        });
    } catch (error) {
        console.error('Error fetching merchandise details:', error);
        alert('An error occurred while fetching the merchandise details.');
    }
}

function addMerchForm(entityType, eventId, merchList) {
    const form = document.createElement("form");
    form.id = "add-merch-form";

    const merchNameInput = document.createElement("input");
    merchNameInput.type = "text";
    merchNameInput.id = "merch-name";
    merchNameInput.placeholder = "Merchandise Name";
    merchNameInput.required = true;

    const merchPriceInput = document.createElement("input");
    merchPriceInput.type = "number";
    merchPriceInput.id = "merch-price";
    merchPriceInput.placeholder = "Price";
    merchPriceInput.required = true;

    const merchStockInput = document.createElement("input");
    merchStockInput.type = "number";
    merchStockInput.id = "merch-stock";
    merchStockInput.placeholder = "Stock Available";
    merchStockInput.required = true;

    const merchImageInput = document.createElement("input");
    merchImageInput.type = "file";
    merchImageInput.id = "merch-image";
    merchImageInput.accept = "image/*";

    const addButton = document.createElement("button");
    addButton.type = "submit";
    addButton.textContent = "Add Merchandise";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    form.append(
        merchNameInput,
        merchPriceInput,
        merchStockInput,
        merchImageInput,
        addButton,
        cancelButton
    );

    const modal = Modal({
        title: "Add Merchandise",
        content: form,
        onClose: () => modal.remove()
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await addMerchandise(entityType, eventId, merchList);
        modal.remove();
    });

    cancelButton.addEventListener("click", () => { modal.remove(); document.body.style.overflow = ""; });
}

function displayNewMerchandise(merchData, merchList) {
    // const merchList = document.getElementById("merch-list");

    const merchItem = document.createElement("div");
    merchItem.className = "merch-item";

    const merchName = document.createElement("h3");
    merchName.textContent = merchData.name;

    const merchPrice = document.createElement("p");
    merchPrice.textContent = `Price: $${(merchData.price / 100).toFixed(2)}`;

    const merchStock = document.createElement("p");
    merchStock.textContent = `Available: ${merchData.stock}`;

    merchItem.append(merchName, merchPrice, merchStock);

    if (merchData.merch_pic) {
        const merchImage = document.createElement("img");
        // merchImage.src = `${SRC_URL}/merchpic/${merchData.merch_pic}`;
        merchImage.src = resolveImagePath(EntityType.MERCH, PictureType.THUMB, merchData.merch_pic);
        merchImage.alt = merchData.name;
        merchImage.loading = "lazy";
        merchImage.style.maxWidth = "160px";
        merchItem.appendChild(merchImage);
    }

    merchList.prepend(merchItem);
}

// Update the usage of MerchCard in displayMerchandise
async function displayMerchandise(merchcon, merchData, entityType, eventId, isCreator, isLoggedIn) {
    merchcon.appendChild(createElement('h2', "", ["Merchandise"]));
    var merchList = document.createElement('div');
    merchList.className = "merchcon hvflex";

    if (isCreator) {
        const button = Button("Add Merchandise", "add-merch", {
            click: () => addMerchForm(entityType, eventId, merchList),
            mouseenter: () => console.log("Button hovered"),
        });

        merchcon.appendChild(button);
    }

    merchcon.appendChild(merchList);
    merchList.innerHTML = ""; // Clear existing content

    if (!Array.isArray(merchData)) {
        merchList.appendChild(createElement("p", { textContent: "Invalid merchandise data received." }));
        return;
    }

    if (merchData.length === 0) {
        merchList.appendChild(createElement("p", {}, ["No merchandise available for this event."]));
        return;
    }

    merchData.forEach((merch) => {
        const card = MerchCard({
            name: merch.name,
            price: merch.price,
            // image: `${SRC_URL}/merchpic/${merch.merch_pic}`,
            image: resolveImagePath(EntityType.MERCH, PictureType.THUMB, merch.merch_pic),
            stock: merch.stock,
            isCreator,
            isLoggedIn,
            onBuy: () => buyMerch(entityType, merch.merchid, eventId),
            onEdit: () => editMerchForm(entityType, merch.merchid, eventId),
            onDelete: () => deleteMerch(entityType, merch.merchid, eventId),
            onReport: () => reportPost(merch.merchid, "merch", entityType, eventId),
        });

        merchList.appendChild(card);
    });
}

// Wrappers for buying merch and tickets
function buyMerch(entityType, merchId, eventId, maxStock = 6) {
    handlePurchase(entityType, "merch", merchId, eventId, maxStock);
}

export { addMerchForm, addMerchandise, displayNewMerchandise, clearMerchForm, displayMerchandise, deleteMerch, editMerchForm };