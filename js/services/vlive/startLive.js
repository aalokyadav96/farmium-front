// startLive.js
import { liveFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import { navigate } from "../../routes/index.js";
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import Modal from "../../components/ui/Modal.mjs";
import { uploadFile } from "../media/api/mediaApi.js";
// import { startCreatorWebRTC } from "./creatorLive.js";

export function goLiveWithTitle(entityType, entityId, visibility = "public") {
    const bannerPreview = createElement("img", { id: "live-banner-preview", class: "live-banner-preview" });

    const content = () => {
        const form = createElement("div", { class: "live-form" }, [
            createElement("label", {}, ["Title"]),
            createElement("input", { type: "text", id: "live-title", placeholder: "Enter livestream title" }),
            createElement("label", {}, ["Banner (optional)"]),
            bannerPreview,
            createElement("input", { type: "file", id: "live-banner", accept: "image/*" })
        ]);

        let bannerUrl = "";
        form.querySelector("#live-banner").addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) { bannerUrl = ""; bannerPreview.src = ""; bannerPreview.classList.remove("visible"); return; }

            const uploadRes = await uploadFile({ id: "banner-upload", mediaEntity: "live", file });
            if (uploadRes?.filename) {
                bannerUrl = uploadRes.filename;
                bannerPreview.src = bannerUrl;
                bannerPreview.classList.add("visible");
            }
        });

        return form;
    };

    const actions = () => createElement("div", { class: "modal-actions" }, [
        Button("Cancel", "", { click: () => modal.close() }, "buttonx"),
        Button("Go Live", "", {
            click: async () => {
                const title = document.getElementById("live-title").value.trim();
                if (!title) return alert("Please enter a title.");

                const bannerFile = document.getElementById("live-banner").files[0];
                let bannerArg = null;
                if (bannerFile) bannerArg = bannerFile;

                // Initialize livestream on backend but do NOT start WebRTC here
                const live = await initLivestream(entityType, entityId, title, visibility, bannerArg);
                if (!live?.liveid) return alert("Failed to start livestream.");

                modal.close();

                // Navigate creator to the live page where the WebRTC session starts
                // navigate(`/live/${live.liveid}`);
                navigate(`/live/${entityType}/${entityId}/${live.liveid}`);
            }
        }, "buttonx primary")
    ]);

    const modal = Modal({ title: "Go Live", content, actions, size: "medium" });
    return { modal };
}

// --- initLivestream updated for modal-free start ---
export async function initLivestream(entityType, entityId, title, visibility = "public", bannerFileOrObj = null) {
    const userId = getState("user");
    if (!userId) {
        alert("You must be logged in to start a live session.");
        return null;
    }

    // check existing active session
    const existing = await liveFetch(`/live/active?creator=${userId}&entityType=${entityType}&entityId=${entityId}`, "GET");
    if (existing?.liveid) {
        // navigate(`/live/${existing.liveid}`);
        navigate(`/live/${entityType}/${entityId}/${existing.liveid}`);
        return existing;
    }

    // normalize bannerUrl
    let bannerUrl = "";
    if (bannerFileOrObj) {
        if (typeof bannerFileOrObj === "object" && bannerFileOrObj.filename) bannerUrl = bannerFileOrObj.filename;
        else if (bannerFileOrObj instanceof File) {
            const uploadRes = await uploadFile({ id: "banner-upload", mediaEntity: "live", file: bannerFileOrObj });
            bannerUrl = uploadRes?.filename || "";
        }
    }

    const payload = { creatorId: userId, entityType, entityId, title, visibility, bannerUrl };
    const live = await liveFetch("/live/init", "POST", payload);
    if (!live?.liveid) return null;

    // Do NOT start WebRTC here; session will start on livestream page
    return live;
}


// === SCHEDULE LIVE ===
export function scheduleLivestream(entityType, entityId) {
    let bannerUrl = ""; // store uploaded banner URL here
    const bannerPreview = createElement("img", { id: "live-banner-preview", class: "live-banner-preview" });

    const content = () => {
        const form = createElement("div", { class: "live-form" }, [
            createElement("label", {}, ["Title"]),
            createElement("input", { type: "text", id: "live-title", placeholder: "Enter livestream title" }),
            createElement("label", {}, ["Banner Image"]),
            bannerPreview,
            createElement("input", { type: "file", id: "live-banner", accept: "image/*" }),
            createElement("label", {}, ["Date"]),
            createElement("input", { type: "date", id: "live-date" }),
            createElement("label", {}, ["Time"]),
            createElement("input", { type: "time", id: "live-time" }),
            createElement("label", {}, ["Visibility"]),
            createElement("select", { id: "live-visibility" }, [
                createElement("option", { value: "public" }, ["Public"]),
                createElement("option", { value: "private" }, ["Private"]),
                createElement("option", { value: "members" }, ["Members Only"])
            ])
        ]);

        form.querySelector("#live-banner").addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) {
                bannerUrl = "";
                bannerPreview.src = "";
                bannerPreview.classList.remove("visible");
                return;
            }

            const uploadRes = await uploadFile({ id: "banner-upload", mediaEntity: "live", file });
            if (uploadRes?.filename) {
                bannerUrl = uploadRes.filename;
                bannerPreview.src = bannerUrl;
                bannerPreview.classList.add("visible");
            }
        });

        return form;
    };

    const actions = () => createElement("div", { class: "modal-actions" }, [
        Button("Cancel", "", { click: () => modal.close() }),
        Button("Schedule", "", {
            click: async () => {
                const title = document.getElementById("live-title").value.trim();
                const date = document.getElementById("live-date").value;
                const time = document.getElementById("live-time").value;
                const visibility = document.getElementById("live-visibility").value;

                if (!title || !date || !time) {
                    alert("Please fill all required fields.");
                    return;
                }

                const scheduledAt = new Date(`${date}T${time}`);
                if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
                    alert("Please select a future date and time.");
                    return;
                }

                const ok = await sendScheduleRequest(entityType, entityId, title, visibility, scheduledAt.toISOString(), bannerUrl);
                if (ok) {
                    alert("Livestream scheduled successfully.");
                    modal.close();
                } else {
                    alert("Failed to schedule livestream.");
                }
            }
        }, "buttonx primary")
    ]);

    const modal = Modal({ title: "Schedule Livestream", content, actions, size: "medium" });
    return { modal };
}

// === API helper ===
async function sendScheduleRequest(entityType, entityId, title, visibility, scheduledAt, bannerUrl) {
    const userId = getState("user");
    if (!userId) return false;

    const payload = {
        creatorId: userId,
        entityType,
        entityId,
        title,
        visibility,
        scheduledAt,
        bannerUrl
    };

    const res = await liveFetch("/live/schedule", "POST", payload);
    return !!(res?.liveid || res?.id);
}
