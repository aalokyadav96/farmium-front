import { apiFetch } from "../../api/api.js";
import MenuCard from '../../components/ui/MenuCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import { handlePurchase } from "../payment/pay.js";
import { EntityType, PictureType, resolveImagePath } from "../../utils/imagePaths.js";
import Notify from "../../components/ui/Notify.mjs";
import { createFormGroup } from "../../components/createFormGroup.js";

/**
 * Add a menu item
 */
async function addMenu(form, placeId, menuList) {
    const formData = new FormData(form);

    // Validate fields using HTML5 validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const response = await apiFetch(`/places/menu/${placeId}`, 'POST', formData);

        if (response?.data?.menuid) {
            Notify("Menu added successfully!", { type: "success", duration: 3000, dismissible: true });
            const menuCard = createMenuCard(response.data, true, true, placeId);
            menuList.prepend(menuCard);
            form.reset();
        } else {
            Notify(`Failed to add Menu: ${response?.message || 'Unknown error'}`, { type: "error" });
        }
    } catch (error) {
        Notify(`Error adding Menu: ${error.message}`, { type: "error" });
    }
}

/**
 * Delete a menu item
 */
async function deleteMenu(menuId, placeId) {
    if (!confirm('Are you sure you want to delete this Menu?')) return;

    try {
        const response = await apiFetch(`/places/menu/${placeId}/${menuId}`, 'DELETE');

        if (response.success) {
            Notify("Menu deleted successfully!", { type: "success", duration: 3000, dismissible: true });
            const menuItem = document.getElementById(`menu-${menuId}`);
            if (menuItem) menuItem.remove();
        } else {
            Notify(`Failed to delete Menu: ${response?.message || 'Unknown error'}`, { type: "error" });
        }
    } catch (error) {
        console.error(error);
        Notify(`Error deleting Menu: ${error.message}`, { type: "error" });
    }
}

/**
 * Create a MenuCard element
 */
function createMenuCard(menu, isCreator, isLoggedIn, placeId) {
    return MenuCard({
        name: menu.name,
        price: menu.price,
        image: resolveImagePath(EntityType.MENU, PictureType.THUMB, menu.menu_pic),
        stock: menu.stock,
        isCreator,
        isLoggedIn,
        onBuy: () => promptMenuNote(menu, placeId),
        onEdit: () => editMenuForm(menu.menuid, placeId),
        onDelete: () => deleteMenu(menu.menuid, placeId)
    });
}

/**
 * Open Add Menu Form modal
 */
function addMenuForm(placeId, menuList) {
    const form = createElement('form', { id: 'add-menu-form', class: 'create-section' });

    const fields = [
        { label: "Menu Name", type: "text", id: "menu-name", name: "name", placeholder: "Menu Name", required: true },
        { label: "Price", type: "number", id: "menu-price", name: "price", placeholder: "Price", required: true, additionalProps: { min: 0, step: "0.01" } },
        { label: "Stock Available", type: "number", id: "menu-stock", name: "stock", placeholder: "Stock Available", required: true, additionalProps: { min: 0 } },
        { label: "Menu Image", type: "file", id: "menu-image", name: "image", additionalProps: { accept: "image/*" } }
    ];

    // createFormGroup may or may not set the 'name' attribute correctly depending on its implementation.
    // Create the groups then force the name attributes so FormData(form) always includes them.
    fields.forEach(f => form.appendChild(createFormGroup(f)));

    // Ensure inputs have correct names (defensive)
    const map = {
        "menu-name": "name",
        "menu-price": "price",
        "menu-stock": "stock",
        "menu-image": "image"
    };
    Object.entries(map).forEach(([id, name]) => {
        const el = form.querySelector(`#${id}`);
        if (el) el.name = name;
    });

    const addButton = Button("Add Menu", "", {}, "buttonx");
    // ensure it's an actual submit button
    addButton.setAttribute && addButton.setAttribute('type', 'submit');
    addButton.type = 'submit';

    const cancelButton = Button("Cancel", "", {}, "buttonx");
    cancelButton.setAttribute && cancelButton.setAttribute('type', 'button');

    form.append(addButton, cancelButton);

    const modal = Modal({
        title: "Add Menu",
        content: form,
        onClose: () => modal.remove()
    });

    // wire cancel after modal creation so modal reference exists
    cancelButton.addEventListener && cancelButton.addEventListener('click', () => modal.close());

    form.addEventListener("submit", async e => {
        e.preventDefault();

        // parse and validate price (allow 0 and above)
        const priceRaw = form.querySelector("#menu-price")?.value;
        const price = parseFloat(priceRaw);
        if (isNaN(price) || price < 0) {
            Notify("Invalid price value. Must be a non-negative number.", { type: "error" });
            return;
        }

        // validate HTML5 required fields
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        await addMenu(form, placeId, menuList);
        modal.remove();
    });
}

/**
 * Open Edit Menu Form modal
 */
async function editMenuForm(menuId, placeId) {
    try {
        const menu = await apiFetch(`/places/menu/${placeId}/${menuId}`, 'GET');

        const form = createElement('form', { id: 'edit-menu-form' });

        const fields = [
            { label: "Menu Name", type: "text", id: "menu-name", name: "name", value: menu.name, required: true },
            { label: "Price", type: "number", id: "menu-price", name: "price", value: menu.price, required: true, additionalProps: { min: 0, step: "0.01" } },
            { label: "Stock Available", type: "number", id: "menu-stock", name: "stock", value: menu.stock, required: true, additionalProps: { min: 0 } }
        ];

        fields.forEach(f => form.appendChild(createFormGroup(f)));

        // Defensive: ensure name attributes exist (so PUT payload / form access is consistent)
        const map = { "menu-name": "name", "menu-price": "price", "menu-stock": "stock" };
        Object.entries(map).forEach(([id, name]) => {
            const el = form.querySelector(`#${id}`);
            if (el) el.name = name;
        });

        const submitButton = Button("Update Menu", "", {}, "buttonx");
        submitButton.setAttribute && submitButton.setAttribute('type', 'submit');
        submitButton.type = 'submit';

        const cancelButton = Button("Cancel", "", {}, "buttonx");
        cancelButton.setAttribute && cancelButton.setAttribute('type', 'button');

        form.append(submitButton, cancelButton);

        const modal = Modal({
            title: "Edit Menu",
            content: form,
            onClose: () => modal.remove()
        });

        cancelButton.addEventListener && cancelButton.addEventListener('click', () => modal.close());

        form.addEventListener("submit", async e => {
            e.preventDefault();

            // allow 0 and above
            const priceRaw = form.querySelector("#menu-price")?.value;
            const price = parseFloat(priceRaw);
            if (isNaN(price) || price < 0) {
                Notify("Invalid price value. Must be a non-negative number.", { type: "error" });
                return;
            }

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const updatedMenu = {
                name: form.querySelector("#menu-name").value,
                price,
                stock: parseInt(form.querySelector("#menu-stock").value, 10)
            };

            try {
                const res = await apiFetch(
                    `/places/menu/${placeId}/${menuId}`,
                    'PUT',
                    JSON.stringify(updatedMenu),
                    { 'Content-Type': 'application/json' }
                );

                if (res.success) {
                    Notify("Menu updated successfully!", { type: "success", duration: 3000 });
                    modal.close();
                } else {
                    Notify(`Failed to update menu: ${res.message}`, { type: "error" });
                }
            } catch (err) {
                Notify(`Error updating menu: ${err.message}`, { type: "error" });
            }
        });

    } catch (err) {
        Notify(`Failed to fetch menu: ${err.message}`, { type: "error" });
    }
}


/**
 * Display list of menu items
 */
async function displayMenu(container, placeId, isCreator, isLoggedIn) {
    container.innerHTML = "";
    const menuList = createElement('div', { class: "hvflex" });
    container.appendChild(menuList);

    const menuData = await apiFetch(`/places/menu/${placeId}`);

    if (isCreator) {
        const addBtn = Button("Add Menu", "add-menu-btn", { click: () => addMenuForm(placeId, menuList) }, "buttonx");
        container.prepend(addBtn);
    }

    if (!Array.isArray(menuData) || menuData.length === 0) {
        menuList.appendChild(createElement("p", {}, ["No Menu available for this place."]));
        return;
    }

    menuData.forEach(menu => menuList.appendChild(createMenuCard(menu, isCreator, isLoggedIn, placeId)));
}

/**
 * Prompt special note before buying menu
 */
function promptMenuNote(menu, placeId) {
    Modal({
        title: `Customize: ${menu.name}`,
        content: `
            <label for="menu-note">Special request (optional)</label>
            <textarea id="menu-note" rows="3" placeholder="e.g. Less spicy, no onions..."></textarea>
        `,
        onConfirm: () => {
            const note = document.getElementById('menu-note').value.trim();
            buyMenu(menu.menuid, placeId, note);
        },
        autofocusSelector: "#menu-note"
    });
}

/**
 * Buy menu item
 */
async function buyMenu(menuId, placeId, note = "") {
    try {
        const { stock } = await apiFetch(`/places/menu/${placeId}/${menuId}/stock`);
        if (stock <= 0) return Notify("❌ Out of stock.", { type: "warning" });

        handlePurchase("menu", menuId, placeId, 3, stock, note);

    } catch (err) {
        console.error(err);
        Notify(`Error: ${err.message}`, { type: "error" });
    }
}

/**
 * Clear menu list
 */
function clearMenuForm(menuList) {
    menuList.innerHTML = "";
}

export { addMenuForm, addMenu, clearMenuForm, displayMenu, deleteMenu, editMenuForm, buyMenu };

