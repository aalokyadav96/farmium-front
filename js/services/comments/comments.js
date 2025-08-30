import { apiFetch } from "../../api/api";
import Button from "../../components/base/Button";
import { createElement } from "../../components/createElement";
import { fetchUserMeta } from "../../utils/usersMeta";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";

/**
 * Internal store for per-post comment state
 */
const commentState = new Map();

/**
 * Map frontend sort values to backend
 */
function mapSort(val) {
    if (val === "newest") return "new";
    if (val === "oldest") return "old";
    return val;
}

/**
 * Fetch comments for a post (with pagination & sort)
 */
async function fetchComments(entityType, postId, page = 1, sort = "newest") {
    try {
        const res = await apiFetch(
            `/comments/${entityType}/${postId}?sort=${mapSort(sort)}&page=${page}`
        );
        return Array.isArray(res) ? res : [];
    } catch (err) {
        console.error(`Failed to fetch comments for post ${postId}`, err);
        return [];
    }
}
/**
 * Render a single comment
 */
function renderComment(comment) {
    const { user = {} } = comment;
    // let cmtavatar = resolveImagePath(EntityType.USER, PictureType.PHOTO, user.profile_picture)
    let cmtavatar = resolveImagePath(EntityType.USER, PictureType.THUMB, `${comment.createdBy}.jpg`)
    // avatar
    // const avatar = createElement("img", {
    //     // src: user.profile_picture || "/default.png",
    //     src: cmtavatar,
    //     alt: `${user.username || "Unknown"}'s avatar`,
    //     class: "comment-avatar"
    // });
    const avatar = Imagex( {
        src: cmtavatar,
        alt: `${user.username || "Unknown"}'s avatar`,
        classes: "comment-avatar"
    });

    // username + timestamp
    const header = createElement("div", { class: "comment-header" }, [
        createElement("span", { class: "comment-username" }, [user.username || "Unknown"]),
        createElement("span", { class: "comment-timestamp" }, [
            comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""
        ])
    ]);

    // text content
    const body = createElement("div", { class: "comment-body" }, [
        createElement("p", {}, [comment.content || ""])
    ]);

    // actions (future: reply, like, report)
    const actions = createElement("div", { class: "comment-actions" }, [
        Button("Reply", "reply-btn-cmt", {}, "comment-reply buttonx"),
        Button("Report", "report-btn-cmt", {}, "comment-report buttonx")
    ]);

    // wrapper
    return createElement("div", { class: "comment" }, [
        createElement("div", { class: "comment-left" }, [avatar]),
        createElement("div", { class: "comment-right" }, [header, body, actions])
    ]);
}

/**
 * Render all comments for a post
 */
async function renderComments(postId) {
    const state = commentState.get(postId);
    if (!state) return;

    state.list.innerHTML = "";

    const userIds = [...new Set(state.comments.map(c => c.createdBy))];
    const usersMeta = await fetchUserMeta(userIds);

    state.comments.forEach(c => {
        const user = usersMeta[c.createdBy] || {};
        const commentEl = renderComment({ ...c, user });
        state.list.appendChild(commentEl);
    });

    if (state.hasMore) {
        const loadMoreBtn = Button("Load More", "", {
            click: () => fetchMoreComments(postId, state.entityType)
        }, "load-more-comments buttonx");
        state.list.appendChild(
            createElement("div", { class: "comment-load-more" }, [loadMoreBtn])
        );
    }
}

/**
 * Fetch additional comments (pagination)
 */
async function fetchMoreComments(postId, entityType) {
    const state = commentState.get(postId);
    if (!state) return;

    try {
        const nextPage = state.page + 1;
        const newComments = await fetchComments(entityType, postId, nextPage, state.sort);

        if (newComments.length === 0) {
            state.hasMore = false;
        } else {
            state.comments = state.comments.concat(newComments);
            state.page = nextPage;
        }

        renderComments(postId);
    } catch (err) {
        console.error("Failed to load more comments", err);
    }
}

/**
 * Load comments for a post (first page or reset)
 */
async function loadComments(entityType, postId, reset = false) {
    const state = commentState.get(postId);
    if (!state) return;

    if (reset) {
        state.comments = [];
        state.page = 1;
        state.hasMore = true;
    }

    const newComments = await fetchComments(entityType, postId, state.page, state.sort);

    state.comments = state.comments.concat(newComments);
    if (newComments.length === 0) {
        state.hasMore = false;
    }

    renderComments(postId);
}

/**
 * Handle new comment submission
 */
async function handleSubmit(e, postId, entityType) {
    e.preventDefault();
    const state = commentState.get(postId);
    if (!state) return;

    const content = state.input.value.trim();
    if (!content) return;

    try {
        const newComment = await apiFetch(
            `/comments/${entityType}/${postId}`,
            "POST",
            { content }
        );

        // fetch fresh user meta for the new comment
        const usersMeta = await fetchUserMeta([newComment.createdBy]);
        const user = usersMeta[newComment.createdBy] || {};

        state.comments.unshift({ ...newComment, user });
        state.input.value = "";
        renderComments(postId);
    } catch (err) {
        console.error("Failed to post comment", err);
    }
}

/**
 * Debounce utility
 */
function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), delay);
    };
}

/**
 * Create a comments section for a specific post
 */
export function createCommentsSection(postId, initialComments = [], entityType, author) {
    const container = createElement("div", { class: "comments-section", dataset: { postId } });

    // Comment list
    const list = createElement("div", { class: "comments-list" });

    // Sort control
    const sort = createElement("select", { class: "comment-sort", id: `comment-sort-${postId}` }, [
        createElement("option", { value: "newest" }, ["Newest"]),
        createElement("option", { value: "oldest" }, ["Oldest"])
    ]);

    // Input form
    const form = createElement("form", { class: "comment-form" }, [
        createElement("textarea", {
            class: "comment-input",
            placeholder: "Write a comment..."
        }),
        createElement("button", { type: "submit" }, ["Post"])
    ]);

    container.appendChild(sort);
    container.appendChild(list);
    container.appendChild(form);

    // Setup state
    commentState.set(postId, {
        comments: Array.isArray(initialComments) ? initialComments : [],
        list,
        form,
        input: form.querySelector("textarea"),
        sort: "newest",
        page: 1,
        hasMore: true,
        entityType
    });

    // Initial render
    renderComments(postId);

    // Load from API (first page)
    loadComments(entityType, postId, true);

    // Events
    form.addEventListener("submit", (e) => handleSubmit(e, postId, entityType));
    sort.addEventListener(
        "change",
        debounce((e) => {
            const state = commentState.get(postId);
            if (state) {
                state.sort = e.target.value;
                loadComments(entityType, postId, true);
            }
        }, 300)
    );

    return container;
}
