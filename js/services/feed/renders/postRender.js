import { createActions, createPostHeader, fetchUserMetaLikesBatch } from "./helpers.js";
import { createElement } from "../../../components/createElement.js";
import { RenderImagePost } from "../renderImagePost.js";
import { RenderVideoPost } from "../renderVideoPost.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { getState } from "../../../state/state.js";

export async function renderPost(posts, postsContainer) {
    if (!Array.isArray(posts)) posts = [posts];

    const isLoggedIn = Boolean(getState("token"));
    const user = getState("user");

    let userLikes = {};
    if (isLoggedIn && posts.length) {
        const postIds = posts.map(p => p.postid);
        userLikes = await fetchUserMetaLikesBatch("feed", postIds);
    }

    posts.forEach((post, i) => {
        const isCreator = isLoggedIn && user === post.userid;

        const postElement = createElement("article", {
            class: "feed-item",
            id: `post-${post.postid}`,
            href: `./feedpost/${post.postid}`,
            "date-is": new Date(post.timestamp).toLocaleString()
        }, []);

        // --- 1. Media ---
        const mediaContainerId = `post-media-${post.postid}`;
        const mediaContainer = createElement("div", { id: mediaContainerId, class: "post-media" });
        const mediaUrls = Array.isArray(post.media_url) ? post.media_url : (post.media_url ? [post.media_url] : []);

        const renderers = {
            image: () => RenderImagePost(mediaContainer, mediaUrls),
            video: () => {
                const videos = mediaUrls.map(m => resolveImagePath(EntityType.FEED, PictureType.VIDEO, m));
                const videoWrapper = createElement("div", { class: "video-wrapper" });

                // Render the actual video inside the wrapper
                RenderVideoPost(videoWrapper, videos, mediaUrls, post.resolution);

                const videoEl = videoWrapper.querySelector("video");
                if (!videoEl) return;

                // Mark wrapper with an id so we can track it
                if (!videoWrapper.dataset.wrapperId) {
                    videoWrapper.dataset.wrapperId = `vw-${Math.random().toString(36).slice(2, 9)}`;
                }
                // Store reference to original container id
                videoWrapper.dataset.originalContainerId = mediaContainerId;

                // Keep original in place; floating clone will be created by observer
                mediaContainer.appendChild(videoWrapper);
            },
            text: () => mediaContainer.appendChild(createElement("p", {}, [post.text || ""]))
        };

        (renderers[post.type] || (() => mediaContainer.appendChild(createElement("p", {}, ["Unknown post type."]))))();
        postElement.appendChild(mediaContainer);

        // --- 2. Meta ---
        const metaContainer = createElement("div", { class: "post-media-meta" });

        if (post.title) metaContainer.appendChild(createElement("h3", { class: "post-title" }, [post.title]));

        if (post.tags?.length) {
            const tagsContainer = createElement("div", { class: "tags" }, 
                post.tags.map(tag => createElement("a", { href: `/hashtag/${tag}`, class: "tag-link" }, [
                    createElement("span", { class: "tag" }, [tag])
                ]))
            );
            metaContainer.appendChild(tagsContainer);
        }

        if (post.description) {
            const maxLength = 180;
            const fullText = post.description;
            const isLong = fullText.length > maxLength;
            const shortText = fullText.slice(0, maxLength) + "...";

            const descText = createElement("p", { class: "desc-text" }, [isLong ? shortText : fullText]);
            const toggleBtn = isLong ? createElement("button", { class: "desc-toggle" }, ["Show more"]) : null;

            const descriptionEl = createElement("div", { class: "post-description" }, [descText]);
            if (toggleBtn) {
                toggleBtn.addEventListener("click", () => {
                    const expanded = toggleBtn.innerText === "Show less";
                    descText.innerText = expanded ? shortText : fullText;
                    toggleBtn.innerText = expanded ? "Show more" : "Show less";
                });
                descriptionEl.appendChild(toggleBtn);
            }

            metaContainer.appendChild(descriptionEl);
        }

        postElement.appendChild(metaContainer);

        // --- 4. Header + Actions ---
        const headerActionsRow = createElement("div", { class: "hvflex-sb post-header-actions" }, []);
        const header = createPostHeader(post);
        const actions = createActions(post, isLoggedIn, isCreator, userLikes, posts, postElement);
        headerActionsRow.appendChild(header);
        headerActionsRow.appendChild(actions);
        postElement.appendChild(headerActionsRow);

        i ? postsContainer.appendChild(postElement) : postsContainer.prepend(postElement);
    });

    initFloatingVideos(); // Setup floating videos (IntersectionObserver)
}

// --- Floating video logic using IntersectionObserver ---
function initFloatingVideos() {
    const rootMargin = " -50px 0px 0px 0px"; // trigger a bit earlier
    const observerOptions = { root: null, rootMargin, threshold: 0 };

    // create a singleton observer and attach it to current wrappers
    if (!window.__videoFloatObserver) {
        window.__videoFloatObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const wrapper = entry.target;
                // only operate on original wrappers (exclude already-floating clones)
                if (wrapper.dataset.isFloating) return;

                const videoEl = wrapper.querySelector("video");
                if (!videoEl || wrapper.dataset.closed) return;

                if (!entry.isIntersecting) {
                    // went out of view (above threshold)
                    if (!wrapper.dataset.floatingId && !wrapper.dataset.closed) {
                        createFloatingClone(wrapper, videoEl);
                    }
                } else {
                    // back in view
                    if (wrapper.dataset.floatingId) {
                        const floatingEl = document.getElementById(wrapper.dataset.floatingId);
                        if (floatingEl) {
                            removeFloatingClone(wrapper, floatingEl);
                        } else {
                            delete wrapper.dataset.floatingId;
                        }
                    }
                }
            });
        }, observerOptions);
    }

    // Observe all original wrappers present now (ignore clones)
    const videoWrappers = document.querySelectorAll(".video-wrapper:not(.floating):not([data-is-floating])");
    videoWrappers.forEach(w => {
        try { window.__videoFloatObserver.observe(w); } catch (e) { /* ignore */ }
    });
}

function createFloatingClone(wrapper, originalVideo) {
    try {
        // create unique id and set it immediately to avoid re-entrant creation
        const floatId = `floating-${wrapper.dataset.wrapperId || Math.random().toString(36).slice(2,9)}`;
        wrapper.dataset.floatingId = floatId;

        // Create floating container and mark it so it won't be observed/processed as an original
        const floatingWrapper = createElement("div", { id: floatId, class: "video-wrapper floating" }, []);
        floatingWrapper.dataset.isFloating = "1";
        floatingWrapper.classList.add("floating");

        // Clone the video element (deep clone)
        const cloneVideo = originalVideo.cloneNode(true);
        cloneVideo.playsInline = true;
        cloneVideo.controls = true;
        cloneVideo.style.width = "100%";
        cloneVideo.style.height = "auto";

        // Sync time and playing state
        const wasPlaying = !originalVideo.paused && !originalVideo.ended;
        try { cloneVideo.currentTime = originalVideo.currentTime; } catch (e) { /* ignore */ }

        // Pause original to avoid double audio
        try { originalVideo.pause(); } catch (e) { /* ignore */ }

        // Append clone and a close button
        floatingWrapper.appendChild(cloneVideo);

        const closeBtn = createElement("button", { class: "video-close" }, ["×"]);
        // small inline placement only; visuals live in CSS
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "6px";
        closeBtn.style.right = "6px";
        closeBtn.addEventListener("click", () => {
            removeFloatingClone(wrapper, floatingWrapper);
        });
        floatingWrapper.appendChild(closeBtn);

        // Add to DOM
        document.body.appendChild(floatingWrapper);

        // store references for cleanup & sync
        floatingWrapper._originalVideo = originalVideo;
        floatingWrapper._cloneVideo = cloneVideo;
        floatingWrapper._wasPlaying = wasPlaying;

        // play clone
        cloneVideo.muted = false;
        cloneVideo.play().catch(() => { /* ignore play rejection */ });

        // make draggable (CSS handles fixed positioning & dragging visuals)
        makeDraggableFloating(floatingWrapper);

        // sync loop (keeps clone in sync if original unexpectedly changes)
        const syncInterval = setInterval(() => {
            if (floatingWrapper._originalVideo && !floatingWrapper._originalVideo.paused) {
                try {
                    floatingWrapper._cloneVideo.currentTime = floatingWrapper._originalVideo.currentTime;
                } catch (e) { /* ignore */ }
            }
        }, 250);
        floatingWrapper._syncInterval = syncInterval;

    } catch (err) {
        console.error("createFloatingClone error", err);
        if (wrapper && wrapper.dataset.floatingId) delete wrapper.dataset.floatingId;
    }
}

function removeFloatingClone(wrapper, floatingEl) {
    try {
        // clear sync
        if (floatingEl._syncInterval) {
            clearInterval(floatingEl._syncInterval);
        }

        const cloneVideo = floatingEl._cloneVideo;
        const originalVideo = floatingEl._originalVideo;

        if (cloneVideo && originalVideo) {
            try { originalVideo.currentTime = cloneVideo.currentTime; } catch (e) { /* ignore */ }

            if (floatingEl._wasPlaying) {
                originalVideo.play().catch(() => {});
            }
        }

        if (floatingEl.parentElement) {
            floatingEl.parentElement.removeChild(floatingEl);
        }

        if (wrapper && wrapper.dataset.floatingId) {
            delete wrapper.dataset.floatingId;
        }

    } catch (err) {
        console.error("removeFloatingClone error", err);
        if (wrapper && wrapper.dataset.floatingId) {
            delete wrapper.dataset.floatingId;
        }
    }
}

function wrapperMarkClosed(wrapper, videoEl) {
    wrapper.dataset.closed = "1";
    try { videoEl.pause(); } catch (_) {}
    const floatId = wrapper.dataset.floatingId;
    if (floatId) {
        const floatingEl = document.getElementById(floatId);
        if (floatingEl) removeFloatingClone(wrapper, floatingEl);
    }
}

// --- Make floating element draggable (position: fixed via CSS) ---
function makeDraggableFloating(el) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    el.style.touchAction = "none";

    const onDown = (e) => {
        isDragging = true;
        el.classList.add("dragging");
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = el.getBoundingClientRect();
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        el.style.cursor = "grabbing";
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        el.style.left = `${clientX - offsetX}px`;
        el.style.top = `${clientY - offsetY}px`;
        el.style.right = "auto";
        el.style.bottom = "auto";
    };

    const onUp = () => {
        isDragging = false;
        el.classList.remove("dragging");
        el.style.cursor = "grab";
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });

    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });

    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
}
