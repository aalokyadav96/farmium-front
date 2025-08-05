import { SRC_URL, apiFetch } from "../../api/api.js";
import SnackBar from "../../components/ui/Snackbar.mjs";


export function triggerBannerUpload(placeId) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("banner", file);

        try {
            const result = await apiFetch(`/places/place/${placeId}`, "PUT", formData);
            SnackBar("Banner updated successfully", 3000);
            // displayPlace(true, placeId); // re-render
        } catch (err) {
            console.error("Banner upload error:", err);
            SnackBar("Failed to update banner", 3000);
        }
    });

    document.body.appendChild(input); // required for some browsers
    input.click();
    document.body.removeChild(input);
}