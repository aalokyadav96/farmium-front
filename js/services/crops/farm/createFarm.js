import { apiFetch } from "../../../api/api.js";
import { createFarmForm } from "./createOrEditFarm.js";
import { displayFarms } from "./FarmsHome.js";

export function createFarm(isLoggedIn, container) {
    container.textContent = "";

    if (!isLoggedIn) {
        container.textContent = "Please log in to create a farm.";
        return;
    }

    const form = createFarmForm({
        isEdit: false,
        onSubmit: async (formData) => {
            const res = await apiFetch("/farms", "POST", formData, true);
            if (res.success) {
                displayFarms(container, isLoggedIn);
            } else {
                container.textContent = "❌ Failed to create farm. Please try again.";
            }
        }
    });

    container.appendChild(form);
}
