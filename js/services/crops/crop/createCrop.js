import { createCommonCropForm } from "./createOrEditCrop.js";
import { apiFetch } from "../../../api/api.js";

// export default function createCropPage({ farmName }) {
export async function createCrop(farmName, container) {
    // const container = document.createElement("div");

    const form = createCommonCropForm({
        currentFarmName: farmName,
        isEdit: false,
        onSubmit: async (formData, submitBtn) => {
            submitBtn.disabled = true;
            try {
                const res = await apiFetch(`/farms/${farmName}/crops`, "POST", formData);
                container.textContent = "✅ Crop created successfully.";
            } catch (err) {
                container.textContent = `❌ ${err.message}`;
            } finally {
                submitBtn.disabled = false;
            }
        }
    });

    container.appendChild(form);
    return container;
}
