import { SRC_URL, state } from "../../../state/state.js";
import { RenderImagePost } from "../renderImagePost.js";
import { RenderVideoPost } from "../renderVideoPost.js";
import { RenderAudioPost } from "../renderAudioPost.js";
import { RenderBlogPost } from "./renderBlogPost.js";
import { createPostHeader, createActions, updateTimelineStyles } from "./helpers.js";
import { createElement } from "../../../components/createElement.js";

export function renderPost(post, postsContainer, i) {
    const media = Array.isArray(post.media) ? post.media.map(m => `${SRC_URL}${m}`) : [];

    const isLoggedIn = state.token;
    const isCreator = isLoggedIn && state.user === post.userid;

    const postElement = createElement("article", {
        class: ["feed-item"],
        href: `./post/${post.postid}`,
        "date-is": new Date(post.timestamp).toLocaleString()
    }, [createPostHeader(post)]);

    const mediaContainer = createElement("div", { class: ["post-media"] });

    switch (post.type) {
        case "image":
            RenderImagePost(mediaContainer, media);
            break;
        case "video":
            RenderVideoPost(mediaContainer, media, post.media_url, post.resolution);
            break;
        case "audio":
            RenderAudioPost(mediaContainer, post.media_url, post.resolution);
            break;
        case "blog":
            RenderBlogPost(mediaContainer, post.blog_text || post.blog_content || "");
            break;
        case "text":
            mediaContainer.appendChild(createElement("p", {}, [post.text || ""]));
            break;
        default:
            mediaContainer.appendChild(createElement("p", {}, ["Unknown post type."]));
    }

    postElement.appendChild(mediaContainer);

    const actions = createActions(post, isLoggedIn, isCreator);
    postElement.appendChild(actions);

    i ? postsContainer.appendChild(postElement) : postsContainer.prepend(postElement);

    updateTimelineStyles();
}

// import { SRC_URL, state } from "../../../state/state.js";
// import { RenderImagePost } from "../renderImagePost.js";
// import { RenderVideoPost } from "../renderVideoPost.js";
// import { RenderAudioPost } from "../renderAudioPost.js";
// import { RenderBlogPost } from "./renderBlogPost.js";
// import { createPostHeader, createActions, updateTimelineStyles } from "./helpers.js";

// export function renderPost(post, postsContainer, i) {
//     const media = Array.isArray(post.media) ? post.media.map(m => `${SRC_URL}${m}`) : [];

//     const isLoggedIn = state.token;
//     const isCreator = isLoggedIn && state.user === post.userid;

//     const postElement = document.createElement("article");
//     postElement.classList.add("feed-item");
//     postElement.setAttribute("href", `./post/${post.postid}`);
//     postElement.setAttribute("date-is", new Date(post.timestamp).toLocaleString());
//     postElement.innerHTML = createPostHeader(post);

//     const mediaContainer = document.createElement("div");
//     mediaContainer.className = "post-media";

//     switch (post.type) {
//         case "image":
//             RenderImagePost(mediaContainer, media);
//             break;
//         case "video":
//             RenderVideoPost(mediaContainer, media, post.media_url, post.resolution);
//             break;
//         case "audio":
//             RenderAudioPost(mediaContainer, post.media_url, post.resolution);
//             break;
//         case "blog":
//             RenderBlogPost(mediaContainer, post.blog_text || post.blog_content || "");
//             break;
//         default:
//             mediaContainer.textContent = "Unknown post type.";
//     }

//     postElement.appendChild(mediaContainer);

//     const actions = createActions(post, isLoggedIn, isCreator);
//     postElement.appendChild(actions);

//     i ? postsContainer.appendChild(postElement) : postsContainer.prepend(postElement);

//     updateTimelineStyles();
// }
