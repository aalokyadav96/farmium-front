import { apiFetch } from "../../api/api.js";
import { reportPost } from "../reporting/reporting.js";

export function createCommentsSection(postId, comments = [], entityType, entityId, currentUserId) {
    const container = document.createElement("div");
    container.className = "comments-section";

    const list = document.createElement("div");
    list.className = "comments-list";
    container.appendChild(list);

    const loadSpan = createLoadCommentsSpan(entityType, entityId, list, currentUserId);
    container.appendChild(loadSpan);

    const form = createCommentForm(postId, entityType, entityId, newComment => {
        addCommentToDOM(list, newComment, entityType, entityId, currentUserId);
    });
    container.appendChild(form);

    comments.forEach(comment => addCommentToDOM(list, comment, entityType, entityId, currentUserId));

    return container;
}

function createCommentForm(postId, entityType, entityId, onCommentAdded) {
    const form = document.createElement("form");
    form.className = "comment-form";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Write a comment...";
    input.required = true;

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Post";

    form.appendChild(input);
    form.appendChild(submit);

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const content = input.value.trim();
        if (!content) return;

        try {
            const newComment = await apiFetch(
                `/comments/${entityType}/${entityId}`,
                "POST",
                JSON.stringify({ content })
            );
            input.value = "";
            onCommentAdded(newComment);
        } catch (err) {
            console.error("Failed to post comment", err);
        }
    });

    return form;
}

function addCommentToDOM(container, comment, entityType, entityId, currentUserId) {
    const wrapper = document.createElement("div");
    wrapper.className = "comment";
    wrapper.dataset.commentId = comment._id;

    const text = document.createElement("span");
    text.textContent = comment.content;

    const reportBtn = document.createElement("button");
    reportBtn.textContent = "Report";
    reportBtn.className = "report-comment";
    reportBtn.type = "button";

    wrapper.appendChild(text);
    wrapper.appendChild(reportBtn);

    // Only show edit/delete if current user is the author
    if (comment.created_by === currentUserId) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "edit-comment";
        editBtn.type = "button";

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-comment";
        deleteBtn.type = "button";

        editBtn.addEventListener("click", () =>
            handleEditComment(wrapper, comment, entityType, entityId, currentUserId)
        );
        deleteBtn.addEventListener("click", () =>
            handleDeleteComment(wrapper, comment._id, entityType, entityId)
        );

        wrapper.appendChild(editBtn);
        wrapper.appendChild(deleteBtn);
    }

    reportBtn.addEventListener("click", () =>
        handleReportComment(comment._id, entityType, entityId)
    );

    container.appendChild(wrapper);
}

async function handleEditComment(wrapper, comment, entityType, entityId, currentUserId) {
    // Guard in case someone triggers this manually
    if (comment.authorId !== currentUserId) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = comment.content;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.type = "button";

    wrapper.innerHTML = "";
    wrapper.appendChild(input);
    wrapper.appendChild(saveBtn);

    saveBtn.addEventListener("click", async () => {
        const newContent = input.value.trim();
        if (!newContent) return;

        try {
            const updatedComment = await apiFetch(
                `/comments/${entityType}/${entityId}/${comment._id}`,
                "PUT",
                JSON.stringify({ content: newContent })
            );
            comment.content = updatedComment.content;
            const parent = wrapper.parentElement;
            wrapper.remove();
            addCommentToDOM(parent, comment, entityType, entityId, currentUserId);
        } catch (err) {
            console.error("Failed to update comment", err);
        }
    });
}

async function handleReportComment(commentId, entityType, entityId) {
    reportPost(commentId, "comment", entityType, entityId);
}

async function handleDeleteComment(wrapper, commentId, entityType, entityId) {
    try {
        await apiFetch(`/comments/${entityType}/${entityId}/${commentId}`, "DELETE");
        wrapper.remove();
    } catch (err) {
        console.error("Failed to delete comment", err);
    }
}

function createLoadCommentsSpan(entityType, entityId, listContainer, currentUserId) {
    const span = document.createElement("span");
    span.textContent = "Load Comments";
    span.className = "load-comments";
    span.style.cursor = "pointer";
    span.style.color = "blue";
    span.style.textDecoration = "underline";

    let loaded = false;

    span.addEventListener("click", async () => {
        if (loaded) return;
        try {
            const comments = await apiFetch(`/comments/${entityType}/${entityId}`, "GET");
            comments.forEach(comment => {
                addCommentToDOM(listContainer, comment, entityType, entityId, currentUserId);
            });
            loaded = true;
            span.remove();
        } catch (err) {
            console.error("Failed to load comments", err);
            span.textContent = "Failed to load. Retry?";
        }
    });

    return span;
}

