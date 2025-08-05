import { apiFetch } from "../../api/api";

async function uploadBanner(file) {
    const formData = new FormData();
    formData.append("banner", file);

    const response = await apiFetch("/upload/banner", "POST", formData, {
        headers: {} // Let browser set Content-Type (multipart/form-data)
    });

    if (!response.ok) throw new Error("Upload failed");

    const result = await response.json();
    return result.bannerUrl; // Adjust this based on your backend response
}

export { uploadBanner };
