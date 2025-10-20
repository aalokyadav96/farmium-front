// ========================================
// CREATOR LIVESTREAM PAGE
// ========================================
import { createElement } from "../../components/createElement.js";
import { liveFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
// import { startCreatorWebRTC } from "./creatorLive.js"; // your refactored module

export async function displayCreatorLive(isL, entityType, entityId, liveid, container) {
    while (container.firstChild) container.removeChild(container.firstChild);

    if (!entityId) {
        container.append(createElement("p", { class: "error" }, ["Invalid livestream ID."]));
        return;
    }

    const header = createElement("header", { class: "creator-header" }, [
        createElement("h1", {}, [`Creator Dashboard — ${entityType} ${entityId}`])
    ]);

    const videoWrapper = createElement("div", { class: "creator-video-wrapper", style: { position: "relative", flex: "2 1 600px" } });
    const videoEl = createElement("video", { autoplay: true, muted: true, playsinline: true, style: { width: "100%", borderRadius: "8px", backgroundColor: "#000" } });
    const statusEl = createOverlay("top", "right", "Offline");

    videoWrapper.append(videoEl, statusEl);

    // Stats / viewer count placeholder
    const statsEl = createElement("div", { class: "creator-stats", style: { marginTop: "8px" } }, [
        createElement("span", { class: "live-status" }, ["Status: Offline"])
    ]);

    // Control buttons
    const startBtn = Button("▶ Start Live", "startBtn", {}, "start-btn");
    const stopBtn = Button("⏹ Stop Live", "stopBtn", {}, "stop-btn");
    stopBtn.disabled = true;

    const controls = createElement("div", { class: "creator-controls", style: { marginTop: "12px" } }, [startBtn, stopBtn]);

    container.append(header, videoWrapper, statsEl, controls);

    let liveSession = null;

    const updateStatusUI = (text, color) => {
        statusEl.firstChild.data = text;
        statusEl.style.backgroundColor = color;
        statsEl.querySelector(".live-status").firstChild.data = `Status: ${text}`;
    };

    startBtn.addEventListener("click", async () => {
        startBtn.disabled = true;
        updateStatusUI("Starting...", "lightgray");

        liveSession = await startCreatorWebRTC(entityType, entityId, videoEl, statusEl);

        if (!liveSession) {
            updateStatusUI("Failed to start", "gray");
            startBtn.disabled = false;
            return;
        }

        stopBtn.disabled = false;
    });

    stopBtn.addEventListener("click", async () => {
        stopBtn.disabled = true;
        startBtn.disabled = false;
        if (liveSession) await liveSession.stop();
        updateStatusUI("Offline", "gray");
        videoEl.srcObject = null;
        liveSession = null;
    });

    window.addEventListener("beforeunload", () => {
        if (liveSession) liveSession.stop();
    });
}

// ========================================
// HELPER
// ========================================
function createOverlay(vertical, horizontal, text) {
    return createElement("div", {
        style: {
            position: "absolute",
            [vertical]: "10px",
            [horizontal]: "10px",
            padding: "4px 8px",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "#fff",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
            zIndex: 2
        }
    }, [document.createTextNode(text)]);
}

// // creatorLive.js
// import { liveFetch } from "../../api/api.js";

/*
  startCreatorWebRTC(entityType, entityId, videoEl, statusEl)
  - uses TURN/STUN fetched from server if available
  - encapsulates state in closure
  - prevents overlapping reconnect attempts
  - supports ICE restart instead of full teardown where possible
  - returns { stop, reconnect, getStatus }
*/
export async function startCreatorWebRTC(entityType, entityId, videoEl, statusEl) {
    let localStream = null;
    let pc = null;
    let retryCount = 0;
    const maxRetries = 2;
    let isReconnecting = false;
    let isStopped = false;

    const STATUS = {
        offline: { text: "Offline", color: "gray" },
        live: { text: "LIVE (WebRTC)", color: "red" },
        reconnecting: { text: "Reconnecting...", color: "orange" }
    };

    const updateStatus = (text, color) => {
        if (statusEl && statusEl.firstChild) {
            statusEl.firstChild.data = text;
            statusEl.style.backgroundColor = color;
        }
    };

    function stopLocal() {
        try {
            pc?.close();
        } catch (e) {}
        try {
            localStream?.getTracks().forEach(track => track.stop());
        } catch (e) {}
        pc = null;
        localStream = null;
    }

    const unloadHandler = () => {
        isStopped = true;
        stopLocal();
    };
    window.addEventListener("beforeunload", unloadHandler);

    async function fetchIceServers() {
        try {
            // attempt to get TURN credentials from server; fallback to public STUN
            const res = await liveFetch("/vlive/webrtc/turn", "GET").catch(() => null);
            if (res?.iceServers) return res.iceServers;
        } catch (e) {}
        return [
            { urls: "stun:stun.l.google.com:19302" }
        ];
    }

    async function getLocalStream(constraints = { video: { width: 1280, height: 720 }, audio: true }) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

    async function createPeerConnection(iceServers) {
        const pcLocal = new RTCPeerConnection({ iceServers });
        pcLocal.onicecandidate = e => {
            if (e.candidate) {
                // best-effort post, swallow errors
                liveFetch(`/vlive/${entityType}/${entityId}/candidate`, "POST", { candidate: e.candidate }).catch(() => {});
            }
        };

        pcLocal.onconnectionstatechange = async () => {
            const state = pcLocal.connectionState;
            if (["failed", "closed"].includes(state)) {
                console.warn(`Creator WebRTC ${state}`);
                stopLocal();
                updateStatus(STATUS.offline.text, STATUS.offline.color);
            } else if (state === "disconnected") {
                console.warn("Creator WebRTC disconnected — attempting ICE restart");
                if (isStopped) return;
                // try ICE restart first
                if (!isReconnecting && retryCount < maxRetries) {
                    isReconnecting = true;
                    retryCount++;
                    updateStatus(`${STATUS.reconnecting.text} (${retryCount}/${maxRetries})`, STATUS.reconnecting.color);
                    try {
                        const offer = await pcLocal.createOffer({ iceRestart: true });
                        await pcLocal.setLocalDescription(offer);
                        const res = await liveFetch(`/vlive/${entityType}/${entityId}/webrtc-offer`, "POST", { sdp: offer.sdp }).catch(() => null);
                        const answerSdp = res?.answer || res?.sdp || res;
                        if (answerSdp) await pcLocal.setRemoteDescription({ type: "answer", sdp: answerSdp });
                    } catch (err) {
                        console.warn("ICE restart failed, will attempt full reconnect", err);
                        // full reconnect fallback handled below by timer
                    } finally {
                        isReconnecting = false;
                    }
                }

                // schedule a more robust reconnect if still not connected
                setTimeout(() => {
                    if (pcLocal && pcLocal.connectionState !== "connected") {
                        if (retryCount < maxRetries) {
                            retryCount++;
                            stopLocal();
                            updateStatus(`Reconnecting (${retryCount}/${maxRetries})`, STATUS.reconnecting.color);
                            connect().catch(() => {});
                        } else {
                            updateStatus(STATUS.offline.text, STATUS.offline.color);
                        }
                    }
                }, 3000);
            } else if (state === "connected") {
                retryCount = 0;
                updateStatus(STATUS.live.text, STATUS.live.color);
            }
        };

        return pcLocal;
    }

    async function connect() {
        if (isStopped) return null;
        try {
            updateStatus("Starting...", "lightgray");
            const iceServers = await fetchIceServers();
            pc = await createPeerConnection(iceServers);

            localStream = await getLocalStream();
            if (videoEl) {
                try {
                    videoEl.srcObject = localStream;
                    // don't autoplay policy-fallthrough; caller mutes preview already if needed
                } catch (e) {}
            }

            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // send offer and get answer (server may accept offer and start server-side ingest)
            const res = await liveFetch(`/vlive/${entityType}/${entityId}/webrtc-offer`, "POST", { sdp: offer.sdp });
            const answerSdp = res?.answer || res?.sdp || res;
            if (!answerSdp) throw new Error("No SDP answer from server");

            await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

            updateStatus(STATUS.live.text, STATUS.live.color);

            return { pc, localStream };
        } catch (err) {
            console.error("Creator WebRTC failed", err);
            stopLocal();
            updateStatus(STATUS.offline.text, STATUS.offline.color);
            // attempt fallback if available (e.g., SRT/RTMP ingest)
            // call server to start fallback ingest process which returns an ingest endpoint
            try {
                const fallback = await liveFetch(`/vlive/${entityType}/${entityId}/start-fallback`, "POST", { reason: err?.message }).catch(() => null);
                if (fallback?.ingest) {
                    updateStatus("Using fallback ingest", "purple");
                    // server is expected to return an ingest endpoint and credentials
                    // client-side you might then spawn an uploader/encoder (outside browser scope)
                    // return fallback info so caller may handle it
                    return { fallback };
                }
            } catch (e) {}
            return null;
        }
    }

    async function stopLive() {
        isStopped = true;
        stopLocal();
        window.removeEventListener("beforeunload", unloadHandler);
        await liveFetch(`/vlive/${entityType}/${entityId}/stop`, "POST").catch(() => {});
        updateStatus(STATUS.offline.text, STATUS.offline.color);
    }

    async function reconnect() {
        if (isStopped) return null;
        if (isReconnecting) return null;
        isReconnecting = true;
        try {
            stopLocal();
            return await connect();
        } finally {
            isReconnecting = false;
        }
    }

    // start immediately
    await connect();

    return {
        stop: stopLive,
        reconnect,
        getStatus: () => pc?.connectionState || "offline"
    };
}
