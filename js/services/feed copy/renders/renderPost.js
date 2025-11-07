import { createPostHeader } from "./helpers.js";
import { createActions } from "./actions.js";
import { createElement } from "../../../components/createElement.js";
import { RenderImagePost } from "../renderImagePost.js";
import { RenderVideoPost } from "../renderVideoPost.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { getState } from "../../../state/state.js";
import { navigate } from "../../../routes/index.js";

export async function renderPost(posts, postsContainer, postmetadata) {
    if (!Array.isArray(posts)) posts = [posts];

    const isLoggedIn = Boolean(getState("token"));
    const user = getState("user");

    for (const [i, post] of posts.entries()) {
        const isCreator = isLoggedIn && user === post.userid;

        const postElement = createElement("article", {
            class: ["feed-item"],
            id: `post-${post.postid}`,
            "date-is": new Date(post.timestamp).toLocaleString()
        }, [createPostHeader(post)]);

        // --- MEDIA ---
        const mediaContainer = createElement("div", { class: ["post-media"] });
        const mediaUrls = Array.isArray(post.media_url) ? post.media_url : (post.media_url ? [post.media_url] : []);

        if (post.type === "image") {
            RenderImagePost(mediaContainer, mediaUrls);
        } else if (post.type === "video") {
            const media = post.media.map(m => resolveImagePath(EntityType.FEED, PictureType.VIDEO, m));
            const posterPath = resolveImagePath(EntityType.FEED, PictureType.POSTER, `${post.thumbnail || mediaUrls[0]}.png`);
            RenderVideoPost(mediaContainer, media, mediaUrls, post.resolutions || [], [], posterPath);
        } else if (post.text) {
            mediaContainer.appendChild(createElement("p", {}, [post.text]));
        } else {
            mediaContainer.appendChild(createElement("p", {}, ["Unknown post type."]));
        }

        postElement.appendChild(mediaContainer);

        // --- META ---
        if (post.title || (post.tags?.length)) {
            const metaSection = createElement("div", { class: ["post-meta"] });
            if (post.title) metaSection.appendChild(createElement("h3", { class: ["post-title"] }, [post.title]));
            if (post.tags?.length) {
                const tagsContainer = createElement("div", { class: "tags" },
                    post.tags.map(tag =>
                        createElement("a", { href: `/hashtag/${tag}` }, [
                            createElement("span", { class: "tag" }, [tag])
                        ])
                    )
                );
                metaSection.appendChild(tagsContainer);
            }
            metaSection.addEventListener("click", () => navigate(`/feedpost/${post.postid}`));
            postElement.appendChild(metaSection);
        }

        // --- ACTIONS ---
        const meta = postmetadata[post.postid] || { likes: 0, comments: 0, likedByUser: false };
        const actionsContainer = await createActions(meta, isCreator, postElement);
        postElement.appendChild(actionsContainer);

        postsContainer.appendChild(postElement);
    }
}
