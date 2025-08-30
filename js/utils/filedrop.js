import { apiFetch } from "../api/api";
import { createElement } from "../components/createElement";
import { CDN_URL } from "../state/state";
// import { EntityType, PictureType } from "../../utils/imagePaths.js";
import Notify from "../../components/ui/Notify.mjs";

const CHUNK_SIZE = 256 * 1024; // 256KB

export async function uploadChunk(formData, signal) {
    const res = await fetch(`${CDN_URL}/uploads/chunk`, {
        method: "POST",
        body: formData,
        signal
    });

    if (!res.ok) throw new Error("Chunk upload failed");
    return await res.json();
}

export async function uploadFileInChunks({
    file,
    entityType,
    pictureType,
    entityId,
    token,
    signal,
    onProgress = () => {},
    maxRetries = 3
}) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedBytes = 0;

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("meta", JSON.stringify({
            fileName: file.name,
            chunkIndex: i,
            totalChunks,
            entityType,
            pictureType,
            entityId,
            token
        }));

        let attempt = 0;
        let success = false;
        while (attempt < maxRetries && !success) {
            try {
                await uploadChunk(formData, signal);
                success = true;
            } catch (err) {
                attempt++;
                if (attempt === maxRetries) throw err;
                await new Promise(res => setTimeout(res, 500 * attempt));
            }
        }

        uploadedBytes += chunk.size;
        const percent = Math.round((uploadedBytes / file.size) * 100);
        onProgress(percent);
    }

    return { fileName: file.name, status: "uploaded" };
}

async function fileAlreadyExists({ entityType, pictureType, entityId, fileName }) {
    try {
        const res = await fetch(
            `${CDN_URL}/uploads/exists?entityType=${entityType}&pictureType=${pictureType}&entityId=${entityId}&fileName=${encodeURIComponent(fileName)}`,
            { method: 'HEAD' }
        );
        return res.ok;
    } catch {
        return false;
    }
}

// async function fileAlreadyExists({ entityType, pictureType, entityId, fileName }) {
//     try {
//         const res = await apiFetch(`/uploads/exists?entityType=${entityType}&pictureType=${pictureType}&entityId=${entityId}&fileName=${encodeURIComponent(fileName)}`, 'HEAD');
//         return res?.ok;
//     } catch {
//         return false;
//     }
// }

export function uploadImagesWithQueue({
    files,
    entityType,
    pictureType,
    entityId,
    token,
    containerEl,
    onComplete = () => {},
    onError = () => {},
    concurrency = 3
}) {
    const allowedTypes = ["image/jpeg", "image/png"];
    const queue = files.filter(file => allowedTypes.includes(file.type));
    const uploaded = [];
    const failed = [];
    const controllers = [];

    if (queue.length < files.length) {
        Notify("Only .jpg and .png files are allowed.", {type:"success",duration:3000, dismissible:true});
    }

    const slots = Array.from({ length: concurrency }, (_, i) => startNext(i));

    function createProgressBar(fileName) {
        const label = createElement("div", {}, [`Uploading ${fileName}`]);
        const bar = createElement("progress", { max: 100, value: 0 });
        const wrapper = createElement("div", { class: "upload-progress-wrapper" }, [label, bar]);
        containerEl.appendChild(wrapper);
        return bar;
    }

    async function startNext(slotId) {
        if (!queue.length) return;

        const file = queue.shift();
        const controller = new AbortController();
        controllers.push(controller);

        const bar = createProgressBar(file.name);

        try {
            const result = await uploadFileInChunks({
                file,
                entityType,
                pictureType,
                entityId,
                token,
                signal: controller.signal,
                onProgress: percent => bar.value = percent
            });
            uploaded.push(result);
        } catch (err) {
            failed.push({ file, error: err.message });
            bar.value = 0;
            bar.classList.add("error");
            Notify(`Upload failed: ${file.name}`, {type:"success",duration:3000, dismissible:true});
        }

        await startNext(slotId);
    }

    Promise.all(slots).then(() => {
        if (uploaded.length) onComplete(uploaded);
        if (failed.length) onError(failed);
    });

    return {
        cancelAll: () => controllers.forEach(ctrl => ctrl.abort())
    };
}

