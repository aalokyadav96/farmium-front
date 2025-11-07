import { createElement } from "../../../components/createElement.js";
import { svgToNode, deletePost } from "./helpers.js";
import { heartSVG, commentSVG, morevSVG, shareSVG } from "../../../components/svgs.js";
import Button from "../../../components/base/Button.js";
import { openEditModal } from "./postEditor.js";
import { debounce } from "../../../utils/deutils.js";
import { toggleLike } from "../../beats/likes.js";
import { createCommentsSection } from "../../comments/comments.js";
import { reportPost } from "../../reporting/reporting.js";
import { MAIN_URL, getState } from "../../../state/state.js";

export async function createActions(metadata, isCreator, postElement) {
    const { postId, likes, comments, likedByUser } = metadata;
    const actionsContainer = createElement("div", { class: "post-actions" });
    const user = getState("user");
    const isLoggedIn = Boolean(getState("token"));

    // LIKE BUTTON
    const likeLabel = createElement("span", {}, [likes]);
    const likeButton = createElement("button", { class: likedByUser ? "like liked" : "like" }, [
        svgToNode(heartSVG),
        likeLabel
    ]);

    if (isLoggedIn) {
        likeButton.addEventListener("click", debounce(async () => {
            try {
                const result = await toggleLike("post", postId);
                if (result && typeof result.count === "number") {
                    likeLabel.textContent = result.count;
                    likeButton.classList.toggle("liked", result.liked);
                }
            } catch (err) {
                console.error("Failed to toggle like", err);
            }
        }, 500));
    }

    actionsContainer.appendChild(likeButton);

    // COMMENT BUTTON
    const commentButton = createElement("button", { class: "comment" }, [svgToNode(commentSVG)]);
    commentButton.addEventListener("click", () => {
        if (!postElement._commentSectionVisible) {
            const commentsEl = createCommentsSection(postId, [], "feed", user?._id);
            postElement.appendChild(commentsEl);
            postElement._commentSectionVisible = true;
        }
    });
    actionsContainer.appendChild(commentButton);

let embedURL = `${MAIN_URL}/embed/${postId}`;
    let shareButton = createElement("button", {
        class: "comment", events: {
            click: () => { navigator.clipboard.writeText(embedURL) }
        }
    }, [svgToNode(shareSVG)]);

    actionsContainer.appendChild(shareButton);


    // MORE MENU
    const moreButton = createElement("button", { class: "more-btn" }, [svgToNode(morevSVG)]);
    const dropdownx = createElement("div", { class: "dropxdown hidden" });

    const closeDropdown = () => dropdownx.classList.add("hidden");

    // Report option
    const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
    reportButton.addEventListener("click", () => {
        closeDropdown();
        reportPost(postId, "post");
    });
    dropdownx.appendChild(reportButton);

    // Creator actions
    if (isCreator) {
        const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
        deleteButton.addEventListener("click", () => {
            closeDropdown();
            deletePost(postId, postElement);
        });
        dropdownx.appendChild(deleteButton);

        const editBtn = Button("Edit", "", { click: () => openEditModal({ postId }, postElement.parentElement) }, "edit-btn");
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

// import { reportPost } from "../../reporting/reporting.js";
// import { toggleLike } from "../../beats/likes.js";
// import { createCommentsSection } from "../../comments/comments.js";
// import { createElement } from "../../../components/createElement.js";
// import { heartSVG, commentSVG, morevSVG } from "../../../components/svgs.js";
// import Button from "../../../components/base/Button.js";
// import { openEditModal } from "./postEditor.js";
// import { debounce } from "../../../utils/deutils.js";
// import { svgToNode, deletePost } from "./helpers.js";
// import { getState } from "../../../state/state.js";


// // --- UI-Only Renderer ---
// export function createActions(postMeta, isCreator, postElement) {
//     // postMeta = { postId, likes, comments, likedByUser }
//     const { postId, likes, comments, likedByUser } = postMeta;
//     const user = getState("user");
//     const isLoggedIn = Boolean(user);

//     const actionsContainer = createElement("div", { class: "post-actions" });

//     // --- LIKE BUTTON ---
//     const likeLabel = createElement("span", {}, [likes]);
//     const likeButton = createElement("button", {
//         class: likedByUser ? "like liked" : "like"
//     }, [svgToNode(heartSVG), likeLabel]);

//     if (isLoggedIn) {
//         likeButton.addEventListener("click", debounce(async () => {
//             try {
//                 const result = await toggleLike("post", postId);
//                 if (!result || typeof result.count !== "number") return;
//                 likeLabel.textContent = result.count;
//                 likeButton.classList.toggle("liked", result.liked);
//             } catch (err) {
//                 console.error("Failed to toggle like", err);
//             }
//         }, 500));
//     }

//     actionsContainer.appendChild(likeButton);

//     // --- COMMENT BUTTON ---
//     const commentLabel = createElement("span", {}, [comments]);
//     const commentButton = createElement("button", { class: "comment" }, [
//         svgToNode(commentSVG),
//         commentLabel
//     ]);

//     commentButton.addEventListener("click", () => {
//         if (!postElement.querySelector(".comments-section")) {
//             const commentsEl = createCommentsSection(postId, [], "feed", user);
//             postElement.appendChild(commentsEl);
//         }
//     });

//     actionsContainer.appendChild(commentButton);

//     // --- MORE MENU ---
//     const moreButton = createElement("button", { class: "more-btn" }, [svgToNode(morevSVG)]);
//     const dropdown = createElement("div", { class: "dropdown hidden" });

//     const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
//     reportButton.addEventListener("click", () => {
//         dropdown.classList.add("hidden");
//         reportPost(postId, "post");
//     });
//     dropdown.appendChild(reportButton);

//     if (isCreator) {
//         const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
//         deleteButton.addEventListener("click", () => {
//             dropdown.classList.add("hidden");
//             deletePost(postId, postElement);
//         });
//         dropdown.appendChild(deleteButton);

//         const editBtn = Button("Edit", "", { click: () => openEditModal({ postId }) }, "edit-btn");
//         dropdown.appendChild(editBtn);
//     }

//     const moreWrapper = createElement("div", { class: "more-wrapper" }, [moreButton, dropdown]);
//     actionsContainer.appendChild(moreWrapper);

//     moreButton.addEventListener("click", (e) => {
//         e.stopPropagation();
//         dropdown.classList.toggle("hidden");

//         if (!dropdown.classList.contains("hidden")) {
//             const handleOutside = (event) => {
//                 if (!moreWrapper.contains(event.target)) {
//                     dropdown.classList.add("hidden");
//                     document.removeEventListener("click", handleOutside);
//                     document.removeEventListener("keydown", handleEsc);
//                 }
//             };
//             const handleEsc = (event) => {
//                 if (event.key === "Escape") {
//                     dropdown.classList.add("hidden");
//                     document.removeEventListener("click", handleOutside);
//                     document.removeEventListener("keydown", handleEsc);
//                 }
//             };
//             document.addEventListener("click", handleOutside);
//             document.addEventListener("keydown", handleEsc);
//         }
//     });

//     return actionsContainer;
// }


// // // import { getState } from "../../../state/state.js";
// // // import { reportPost } from "../../reporting/reporting.js";
// // // import { toggleLike } from "../../beats/likes.js";
// // // import { createCommentsSection } from "../../comments/comments.js";
// // // import { createElement } from "../../../components/createElement.js";
// // // import { heartSVG, commentSVG, morevSVG } from "../../../components/svgs.js";
// // // import Button from "../../../components/base/Button.js";
// // // import { openEditModal } from "./postEditor.js";
// // // import {debounce} from "../../../utils/deutils.js";
// // // import {svgToNode, deletePost} from "./helpers.js";

// // import { apiFetch } from "../../../api/api.js";
// // import { getState } from "../../../state/state.js";
// // import { reportPost } from "../../reporting/reporting.js";
// // import { toggleLike } from "../../beats/likes.js";
// // import { createCommentsSection } from "../../comments/comments.js";
// // import { createElement } from "../../../components/createElement.js";
// // import { heartSVG, commentSVG, morevSVG } from "../../../components/svgs.js";
// // import Button from "../../../components/base/Button.js";
// // import { openEditModal } from "./postEditor.js";
// // import { debounce } from "../../../utils/deutils.js";
// // import { svgToNode, deletePost } from "./helpers.js";


// // export async function createActions(postId, isCreator, postElement) {
// //     const user = getState("user");
// //     const isLoggedIn = Boolean(user);

// //     // Container
// //     const actionsContainer = createElement("div", { class: "post-actions" });

// //     // --- Fetch lightweight metadata ---
// //     const metadata = await fetchPostMetadata(postId);

// //     // --- LIKE BUTTON ---
// //     const likeLabel = createElement("span", {}, [metadata.likes]);
// //     const likeButton = createElement("button", {
// //         class: metadata.likedByUser ? "like liked" : "like"
// //     }, [
// //         svgToNode(heartSVG),
// //         likeLabel
// //     ]);

// //     if (isLoggedIn) {
// //         likeButton.addEventListener("click", debounce(async () => {
// //             try {
// //                 const result = await toggleLike("post", postId);
// //                 if (!result || typeof result.count !== "number") return;
// //                 likeLabel.textContent = result.count;
// //                 likeButton.classList.toggle("liked", result.liked);
// //             } catch (err) {
// //                 console.error("Failed to toggle like", err);
// //             }
// //         }, 500));
// //     }

// //     actionsContainer.appendChild(likeButton);

// //     // --- COMMENT BUTTON ---
// //     const commentButton = createElement("button", { class: "comment" }, [
// //         svgToNode(commentSVG),
// //         createElement("span", {}, [metadata.comments])
// //     ]);

// //     commentButton.addEventListener("click", async () => {
// //         if (!postElement.querySelector(".comments-section")) {
// //             const commentsEl = createCommentsSection(postId, [], "feed", user);
// //             postElement.appendChild(commentsEl);
// //         }
// //     });

// //     actionsContainer.appendChild(commentButton);

// //     // --- MORE MENU ---
// //     const moreButton = createElement("button", { class: "more-btn" }, [svgToNode(morevSVG)]);
// //     const dropdown = createElement("div", { class: "dropdown hidden" });

// //     const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
// //     reportButton.addEventListener("click", () => {
// //         dropdown.classList.add("hidden");
// //         reportPost(postId, "post");
// //     });
// //     dropdown.appendChild(reportButton);

// //     if (isCreator) {
// //         const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
// //         deleteButton.addEventListener("click", () => {
// //             dropdown.classList.add("hidden");
// //             deletePost(postId, postElement);
// //         });
// //         dropdown.appendChild(deleteButton);

// //         const editBtn = Button("Edit", "", { click: () => openEditModal({ postId }) }, "edit-btn");
// //         dropdown.appendChild(editBtn);
// //     }

// //     const moreWrapper = createElement("div", { class: "more-wrapper" }, [moreButton, dropdown]);
// //     actionsContainer.appendChild(moreWrapper);

// //     moreButton.addEventListener("click", (e) => {
// //         e.stopPropagation();
// //         dropdown.classList.toggle("hidden");

// //         if (!dropdown.classList.contains("hidden")) {
// //             const handleOutside = (event) => {
// //                 if (!moreWrapper.contains(event.target)) {
// //                     dropdown.classList.add("hidden");
// //                     document.removeEventListener("click", handleOutside);
// //                     document.removeEventListener("keydown", handleEsc);
// //                 }
// //             };
// //             const handleEsc = (event) => {
// //                 if (event.key === "Escape") {
// //                     dropdown.classList.add("hidden");
// //                     document.removeEventListener("click", handleOutside);
// //                     document.removeEventListener("keydown", handleEsc);
// //                 }
// //             };
// //             document.addEventListener("click", handleOutside);
// //             document.addEventListener("keydown", handleEsc);
// //         }
// //     });

// //     return actionsContainer;
// // }

// // // --- New helper ---
// // async function fetchPostMetadata(postId) {
// //     try {
// //         const data = await apiFetch(`/posts/${postId}/metadata`);
// //         return {
// //             likes: data.likes || 0,
// //             comments: data.comments || 0,
// //             likedByUser: data.likedByUser || false
// //         };
// //     } catch (err) {
// //         console.error("Failed to fetch post metadata", err);
// //         return { likes: 0, comments: 0, likedByUser: false };
// //     }
// // }


// // // export function createActions(post, isLoggedIn, isCreator, userLikes = {}, posts = [], postElement, postsContainer, i) {
// // //     const currentUserId = getState("user");
// // //     const entityType = "feed";
// // //     const entityId = post.postid;

// // //     const actionsContainer = createElement("div", { class: "post-actions" });

// // //     function createActionButton(iconSVG, label = "", className = "", onClick = null) {
// // //         const icon = svgToNode(iconSVG);
// // //         const labelEl = label ? createElement("span", {}, [label]) : null;
// // //         const btnChildren = labelEl ? [icon, labelEl] : [icon];
// // //         const btn = createElement("button", { class: className }, btnChildren);
// // //         if (onClick) btn.addEventListener("click", onClick);
// // //         return btn;
// // //     }

// // //     // --- LIKE BUTTON ---
// // //     if (isLoggedIn) {
// // //         const liked = Boolean(userLikes[entityId]);
// // //         const likeLabel = createElement("span", {}, [post.likes]);
// // //         const likeButton = createElement("button", { class: liked ? "like liked" : "like" }, [
// // //             svgToNode(heartSVG),
// // //             likeLabel
// // //         ]);

// // //         likeButton.addEventListener("click", debounce(async () => {
// // //             try {
// // //                 const result = await toggleLike("post", entityId);
// // //                 if (!result || typeof result.count !== "number") return;

// // //                 likeLabel.textContent = result.count;
// // //                 likeButton.classList.toggle("liked", result.liked);
// // //                 userLikes[entityId] = result.liked;
// // //             } catch (err) {
// // //                 console.error("Failed to toggle like", err);
// // //             }
// // //         }, 500));

// // //         actionsContainer.appendChild(likeButton);
// // //     }

// // //     // --- COMMENT BUTTON ---
// // //     const commentButton = createActionButton(commentSVG, "", "comment", () => {
// // //         if (!post._commentSectionVisible) {
// // //             const commentsEl = createCommentsSection(post.postid, post.comments || [], entityType, currentUserId);
// // //             actionsContainer.parentElement.appendChild(commentsEl);
// // //             post._commentSectionVisible = true;
// // //         }
// // //     });
// // //     actionsContainer.appendChild(commentButton);

// // //     // --- MORE MENU ---
// // //     const moreButton = createElement("button", { class: "more-btn" }, [svgToNode(morevSVG)]);
// // //     const dropdownx = createElement("div", { class: "dropxdown hidden" });

// // //     function closeDropdown() {
// // //         dropdownx.classList.add("hidden");
// // //     }

// // //     const reportButton = createElement("button", { class: "report-btn" }, ["Report"]);
// // //     reportButton.addEventListener("click", () => {
// // //         closeDropdown();
// // //         reportPost(entityId, "post");
// // //     });
// // //     dropdownx.appendChild(reportButton);

// // //     if (isCreator) {
// // //         const deleteButton = createElement("button", { class: "delete-btn" }, ["Delete"]);
// // //         deleteButton.addEventListener("click", () => {
// // //             closeDropdown();
// // //             deletePost(entityId, postElement, posts);
// // //         });
// // //         dropdownx.appendChild(deleteButton);

// // //         const editBtn = Button("Edit", "", { click: () => openEditModal(post, postsContainer, i) }, "edit-btn");
// // //         dropdownx.appendChild(editBtn);
// // //     }

// // //     const moreWrapper = createElement("div", { class: "more-wrapper" }, [moreButton, dropdownx]);
// // //     actionsContainer.appendChild(moreWrapper);

// // //     moreButton.addEventListener("click", (e) => {
// // //         e.stopPropagation();
// // //         dropdownx.classList.toggle("hidden");

// // //         if (!dropdownx.classList.contains("hidden")) {
// // //             const handleClickOutside = (event) => {
// // //                 if (!moreWrapper.contains(event.target)) {
// // //                     closeDropdown();
// // //                     document.removeEventListener("click", handleClickOutside);
// // //                     document.removeEventListener("keydown", handleEsc);
// // //                 }
// // //             };

// // //             const handleEsc = (event) => {
// // //                 if (event.key === "Escape") {
// // //                     closeDropdown();
// // //                     document.removeEventListener("click", handleClickOutside);
// // //                     document.removeEventListener("keydown", handleEsc);
// // //                 }
// // //             };

// // //             document.addEventListener("click", handleClickOutside);
// // //             document.addEventListener("keydown", handleEsc);
// // //         }
// // //     });

// // //     return actionsContainer;
// // // }
