import { createActions, createPostHeader, updateTimelineStyles, fetchUserMetaLikesBatch } from "./helpers.js";
import { createElement } from "../../../components/createElement.js";
import { RenderImagePost } from "../renderImagePost.js";
import { RenderVideoPost } from "../renderVideoPost.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { getState } from "../../../state/state.js";

export async function renderPost(posts, postsContainer) {
    const isLoggedIn = Boolean(getState("token"));
    const user = getState("user");

    // Fetch user likes once if logged in
    let userLikes = {};
    if (isLoggedIn && posts.length) {
        const postIds = posts.map(p => p.postid);
        userLikes = await fetchUserMetaLikesBatch("feed", postIds);
    }

    const postElements = posts.map((post, i) => {
        const isCreator = isLoggedIn && user === post.userid;

        const postElement = createElement("article", {
            class: ["feed-item"],
            id: `post-${post.postid}`,
            href: `./feedpost/${post.postid}`,
            "date-is": new Date(post.timestamp).toLocaleString()
        }, [createPostHeader(post)]);

        // Media
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

        // Meta
        if (post.title || post.description || (post.tags?.length)) {
            const metaSection = createElement("div", { class: ["post-meta"] }, []);
            if (post.title) metaSection.appendChild(createElement("h3", { class: ["post-title"] }, [post.title]));
            if (post.description) metaSection.appendChild(createElement("p", { class: ["post-description"] }, [post.description]));
            if (post.tags?.length) metaSection.appendChild(createElement("div", { class: "tags" }, post.tags.map(tag => createElement("span", { class: "tag" }, [tag]))));
            postElement.appendChild(metaSection);
        }

        // Actions — pass userLikes so "liked" state is correct
        // --- inside renderPost ---
        const actionsContainer = createActions(post, isLoggedIn, isCreator, userLikes, posts, postElement);
        postElement.appendChild(actionsContainer);


        i ? postsContainer.appendChild(postElement) : postsContainer.prepend(postElement);

        return { post, postElement, actionsContainer };
    });

    updateTimelineStyles();
}
