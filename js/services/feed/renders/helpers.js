import { SRC_URL, getState } from "../../../state/state.js";
import { apiFetch } from "../../../api/api.js";
import { fetchFeed } from "../fetchFeed.js";
import { reportPost } from "../../reporting/reporting.js";
import { toggleLike } from "../../beats/likes.js";
import { createCommentsSection } from "../../comments/comments.js";
import { createElement } from "../../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import Notify from "../../../components/ui/Notify.mjs";
import Imagex from "../../../components/base/Imagex.js";
import { heartSVG, commentSVG } from "../../../components/svgs.js";
import Button from "../../../components/base/Button.js";
import { openEditForm } from "./postEditor.js";

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
            formattedTime = post.timestamp; // fallback if parsing fails
        }
    }

    const usernameDiv = createElement("div", { class: "username" }, [post.username]);
    const timestampDiv = createElement("div", { class: "timestamp" }, [formattedTime]);

    const userTimeDiv = createElement("div", { class: "user-time" }, [
        usernameDiv,
        timestampDiv
    ]);

    return createElement("div", { class: "post-header hflex" }, [
        userIconLink,
        userTimeDiv
    ]);
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

// --- Update createActions to use userLikes ---
export function createActions(post, isLoggedIn, isCreator, userLikes = {}, posts = [], postElement, postsContainer, i) {
    const currentUserId = getState("user");
    const entityType = "feed";
    const entityId = post.postid;

    const actionsContainer = createElement("div", { class: "post-actions" });

    // Like Button
    if (isLoggedIn) {
        const liked = Boolean(userLikes[entityId]);
        const likeIcon = svgToNode(heartSVG);
        const likeLabel = document.createElement("span");
        likeLabel.textContent = `Like (${post.likes})`;

        const likeButton = createElement("button", {
            class: liked ? "like liked" : "like"
        }, [likeIcon, likeLabel]);

        const handleLikeClick = debounce(async () => {
            try {
                const result = await toggleLike("post", post.postid);
                if (result && typeof result.count === "number") {
                    likeLabel.textContent = `Like (${result.count})`;

                    if (result.liked) likeButton.classList.add("liked");
                    else likeButton.classList.remove("liked");

                    userLikes[post.postid] = result.liked;
                }
            } catch (err) {
                console.error("Failed to toggle like", err);
            }
        }, 500);

        likeButton.addEventListener("click", handleLikeClick);
        actionsContainer.appendChild(likeButton);
    }

    // Comment Button
    const commentIcon = svgToNode(commentSVG);
    const commentLabel = document.createElement("span");
    commentLabel.textContent = "Comment";
    const commentButton = createElement("button", { class: "comment" }, [
        commentIcon,
        commentLabel
    ]);

    commentButton.addEventListener("click", () => {
        if (!post._commentSectionVisible) {
            const commentsEl = createCommentsSection(
                post.postid,
                post.comments || [],
                entityType,
                currentUserId
            );
            actionsContainer.parentElement.appendChild(commentsEl);
            post._commentSectionVisible = true;
        }
    });

    actionsContainer.appendChild(commentButton);

    // More Menu (Report/Delete/Edit)
    const moreButton = createElement("button", { class: "more-btn" }, ["⋮"]);
    const dropdown = createElement("div", { class: "dropdown hidden" });
    const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
    reportButton.addEventListener("click", () => {
        dropdown.classList.add("hidden");
        reportPost(post.postid, "post");
    });
    dropdown.appendChild(reportButton);

    if (isCreator) {
        const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
        deleteButton.addEventListener("click", () => {
            dropdown.classList.add("hidden");
            deletePost(post.postid, postElement, posts);
        });
        dropdown.appendChild(deleteButton);

        const editBtn = Button("Edit", "", { click: () => openEditForm(post, postElement, postsContainer, i) }, "edit-btn");
        dropdown.appendChild(editBtn);
    }

    const moreWrapper = createElement("div", { class: "more-wrapper" }, [
        moreButton,
        dropdown
    ]);

    moreButton.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => dropdown.classList.add("hidden"));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") dropdown.classList.add("hidden");
    });

    actionsContainer.appendChild(moreWrapper);

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

/**
 * Debounce helper
 */
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}