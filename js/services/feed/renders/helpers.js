import { SRC_URL, getState, state } from "../../../state/state.js";
import Snackbar from "../../../components/ui/Snackbar.mjs";
import { apiFetch } from "../../../api/api.js";
import { fetchFeed } from "../fetchFeed.js";
import { reportPost } from "../../reporting/reporting.js";
import { toggleLike } from "../../beats/likes.js";
import { createCommentsSection } from "../../comments/comments.js";
import { createElement } from "../../../components/createElement.js";

/**
 * Create the post header (user avatar, username, timestamp)
 */
export function createPostHeader(post) {
    const userPicUrl = `${SRC_URL}/userpic/thumb/${post.userid}.jpg`;
    const fallbackPic = `${SRC_URL}/userpic/thumb/default.png`;

    const img = createElement("img", {
        loading: "lazy",
        src: userPicUrl,
        alt: "Profile Picture",
        class: "profile-thumb",
        onerror: `this.onerror=null;this.src='${fallbackPic}'`
    });

    const userIconLink = createElement("a", {
        href: `/user/${post.username}`,
        class: "user-icon"
    }, [img]);

    const usernameDiv = createElement("div", { class: "username" }, [post.username]);
    const timestampDiv = createElement("div", { class: "timestamp" }, [post.timestamp]);

    const userTimeDiv = createElement("div", { class: "user-time" }, [
        usernameDiv,
        timestampDiv
    ]);

    return createElement("div", { class: "post-header hflex" }, [
        userIconLink,
        userTimeDiv
    ]);
}

/**
 * Create post actions: like, comment, report, delete (if creator)
 */
export function createActions(post, isLoggedIn, isCreator) {
    const currentUserId = getState("user");
    const entityType = "feed";
    const entityId = post.postid;

    const actionsContainer = createElement("div", { class: "post-actions" });

    if (isLoggedIn) {
        // Like Button
        const likeButton = createElement("span", { class: "like" }, [`Like (${post.likes})`]);

        const handleLikeClick = debounce(async () => {
            try {
                const result = await toggleLike("post", post.postid);
                if (result && typeof result.count === "number") {
                    likeButton.textContent = `Like (${result.count})`;
                }
            } catch (err) {
                console.error("Failed to toggle like", err);
            }
        }, 500);

        likeButton.addEventListener("click", handleLikeClick);

        // Comment Button
        const commentButton = createElement("span", { class: "comment" }, ["Comment"]);
        commentButton.addEventListener("click", () => {
            if (!post._commentSectionVisible) {
                const commentsEl = createCommentsSection(
                    post.postid,
                    post.comments || [],
                    entityType,
                    entityId,
                    currentUserId
                );
                actionsContainer.parentElement.appendChild(commentsEl);
                post._commentSectionVisible = true;
            }
        });

        actionsContainer.appendChild(likeButton);
        actionsContainer.appendChild(commentButton);

        // More Menu (Report/Delete)
        const moreButton = createElement("button", { class: "more-btn" }, ["⋮"]);
        const dropdown = createElement("div", { class: "dropdown hidden" });

        // Report
        const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
        reportButton.addEventListener("click", () => {
            dropdown.classList.add("hidden");
            reportPost(post.postid, "post");
        });
        dropdown.appendChild(reportButton);

        // Delete (only if creator)
        if (isCreator) {
            const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
            deleteButton.addEventListener("click", () => {
                dropdown.classList.add("hidden");
                deletePost(post.postid);
            });
            dropdown.appendChild(deleteButton);
        }

        const moreWrapper = createElement("div", { class: "more-wrapper" }, [
            moreButton,
            dropdown
        ]);

        moreButton.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        });

        document.addEventListener("click", () => {
            dropdown.classList.add("hidden");
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                dropdown.classList.add("hidden");
            }
        });

        actionsContainer.appendChild(moreWrapper);
    }

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
async function deletePost(postId) {
    if (!state.token) {
        Snackbar("Please log in to delete your post.", 3000);
        return;
    }

    if (confirm("Are you sure you want to delete this post?")) {
        try {
            await apiFetch(`/feed/post/${postId}`, "DELETE");
            Snackbar("Post deleted successfully.", 3000);
            fetchFeed(); // Refresh feed
        } catch (err) {
            Snackbar(`Error deleting post: ${err.message}`, 3000);
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

// import { SRC_URL, getState, state } from "../../../state/state.js";
// import Snackbar from "../../../components/ui/Snackbar.mjs";
// import { apiFetch } from "../../../api/api.js";
// import { fetchFeed } from "../fetchFeed.js";
// import { reportPost } from "../../reporting/reporting.js";
// import { toggleLike } from "../../beats/likes.js";


// import { createCommentsSection } from "../../comments/comments.js";

// export function createPostHeader(post) {
//     const userPicUrl = `${SRC_URL}/userpic/thumb/${post.userid + ".jpg"}`;
//     const fallbackPic = 'default.png'; // Fallback image in case userpic doesn't exist

//     return `
//         <div class="post-header hflex">
//             <a class="user-icon" href="/user/${post.username}">
//                 <img 
//                     loading="lazy" 
//                     src="${userPicUrl}" 
//                     alt="Profile Picture" 
//                     class="profile-thumb" 
//                     onerror="this.onerror=null; this.src='${SRC_URL}/userpic/thumb/${fallbackPic}'" 
//                 />
//             </a>
//             <div class="user-time">
//                 <div class="username">${post.username}</div>
//                 <div class="timestamp">${post.timestamp}</div>
//             </div>
//         </div>
//     `;
// }

// export function createActions(post, isLoggedIn, isCreator) {
//     let currentUserId = getState("user");
//     let entityType = "feed";
//     let entityId = post.postid;
//     const actionsContainer = document.createElement("div");
//     actionsContainer.className = "post-actions";
//     // const handleLikeClick = debounce(async () => {
//     //     try {
//     //         const result = await toggleLike("post", post.postid);
//     //         if (result && typeof result.count === "number") {
//     //             likeButton.textContent = `Like (${result.count})`;
//     //         }
//     //     } catch (err) {
//     //         console.error("Failed to toggle like", err);
//     //     }
//     // }, 500); // 500ms debounce delay
//     if (isLoggedIn) {
//         const likeButton = document.createElement("span");
//         likeButton.className = "like";
//         likeButton.textContent = `Like (${post.likes})`;
        
//         const handleLikeClick = debounce(async () => {
//             try {
//                 const result = await toggleLike("post", post.postid);
//                 if (result && typeof result.count === "number") {
//                     likeButton.textContent = `Like (${result.count})`;
//                 }
//             } catch (err) {
//                 console.error("Failed to toggle like", err);
//             }
//         }, 500); // 500ms debounce


//         likeButton.addEventListener("click", handleLikeClick);


//         const commentButton = document.createElement("span");
//         commentButton.className = "comment";
//         commentButton.textContent = "Comment";
//         commentButton.addEventListener("click", () => {
//             if (!post._commentSectionVisible) {
//                 const commentsEl = createCommentsSection(post.postid, post.comments || [], entityType, entityId, currentUserId);
//                 actionsContainer.parentElement.appendChild(commentsEl);
//                 post._commentSectionVisible = true;
//             }
//         });

//         actionsContainer.appendChild(likeButton);
//         actionsContainer.appendChild(commentButton);

//         // More button with dropdown
//         const moreWrapper = document.createElement("div");
//         moreWrapper.className = "more-wrapper";

//         const moreButton = document.createElement("button");
//         moreButton.className = "more-btn";
//         moreButton.textContent = "⋮";

//         const dropdown = document.createElement("div");
//         dropdown.className = "dropdown hidden";

//         // Report button
//         // Report button
//         const reportButton = document.createElement("button");
//         reportButton.className = "report-btn";
//         reportButton.textContent = "Report";
//         reportButton.addEventListener("click", () => {
//             dropdown.classList.add("hidden");
//             reportPost(post.postid, "post");
//         });

//         dropdown.appendChild(reportButton);

//         if (isCreator) {
//             const deleteButton = document.createElement("button");
//             deleteButton.className = "delete-btn";
//             deleteButton.textContent = "Delete";
//             deleteButton.addEventListener("click", () => {
//                 dropdown.classList.add("hidden");
//                 deletePost(post.postid);
//             });
//             dropdown.appendChild(deleteButton);
//         }


//         moreButton.addEventListener("click", (e) => {
//             e.stopPropagation();
//             dropdown.classList.toggle("hidden");
//         });

//         // Hide dropdown when clicking outside
//         document.addEventListener("click", () => {
//             dropdown.classList.add("hidden");
//         });

//         // Hide dropdown on Escape key press
//         document.addEventListener("keydown", (e) => {
//             if (e.key === "Escape") {
//                 dropdown.classList.add("hidden");
//             }
//         });


//         moreWrapper.appendChild(moreButton);
//         moreWrapper.appendChild(dropdown);
//         actionsContainer.appendChild(moreWrapper);
//     }

//     return actionsContainer;
// }


// export function updateTimelineStyles() {
//     document.querySelectorAll(".feed-item").forEach(item => {
//         const profileImg = item.querySelector(".profile-thumb")?.src || "";
//         item.style.setProperty("--after-bg", `url(${profileImg})`);
//     });

//     const style = document.createElement("style");
//     style.textContent = `.feed-item::after { background-image: var(--after-bg); }`;
//     document.head.appendChild(style);
// }

// async function deletePost(postId) {
//     if (!state.token) {
//         Snackbar("Please log in to delete your post.", 3000);
//         return;
//     }

//     if (confirm("Are you sure you want to delete this post?")) {
//         try {
//             await apiFetch(`/feed/post/${postId}`, "DELETE");
//             Snackbar("Post deleted successfully.", 3000);
//             fetchFeed(); // Refresh feed
//         } catch (err) {
//             Snackbar(`Error deleting post: ${err.message}`, 3000);
//         }
//     }
// }
// function debounce(func, delay) {
//     let timeout;
//     return function (...args) {
//         if (timeout) clearTimeout(timeout);
//         timeout = setTimeout(() => func.apply(this, args), delay);
//     };
// }

