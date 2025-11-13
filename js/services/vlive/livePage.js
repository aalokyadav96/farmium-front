import { createElement } from "../../components/createElement.js";
import { liveFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import Button from "../../components/base/Button.js";
// import Hls from "hls.js";

// ========================================
// MAIN ENTRY
// ========================================
export async function displayLiveStream(isLoggedIn, liveid, contentContainer) {
    clearContainer(contentContainer);
    if (!liveid) return appendError(contentContainer, "Invalid livestream ID.");

    const liveData = await fetchLiveData(liveid);
    if (!liveData) return appendError(contentContainer, "Livestream not found or has ended.");

    // --- Layout Elements ---
    const header = createHeader(liveData);
    const banner = liveData.bannerUrl ? createBanner(liveData.bannerUrl, liveData.title) : null;
    const { videoWrapper, videoEl, statusEl, viewerEl, stopSession } = createVideoSection(liveData);
    const sidebar = createSidebar(liveid, liveData);
    const stats = createStats(liveData);
    const chatSection = createChatSection(isLoggedIn, liveData);

    const mainLayout = createElement("main", { class: "live-layout" }, [videoWrapper, sidebar]);
    contentContainer.append(header);
    if (banner) contentContainer.append(banner);
    contentContainer.append(mainLayout, chatSection, stats);

    // --- Chat WebSocket ---
    if (isLoggedIn && liveData.wsUrl) {
        initWebSocket(liveData, chatSection.querySelector(".chat-log"));
    }

    // --- Cleanup ---
    const cleanup = () => stopSession?.();
    const observer = new MutationObserver(() => {
        if (!contentContainer.contains(mainLayout)) {
            cleanup();
            observer.disconnect();
        }
    });
    observer.observe(contentContainer, { childList: true, subtree: true });
    window.addEventListener("beforeunload", cleanup);
}

// ========================================
// UTILITIES
// ========================================
function clearContainer(container) {
    while (container.firstChild) container.removeChild(container.firstChild);
}

function appendError(container, msg) {
    container.append(createElement("p", { class: "error" }, [msg]));
}

// ========================================
// FETCH
// ========================================
async function fetchLiveData(liveid) {
    try {
        const res = await liveFetch(`/live/watch/${liveid}`, "GET");
        if (res && !res.error) return res;
    } catch {}
    return null;
}

// ========================================
// HEADER / BANNER
// ========================================
function createHeader(liveData) {
    return createElement("header", { class: "live-header" }, [
        createElement("div", { class: "live-header-info" }, [
            createElement("h1", { class: "live-title" }, [liveData.title || "Untitled Livestream"]),
            createElement("p", { class: "live-creator" }, [
                `By ${liveData.creatorName || "Unknown"} • ${liveData.visibility || "Public"}`
            ])
        ])
    ]);
}

function createBanner(url, title) {
    return createElement("img", { class: "live-banner", src: url, alt: title || "" });
}

// ========================================
// VIDEO SECTION (WebRTC + HLS fallback)
// ========================================
function createVideoSection(liveData) {
    const wrapper = createElement("div", { class: "live-video-wrapper", style: { position: "relative", flex: "2 1 600px" } });
    const videoEl = createElement("video", {
        class: "live-video",
        controls: true,
        autoplay: true,
        playsinline: true,
        style: { width: "100%", borderRadius: "8px", backgroundColor: "#000" }
    });
    const statusEl = createOverlay("top", "right", "Connecting...");
    const viewerEl = createOverlay("top", "left", "👀 0 watching");
    wrapper.append(videoEl, statusEl, viewerEl);

    let stopFn = null;
    (async () => { stopFn = await startLiveStream(videoEl, statusEl, viewerEl, liveData); })();

    return { videoWrapper: wrapper, videoEl, statusEl, viewerEl, stopSession: stopFn };
}

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

// ========================================
// STREAM HANDLER
// ========================================
async function startLiveStream(videoEl, statusEl, viewerEl, liveData) {
    let pc = null;
    let retryCount = 0;
    let stopPolling = null;
    const maxRetries = 3;

    const updateStatus = (text, color) => {
        statusEl.firstChild.data = text;
        statusEl.style.backgroundColor = color;
    };

    async function connectWebRTC() {
        try {
            if (!liveData.webrtcOffer) throw "No WebRTC offer";

            pc = new RTCPeerConnection({
                iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
            });

            pc.ontrack = e => { if (e.streams?.[0]) videoEl.srcObject = e.streams[0]; };
            pc.onicecandidate = e => {
                if (e.candidate)
                    liveFetch(`/live/watch/${liveData.id}/candidate`, "POST", { candidate: e.candidate }).catch(() => {});
            };

            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                if (["failed", "disconnected", "closed"].includes(state)) handleConnectionFailure();
            };

            updateStatus("Connecting (WebRTC)...", "orange");
            await pc.setRemoteDescription({ type: "offer", sdp: liveData.webrtcOffer });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await liveFetch(`/live/watch/${liveData.id}/webrtc-answer`, "POST", { sdp: answer.sdp });

            updateStatus("LIVE (WebRTC)", "red");
            stopPolling = startViewerPolling(viewerEl, liveData.liveid);
        } catch {
            handleConnectionFailure();
        }
    }

    function handleConnectionFailure() {
        if (retryCount < maxRetries) {
            retryCount++;
            updateStatus(`Reconnecting... (${retryCount}/${maxRetries})`, "orange");
            setTimeout(connectWebRTC, 2000);
        } else {
            fallbackHLS();
        }
    }

    function fallbackHLS() {
        updateStatus("LIVE (HLS Fallback)", "purple");
        if (!liveData.streamUrl) {
            updateStatus("Offline", "gray");
            return;
        }

        // if (Hls.isSupported() && liveData.streamUrl.endsWith(".m3u8")) {
        //     const hls = new Hls();
        //     hls.loadSource(liveData.streamUrl);
        //     hls.attachMedia(videoEl);
        // } else {
            videoEl.src = liveData.streamUrl;
        // }
        stopPolling = startViewerPolling(viewerEl, liveData.liveid);
    }

    await connectWebRTC();

    return () => {
        pc?.close();
        pc = null;
        videoEl.srcObject = null;
        stopPolling?.();
    };
}

// ========================================
// VIEWER COUNT POLLING
// ========================================
function startViewerPolling(viewerEl, liveid) {
    const interval = setInterval(async () => {
        try {
            const res = await liveFetch(`/vlive/${liveid}/viewers`, "GET");
            viewerEl.firstChild.data = `👀 ${res?.count || 0} watching`;
        } catch {}
    }, 5000);
    return () => clearInterval(interval);
}

// ========================================
// SIDEBAR (LIKE / FOLLOW)
// ========================================
function createSidebar(liveid, liveData) {
    const sidebar = createElement("aside", { class: "live-sidebar" });

    const likeBtn = Button(`👍 Like (${liveData.likes || 0})`, "likeBtn", {}, "like-btn");
    const followBtn = Button("🔔 Follow", "followBtn", {}, "follow-btn");

    likeBtn.addEventListener("click", async () => {
        const res = await liveFetch(`/live/like/${liveid}`, "POST");
        if (res?.success) likeBtn.firstChild.data = `👍 Like (${res.likes})`;
    });

    followBtn.addEventListener("click", async () => {
        const user = getState("user");
        if (!user) return alert("You must be logged in to follow.");
        const res = await liveFetch(`/live/follow/${liveData.creatorId}`, "POST");
        if (res?.success) followBtn.firstChild.data = "✅ Following";
    });

    sidebar.append(likeBtn, followBtn);
    return sidebar;
}

// ========================================
// CHAT SECTION
// ========================================
function createChatSection(isLoggedIn, liveData) {
    const chatLog = createElement("div", { class: "chat-log" });

    if (!isLoggedIn) {
        return createElement("section", { class: "login-reminder" }, [
            createElement("p", {}, ["Login to participate in live chat."])
        ]);
    }

    const chatInput = createElement("input", { type: "text", class: "chat-input", placeholder: "Type a message..." });
    const sendBtn = Button("Send", "chatSendBtn", {}, "chat-send-btn");
    const chatForm = createElement("div", { class: "chat-form" }, [chatInput, sendBtn]);
    const chatSection = createElement("section", { class: "live-chat" }, [
        createElement("h3", { class: "chat-title" }, ["Live Chat"]),
        chatLog,
        chatForm
    ]);

    const escapeHTML = str => str.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m]));

    function addChatMessage(user, msg, system = false) {
        const messageClass = system ? "chat-system" : "chat-message";
        const msgNode = createElement("div", { class: messageClass }, [
            createElement("span", { class: "chat-user" }, [escapeHTML(user)]),
            createElement("span", { class: "chat-text" }, [`: ${escapeHTML(msg)}`])
        ]);
        chatLog.append(msgNode);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function sendMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        const user = getState("user") || "Anonymous";
        addChatMessage(user, msg);
        if (window.liveSocket && window.liveSocket.readyState === WebSocket.OPEN) {
            window.liveSocket.send(JSON.stringify({ type: "chat", user, message: msg }));
        }
        chatInput.value = "";
    }

    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

    return chatSection;
}

// ========================================
// WEBSOCKET CHAT HANDLER
// ========================================
function initWebSocket(liveData, chatLog) {
    if (window.liveSocket) window.liveSocket.close();

    const userId = getState("user") || "guest";
    const socket = new WebSocket(`${liveData.wsUrl}?liveid=${liveData.id}&user=${userId}`);
    window.liveSocket = socket;

    const escapeHTML = str => str.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m]));

    const addChatMessage = (user, msg, system = false) => {
        const msgNode = createElement("div", { class: system ? "chat-system" : "chat-message" }, [
            createElement("span", { class: "chat-user" }, [escapeHTML(user)]),
            createElement("span", { class: "chat-text" }, [`: ${escapeHTML(msg)}`])
        ]);
        chatLog.append(msgNode);
        chatLog.scrollTop = chatLog.scrollHeight;
    };

    socket.addEventListener("open", () => addChatMessage("System", "Connected to chat.", true));
    socket.addEventListener("message", e => {
        try {
            const data = JSON.parse(e.data);
            if (data.type === "chat") addChatMessage(data.user || "Anonymous", data.message);
        } catch {}
    });
    socket.addEventListener("close", () => {
        addChatMessage("System", "Disconnected. Reconnecting...", true);
        setTimeout(() => initWebSocket(liveData, chatLog), 2500);
    });
    socket.addEventListener("error", () => socket.close());
}

// ========================================
// STATS
// ========================================
function createStats(liveData) {
    return createElement("div", { class: "live-stats" }, [
        createElement("span", { class: "live-views" }, [`👀 ${liveData.views || 0} watching`]),
        createElement("span", { class: "live-likes" }, [`❤️ ${liveData.likes || 0} likes`])
    ]);
}