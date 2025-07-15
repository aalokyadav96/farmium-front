import { apiFetch } from "../../api/api.js";

export async function toggleLike(entityType, entityId) {
    const path = `/likes/${entityType}/${entityId}`;
    const response = await apiFetch(path, "POST");
    // Expecting JSON: { liked: boolean, count: number }
    return await response;
}