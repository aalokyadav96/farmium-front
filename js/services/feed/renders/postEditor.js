import { createElement } from "../../../components/createElement.js";
import { apiFetch } from "../../../api/api.js";
import Notify from "../../../components/ui/Notify.mjs";
import { renderPost } from "./renderPost.js";

export function openEditForm(post, postElement, postsContainer, i) {
    postElement.innerHTML = "";

    const textField = createElement("textarea", { class: ["edit-textarea"] }, [post.text || ""]);

    let titleField, descField, tagsField, subtitleInput, langSelect;

    if (post.type === "video" || post.type === "audio") {
        titleField = createElement("input", {
            type: "text",
            value: post.title || "",
            placeholder: "Title"
        });
        descField = createElement("textarea", { placeholder: "Description" }, [post.description || ""]);
        tagsField = createElement("input", {
            type: "text",
            value: (post.tags || []).join(", "),
            placeholder: "Tags (comma separated)"
        });

        if (post.type === "video") {
            subtitleInput = createElement("input", { type: "file", accept: ".vtt" });

            langSelect = createElement("select", { class: ["subtitle-lang"] }, [
                createElement("option", { value: "en", selected: true }, ["English (default)"]),
                createElement("option", { value: "es" }, ["Spanish"]),
                createElement("option", { value: "fr" }, ["French"]),
                createElement("option", { value: "de" }, ["German"]),
                createElement("option", { value: "zh" }, ["Chinese"]),
                createElement("option", { value: "ar" }, ["Arabic"])
            ]);
        }
    }

    const saveBtn = createElement("button", { class: ["save-btn"] }, ["Save"]);
    const cancelBtn = createElement("button", { class: ["cancel-btn"] }, ["Cancel"]);

    const editorChildren = [];
    if (post.type === "text" || post.type === "image") {
        editorChildren.push(createElement("label", {}, ["Caption/Text:"]), textField);
    }
    if (post.type === "video" || post.type === "audio") {
        editorChildren.push(
            createElement("label", {}, ["Title:"]), titleField,
            createElement("label", {}, ["Description:"]), descField,
            createElement("label", {}, ["Tags:"]), tagsField
        );
        if (post.type === "video") {
            editorChildren.push(
                createElement("label", {}, ["Upload Subtitles:"]), subtitleInput,
                createElement("label", {}, ["Subtitle Language:"]), langSelect
            );
        }
    }

    editorChildren.push(saveBtn, cancelBtn);

    const editor = createElement("div", { class: ["edit-container"] }, editorChildren);

    postElement.appendChild(editor);

    cancelBtn.addEventListener("click", () => {
        renderPost(post, postsContainer, i);
    });

    saveBtn.addEventListener("click", async () => {
        try {
            const body = {};
            if (post.type === "text" || post.type === "image") {
                body.text = textField.value;
            }
            if (post.type === "video" || post.type === "audio") {
                body.title = titleField.value;
                body.description = descField.value;
                body.tags = tagsField.value.split(",").map(t => t.trim()).filter(Boolean);
            }

            const updated = await apiFetch(`/feed/post/${post.postid}`, "PATCH", body);

            // Subtitle upload with default language = "en"
            if (post.type === "video" && subtitleInput && subtitleInput.files.length > 0) {
                const formData = new FormData();
                formData.append("subtitle", subtitleInput.files[0]);
                formData.append("lang", langSelect.value || "en"); // default enforced
                // await apiFetch(`/feed/post/${post.postid}/subtitles`, "POST", formData, { isForm: true });
                await apiFetch(`/feed/post/${post.postid}/subtitles/${langSelect.value || "en"}`, "POST", formData, { isForm: true });
            }

            Notify("Post updated successfully", { type: "success", duration: 2000 });
            renderPost(updated, postsContainer, i);

        } catch (err) {
            console.error(err);
            Notify("Failed to update post", { type: "error", duration: 3000 });
        }
    });
}
