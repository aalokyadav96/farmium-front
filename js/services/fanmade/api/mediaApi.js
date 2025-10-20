import { apiFetch } from "../../../api/api.js";
import { FILEDROP_URL } from "../../../state/state.js";
import { UploadStore } from "../store/uploadStore.js";

export async function fetchMedia(entityType, entityId) {
  return await apiFetch(`/fanmade/${entityType}/${entityId}`);
}

export async function deleteMedia(mediaId, entityType, entityId) {
  return await apiFetch(`/fanmade/${entityType}/${entityId}/${mediaId}`, "DELETE");
}

export async function postMedia(entityType, entityId, payload) {
  return await apiFetch(`/fanmade/${entityType}/${entityId}`, "POST", payload, { json: true });
}

export function uploadFile(u) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    UploadStore.controllers[u.id] = xhr;
    const formData = new FormData();
    formData.append(u.mediaEntity, u.file);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable)
        UploadStore.update(u.id, { progress: Math.round((e.loaded / e.total) * 100) });
    };

    xhr.onload = () => {
      delete UploadStore.controllers[u.id];
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(Array.isArray(data) ? data[0] : data);
        } catch {
          reject(new Error("Invalid FILEDROP response"));
        }
      } else reject(new Error(xhr.statusText));
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Upload canceled"));
    xhr.open("POST", FILEDROP_URL);
    xhr.send(formData);
  });
}
