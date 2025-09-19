
import { createActions, createPostHeader, fetchUserMetaLikesBatch } from "./helpers.js";
import { createElement } from "../../../components/createElement.js";
import { RenderImagePost } from "../renderImagePost.js";
import { RenderVideoPost } from "../renderVideoPost.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { getState } from "../../../state/state.js";

export async function renderPost(posts, postsContainer) {
    if (!Array.isArray(posts)) {
        posts = [posts];
    }

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
            class: ["feed-item"],
            id: `post-${post.postid}`,
            href: `./feedpost/${post.postid}`,
            "date-is": new Date(post.timestamp).toLocaleString()
        }, []);

        // --- 1. Media ---
        const mediaContainer = createElement("div", { class: ["post-media"] });
        const mediaUrls = Array.isArray(post.media_url) ? post.media_url : (post.media_url ? [post.media_url] : []);
        const renderers = {
            image: () => RenderImagePost(mediaContainer, mediaUrls),
            video: () => {
                const videos = mediaUrls.map(m => resolveImagePath(EntityType.FEED, PictureType.VIDEO, m));
                RenderVideoPost(mediaContainer, videos, mediaUrls, post.resolution);
            },
            text: () => mediaContainer.appendChild(createElement("p", {}, [post.text || ""]))
        };
        (renderers[post.type] || (() => mediaContainer.appendChild(createElement("p", {}, ["Unknown post type."]))))();
        postElement.appendChild(mediaContainer);

        const metaContainer = createElement("div", { class: ["post-media-meta"] });

        // --- 2. Title (if any) ---
        if (post.title) {
            metaContainer.appendChild(createElement("h3", { class: ["post-title"] }, [post.title]));
        }

        // --- 2b. Tags (immediately below title) ---
        if (post.tags?.length) {
            const tagsContainer = createElement("div", { class: "tags" }, 
                post.tags.map(tag => {
                    return createElement("a", { href: `/hashtag/${tag}`, class: "tag-link" }, [
                        createElement("span", { class: "tag" }, [tag])
                    ]);
                })
            );
            metaContainer.appendChild(tagsContainer);
        }

        // --- 3. Description ---
        
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
                    const expanded = toggleBtn.textContent === "Show less";
                    descText.textContent = expanded ? shortText : fullText;
                    toggleBtn.textContent = expanded ? "Show more" : "Show less";
                });
                descriptionEl.appendChild(toggleBtn);
            }

            metaContainer.appendChild(descriptionEl);
        }

        postElement.appendChild(metaContainer);
        // if (post.description) {
        //     const descriptionEl = createElement("div", {class:"post-description"}, [createElement("p", {}, [post.description])]);
        //     postElement.appendChild(descriptionEl);
        // }
        // --- 4. Header + Actions (flex row) ---
        const headerActionsRow = createElement("div", { class: ["hvflex-sb post-header-actions"] }, []);
        const header = createPostHeader(post);
        const actions = createActions(post, isLoggedIn, isCreator, userLikes, posts, postElement);
        headerActionsRow.appendChild(header);
        headerActionsRow.appendChild(actions);
        postElement.appendChild(headerActionsRow);


        i ? postsContainer.appendChild(postElement) : postsContainer.prepend(postElement);
    });
}

