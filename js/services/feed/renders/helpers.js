import { getState } from "../../../state/state.js";
import { apiFetch } from "../../../api/api.js";
import { reportPost } from "../../reporting/reporting.js";
import { toggleLike } from "../../beats/likes.js";
import { createCommentsSection } from "../../comments/comments.js";
import { createElement } from "../../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import Notify from "../../../components/ui/Notify.mjs";
import Imagex from "../../../components/base/Imagex.js";
import { heartSVG, commentSVG, morevSVG } from "../../../components/svgs.js";
import Button from "../../../components/base/Button.js";
import { openEditModal } from "./postEditor.js";
import { toggleAction } from "../../beats/toggleFollows.js";
import {debounce} from "../../../utils/deutils.js";

// Helper to turn an SVG string into a Node
const svgToNode = (svgString) => {
    const template = document.createElement("template");
    template.innerHTML = svgString.trim();
    return template.content.firstChild;
};

export function createPostHeader(post) {
    const userPicUrl = resolveImagePath(EntityType.USER, PictureType.THUMB, `${post.userid}.jpg`);

    const img = Imagex({
        loading: "lazy",
        src: userPicUrl,
        alt: "Profile Picture",
        class: "profile-thumb",
    });

    const userIconLink = createElement("a", {
        href: `/user/${post.username}`,
        class: "user-icon"
    }, [img]);

    // Format timestamp
    let formattedTime = "";
    if (post.timestamp) {
        try {
            const date = new Date(post.timestamp);
            formattedTime = date.toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            formattedTime = post.timestamp;
        }
    }

    const usernameDiv = createElement("div", { class: "username" }, [post.username]);
    const timestampDiv = createElement("div", { class: "timestamp" }, [formattedTime]);

    const userTimeDiv = createElement("div", { class: "user-time" }, [
        usernameDiv,
        timestampDiv
    ]);

    // // Post Header (Subscribe)
    // const isLoggedIn = Boolean(getState("token"));
    // const currentUser = getState("user");
    // let subscribeBtn = null;
    // if (isLoggedIn && post.username !== currentUser) {
    //     subscribeBtn = Button(
    //         post.isSubscribed ? "Unsubscribe" : "Subscribe",
    //         "subscribe-btn",
    //         {
    //             click: () => SubscribeToFeedPost(subscribeBtn, post.userid)
    //         },
    //         "btn buttonx"
    //     );
    
    //     subscribeBtn.dataset.action = "toggle-subscribe";
    //     subscribeBtn.dataset.userid = post.userid;
    // }
    
    const headerRow = createElement("div", { class: "post-header hflex" }, [
        userIconLink,
        userTimeDiv
    ]);
    
    // if (subscribeBtn) {
    //     headerRow.appendChild(subscribeBtn);
    // }

    return headerRow;
}

/**
 * Subscribe to a feed post
 */
function SubscribeToFeedPost(followBtn, postId) {
    toggleAction({
        entityId: postId,
        entityType: "feedpost",
        button: followBtn,
        apiPath: "/subscribes/",
        labels: { on: "Unsubscribe", off: "Subscribe" },
        actionName: "subscribed"
    });
}

// Batch fetch: POST /likes/:entitytype/batch/users
export async function fetchUserMetaLikesBatch(entityType, entityIds = []) {
    if (!Array.isArray(entityIds) || entityIds.length === 0) return {};

    try {
        const response = await apiFetch(`/likes/${entityType}/batch/users`, "POST", {
            entity_ids: entityIds
        });

        if (response && response.data && typeof response.data === "object") {
            return response.data;
        }

        return {};
    } catch (err) {
        console.error("fetchUserMetaLikesBatch error:", err);
        return {};
    }
}


export function createActions(post, isLoggedIn, isCreator, userLikes = {}, posts = [], postElement, postsContainer, i) {
    const currentUserId = getState("user");
    const entityType = "feed";
    const entityId = post.postid;

    const actionsContainer = createElement("div", { class: "post-actions" });

    function createActionButton(iconSVG, label = "", className = "", onClick = null) {
        const icon = svgToNode(iconSVG);
        const labelEl = label ? createElement("span", {}, [label]) : null;
        const btnChildren = labelEl ? [icon, labelEl] : [icon];
        const btn = createElement("button", { class: className }, btnChildren);
        if (onClick) btn.addEventListener("click", onClick);
        return btn;
    }

    // --- LIKE BUTTON ---
    if (isLoggedIn) {
        const liked = Boolean(userLikes[entityId]);
        const likeLabel = createElement("span", {}, [post.likes]);
        const likeButton = createElement("button", { class: liked ? "like liked" : "like" }, [
            svgToNode(heartSVG),
            likeLabel
        ]);

        likeButton.addEventListener("click", debounce(async () => {
            try {
                const result = await toggleLike("post", entityId);
                if (!result || typeof result.count !== "number") return;

                likeLabel.textContent = result.count;
                likeButton.classList.toggle("liked", result.liked);
                userLikes[entityId] = result.liked;
            } catch (err) {
                console.error("Failed to toggle like", err);
            }
        }, 500));

        actionsContainer.appendChild(likeButton);
    }

    // --- COMMENT BUTTON ---
    const commentButton = createActionButton(commentSVG, "", "comment", () => {
        if (!post._commentSectionVisible) {
            const commentsEl = createCommentsSection(post.postid, post.comments || [], entityType, currentUserId);
            actionsContainer.parentElement.appendChild(commentsEl);
            post._commentSectionVisible = true;
        }
    });
    actionsContainer.appendChild(commentButton);

    // --- MORE MENU ---
    const moreButton = createElement("button", { class: "more-btn" }, [svgToNode(morevSVG)]);
    const dropdownx = createElement("div", { class: "dropxdown hidden" });

    function closeDropdown() {
        dropdownx.classList.add("hidden");
    }

    const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
    reportButton.addEventListener("click", () => {
        closeDropdown();
        reportPost(entityId, "post");
    });
    dropdownx.appendChild(reportButton);

    if (isCreator) {
        const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
        deleteButton.addEventListener("click", () => {
            closeDropdown();
            deletePost(entityId, postElement, posts);
        });
        dropdownx.appendChild(deleteButton);

        const editBtn = Button("Edit", "", { click: () => openEditModal(post, postsContainer, i) }, "edit-btn");
        dropdownx.appendChild(editBtn);
    }

    const moreWrapper = createElement("div", { class: "more-wrapper" }, [moreButton, dropdownx]);
    actionsContainer.appendChild(moreWrapper);

    moreButton.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownx.classList.toggle("hidden");

        if (!dropdownx.classList.contains("hidden")) {
            const handleClickOutside = (event) => {
                if (!moreWrapper.contains(event.target)) {
                    closeDropdown();
                    document.removeEventListener("click", handleClickOutside);
                    document.removeEventListener("keydown", handleEsc);
                }
            };

            const handleEsc = (event) => {
                if (event.key === "Escape") {
                    closeDropdown();
                    document.removeEventListener("click", handleClickOutside);
                    document.removeEventListener("keydown", handleEsc);
                }
            };

            document.addEventListener("click", handleClickOutside);
            document.addEventListener("keydown", handleEsc);
        }
    });

    return actionsContainer;
}


/**
 * Update timeline styles for each feed item
 */
export function updateTimelineStyles() {
    document.querySelectorAll(".feed-item").forEach(item => {
        const profileImg = item.querySelector(".profile-thumb")?.src || "";
        item.style.setProperty("--after-bg", `url(${profileImg})`);
    });

    const style = document.createElement("style");
    style.textContent = `.feed-item::after { background-image: var(--after-bg); }`;
    document.head.appendChild(style);
}

/**
 * Delete a post
 */
async function deletePost(postId, postElement, posts) {
    if (!getState("token")) {
        Notify("Please log in to delete your post.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    if (confirm("Are you sure you want to delete this post?")) {
        try {
            await apiFetch(`/feed/post/${postId}`, "DELETE");
            Notify("Post deleted successfully.", { type: "success", duration: 3000, dismissible: true });

            if (postElement && postElement.parentNode) {
                postElement.parentNode.removeChild(postElement);
            }

            const index = posts.findIndex(p => p.postid === postId);
            if (index !== -1) {
                posts.splice(index, 1);
            }
        } catch (err) {
            Notify(`Error deleting post: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
        }
    }
}
