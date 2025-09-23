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
 * Add Menu Form modal
 */
function addMenuForm(placeId, menuList) {
    const form = createElement('form', { id: 'add-menu-form', class: 'create-section' });

    const fields = [
        { label: "Menu Name", type: "text", id: "menu-name", name: "name", placeholder: "Menu Name", required: true },
        { label: "Price", type: "number", id: "menu-price", name: "price", placeholder: "Price", required: true, additionalProps: { min: 0, step: "0.01" } },
        { label: "Stock Available", type: "number", id: "menu-stock", name: "stock", placeholder: "Stock Available", required: true, additionalProps: { min: 0 } },
        { label: "Menu Image", type: "file", id: "menu-image", name: "image", additionalProps: { accept: "image/*" } }
    ];

    fields.forEach(f => form.appendChild(createFormGroup(f)));

    // Defensive: ensure name attributes
    Object.entries({ "menu-name": "name", "menu-price": "price", "menu-stock": "stock", "menu-image": "image" })
        .forEach(([id, name]) => { const el = form.querySelector(`#${id}`); if (el) el.name = name; });

    const addButton = Button("Add Menu", "", {}, "buttonx");
    addButton.type = 'submit';
    const cancelButton = Button("Cancel", "", {}, "buttonx");
    cancelButton.type = 'button';
    form.append(addButton, cancelButton);

    const modal = Modal({
        title: "Add Menu",
        content: form,
        onClose: () => modal.close()
    });

    cancelButton.addEventListener("click", () => modal.close());

    form.addEventListener("submit", async e => {
        e.preventDefault();

        const price = parseFloat(form.querySelector("#menu-price").value);
        if (isNaN(price) || price < 0) {
            Notify("Invalid price value. Must be a non-negative number.", { type: "error" });
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        await addMenu(form, placeId, menuList);
        modal.close();
    });
}

/**
 * Edit Menu Form modal
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
        Object.entries({ "menu-name": "name", "menu-price": "price", "menu-stock": "stock" })
            .forEach(([id, name]) => { const el = form.querySelector(`#${id}`); if (el) el.name = name; });

        const submitButton = Button("Update Menu", "", {}, "buttonx");
        submitButton.type = 'submit';
        const cancelButton = Button("Cancel", "", {}, "buttonx");
        cancelButton.type = 'button';
        form.append(submitButton, cancelButton);

        const modal = Modal({
            title: "Edit Menu",
            content: form,
            onClose: () => modal.close()
        });

        cancelButton.addEventListener("click", () => modal.close());

        form.addEventListener("submit", async e => {
            e.preventDefault();
            const price = parseFloat(form.querySelector("#menu-price").value);
            if (isNaN(price) || price < 0) {
                Notify("Invalid price value. Must be a non-negative number.", { type: "error" });
                return;
            }
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const updatedMenu = {
                name: form.querySelector("#menu-name").value,
                price,
                stock: parseInt(form.querySelector("#menu-stock").value, 10)
            };

            try {
                const res = await apiFetch(`/places/menu/${placeId}/${menuId}`, 'PUT', JSON.stringify(updatedMenu), { 'Content-Type': 'application/json' });
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
export async function displayMenu(container, placeId, isCreator, isLoggedIn) {
    container.replaceChildren();
    const menuList = createElement('div', { class: "hvflex menulist" });
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
 * Prompt special note + quantity before buying menu
 */
function promptMenuNote(menu, placeId) {
    const noteLabel = createElement("label", { for: "menu-note" }, ["Special request (optional)"]);
    const textarea = createElement("textarea", {
        id: "menu-note",
        rows: "3",
        placeholder: "e.g. Less spicy, no onions..."
    });

    const quantityLabel = createElement("label", { for: "menu-quantity" }, ["Quantity"]);
    const quantityInput = createElement("input", {
        type: "number",
        id: "menu-quantity",
        name: "menu-quantity",
        min: 1,
        value: 1
    });

    const wrapper = createElement("div", { class: "modal-form-group" }, [
        noteLabel,
        textarea,
        quantityLabel,
        quantityInput
    ]);

    let modal;
    modal = Modal({
        title: `Customize: ${menu.name}`,
        content: wrapper,
        autofocusSelector: "#menu-note",
        actions: () => {
            const confirmBtn = createElement("button", {
                type: "button",
                class: "modal-confirm"
            }, ["Next"]);

            confirmBtn.addEventListener("click", async () => {
                const note = textarea.value.trim();
                const quantity = parseInt(quantityInput.value, 10);

                if (isNaN(quantity) || quantity < 1) {
                    Notify("⚠️ Please enter a valid quantity.", { type: "warning" });
                    return;
                }

                try {
                    // Check stock before purchase
                    const { stock } = await apiFetch(`/places/menu/${placeId}/${menu.menuid}/stock`);
                    if (stock <= 0) {
                        Notify("❌ Out of stock.", { type: "warning" });
                        return;
                    }
                    if (quantity > stock) {
                        Notify(`⚠️ Only ${stock} available.`, { type: "warning" });
                        return;
                    }

                    modal.close();
                    await handlePurchase("menu", menu.menuid, placeId, quantity, note);
                } catch (err) {
                    console.error(err);
                    Notify(`Error fetching stock: ${err.message}`, { type: "error" });
                }
            });

            return confirmBtn;
        }
    });
}
