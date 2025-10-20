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

    // initFloatingVideos(); // Setup floating videos (IntersectionObserver)
}
