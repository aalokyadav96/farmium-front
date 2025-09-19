import Modal from "../../../components/ui/Modal.mjs";
import { createElement } from "../../../components/createElement.js";
import { apiFetch } from "../../../api/api.js";
import Notify from "../../../components/ui/Notify.mjs";
import { createFormGroup } from "../../../components/createFormGroup.js";

export function openEditModal(post, postsContainer, i) {
    // --- form fields ---
    let titleField, descField, tagsField, subtitleInput, langSelect;
    const textField = createFormGroup({
        type: "textarea",
        value: post.text || "",
        label: post.type === "text" ? "Caption/Text:" : "",
        id: "edit-text"
    });

    if (post.type === "video" || post.type === "audio") {
        titleField = createFormGroup({
            type: "text",
            value: post.title || "",
            label: "Title:",
            id: "edit-title",
            placeholder: "Title"
        });

        descField = createFormGroup({
            type: "textarea",
            value: post.description || "",
            label: "Description:",
            id: "edit-desc",
            placeholder: "Description"
        });

        tagsField = createFormGroup({
            type: "text",
            value: (post.tags || []).join(", "),
            label: "Tags:",
            id: "edit-tags",
            placeholder: "Tags (comma separated)"
        });

        if (post.type === "video") {
            subtitleInput = createFormGroup({
                type: "file",
                accept: ".vtt",
                label: "Upload Subtitles:",
                id: "edit-subtitle"
            });

            langSelect = createFormGroup({
                type: "select",
                label: "Subtitle Language:",
                id: "edit-subtitle-lang",
                options: [
                    { value: "en", label: "English (default)" },
                    { value: "es", label: "Spanish" },
                    { value: "fr", label: "French" },
                    { value: "de", label: "German" },
                    { value: "zh", label: "Chinese" },
                    { value: "ar", label: "Arabic" }
                ],
                value: "en"
            });
        }
    }

    const saveBtn = createElement("button", { class: ["save-btn"] }, ["Save"]);
    const cancelBtn = createElement("button", { class: ["cancel-btn"] }, ["Cancel"]);

    // --- assemble editor content ---
    const editorChildren = [];
    if (post.type === "text" || post.type === "image") editorChildren.push(textField);
    if (post.type === "video" || post.type === "audio") {
        editorChildren.push(titleField, descField, tagsField);
        if (post.type === "video") editorChildren.push(subtitleInput, langSelect);
    }
    editorChildren.push(saveBtn, cancelBtn);

    const editor = createElement("div", { class: ["edit-container"] }, editorChildren);

    // --- modal ---
    const { modal, close } = Modal({
        title: "Edit Post",
        content: editor,
        size: "large",
        closeOnOverlayClick: true
    });

    cancelBtn.addEventListener("click", () => close());

    saveBtn.addEventListener("click", async () => {
        try {
            const body = {};
            if (post.type === "text" || post.type === "image") {
                body.text = textField.querySelector("textarea").value;
            }
            if (post.type === "video" || post.type === "audio") {
                body.title = titleField.querySelector("input").value;
                body.description = descField.querySelector("textarea").value;
                body.tags = tagsField.querySelector("input").value
                    .split(",")
                    .map(t => t.trim())
                    .filter(Boolean);
            }

            const updated = await apiFetch(`/feed/post/${post.postid}`, "PATCH", body);

            if (post.type === "video" && subtitleInput) {
                const fileInput = subtitleInput.querySelector("input");
                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append("subtitle", fileInput.files[0]);
                    const lang = langSelect.querySelector("select").value || "en";
                    formData.append("lang", lang);

                    await apiFetch(
                        `/feed/post/${post.postid}/subtitles/${lang}`,
                        "POST",
                        formData,
                        { isForm: true }
                    );
                }
            }

            Notify("Post updated successfully", { type: "success", duration: 2000 });
            // renderPost(updated, postsContainer, i);

        } catch (err) {
            console.error(err);
            Notify("Failed to update post", { type: "error", duration: 3000 });
        }
    });
}

// // import Modal from "../../../components/ui/Modal.mjs";
// // import { createElement } from "../../../components/createElement.js";
// // import { apiFetch } from "../../../api/api.js";
// // import Notify from "../../../components/ui/Notify.mjs";
// // import { createFormGroup } from "../../../components/createFormGroup.js"; // ensure this returns { group, input }

// // export function openEditModal(post, postsContainer, i) {
// //     let titleField, descField, tagsField, subtitleInput, langSelect;
    
// //     // Text or image caption
// //     const textField = createFormGroup({
// //         type: "textarea",
// //         value: post.text || "",
// //         label: post.type === "text" ? "Caption/Text:" : "Caption:"
// //     });

// //     // Video/audio fields
// //     if (post.type === "video" || post.type === "audio") {
// //         titleField = createFormGroup({
// //             type: "text",
// //             value: post.title || "",
// //             label: "Title:",
// //             placeholder: "Title"
// //         });

// //         descField = createFormGroup({
// //             type: "textarea",
// //             value: post.description || "",
// //             label: "Description:",
// //             placeholder: "Description"
// //         });

// //         tagsField = createFormGroup({
// //             type: "text",
// //             value: (post.tags || []).join(", "),
// //             label: "Tags:",
// //             placeholder: "Tags (comma separated)"
// //         });

// //         if (post.type === "video") {
// //             subtitleInput = createFormGroup({
// //                 type: "file",
// //                 accept: ".vtt",
// //                 label: "Upload Subtitles:"
// //             });

// //             langSelect = createFormGroup({
// //                 type: "select",
// //                 label: "Subtitle Language:",
// //                 options: [
// //                     { value: "en", label: "English (default)" },
// //                     { value: "es", label: "Spanish" },
// //                     { value: "fr", label: "French" },
// //                     { value: "de", label: "German" },
// //                     { value: "zh", label: "Chinese" },
// //                     { value: "ar", label: "Arabic" }
// //                 ],
// //                 value: "en"
// //             });
// //         }
// //     }

// //     // Save/Cancel buttons
// //     const saveBtn = createElement("button", { class: ["save-btn"] }, ["Save"]);
// //     const cancelBtn = createElement("button", { class: ["cancel-btn"] }, ["Cancel"]);

// //     // Assemble editor children
// //     const editorChildren = [];
// //     if (post.type === "text" || post.type === "image") editorChildren.push(textField.group);
// //     if (post.type === "video" || post.type === "audio") {
// //         editorChildren.push(titleField.group, descField.group, tagsField.group);
// //         if (post.type === "video") editorChildren.push(subtitleInput.group, langSelect.group);
// //     }
// //     editorChildren.push(saveBtn, cancelBtn);

// //     const editor = createElement("div", { class: ["edit-container"] }, editorChildren);

// //     // Open modal
// //     const { modal, close } = Modal({
// //         title: "Edit Post",
// //         content: editor,
// //         size: "large",
// //         closeOnOverlayClick: true
// //     });

// //     cancelBtn.addEventListener("click", () => close());

// //     saveBtn.addEventListener("click", async () => {
// //         try {
// //             const body = {};

// //             if (post.type === "text" || post.type === "image") {
// //                 body.text = textField.input.value;
// //             }

// //             if (post.type === "video" || post.type === "audio") {
// //                 body.title = titleField.input.value;
// //                 body.description = descField.input.value;
// //                 body.tags = tagsField.input.value.split(",").map(t => t.trim()).filter(Boolean);
// //             }

// //             // Update post
// //             const updated = await apiFetch(`/feed/post/${post.postid}`, "PATCH", body);

// //             // Upload subtitles if any
// //             if (post.type === "video" && subtitleInput && subtitleInput.input.files.length > 0) {
// //                 const formData = new FormData();
// //                 formData.append("subtitle", subtitleInput.input.files[0]);
// //                 const lang = langSelect.input.value || "en";
// //                 formData.append("lang", lang);

// //                 await apiFetch(
// //                     `/feed/post/${post.postid}/subtitles/${lang}`,
// //                     "POST",
// //                     formData,
// //                     { isForm: true }
// //                 );
// //             }

// //             Notify("Post updated successfully", { type: "success", duration: 2000 });
// //             // Optionally update UI immediately
// //             // renderPost(updated, postsContainer, i);

// //         } catch (err) {
// //             console.error(err);
// //             Notify("Failed to update post", { type: "error", duration: 3000 });
// //         }
// //     });
// // }

// import Modal from "../../../components/ui/Modal.mjs";
// import { createElement } from "../../../components/createElement.js";
// import { apiFetch } from "../../../api/api.js";
// import Notify from "../../../components/ui/Notify.mjs";
// // import { renderPost } from "./renderPost.js";

// export function openEditModal(post, postsContainer, i) {
//     let titleField, descField, tagsField, subtitleInput, langSelect;
//     const textField = createElement("textarea", { class: ["edit-textarea"] }, [post.text || ""]);

//     if (post.type === "video" || post.type === "audio") {
//         titleField = createElement("input", {
//             type: "text",
//             value: post.title || "",
//             placeholder: "Title"
//         });
//         descField = createElement("textarea", { placeholder: "Description" }, [post.description || ""]);
//         tagsField = createElement("input", {
//             type: "text",
//             value: (post.tags || []).join(", "),
//             placeholder: "Tags (comma separated)"
//         });

//         if (post.type === "video") {
//             subtitleInput = createElement("input", { type: "file", accept: ".vtt" });
//             langSelect = createElement("select", { class: ["subtitle-lang"] }, [
//                 createElement("option", { value: "en", selected: true }, ["English (default)"]),
//                 createElement("option", { value: "es" }, ["Spanish"]),
//                 createElement("option", { value: "fr" }, ["French"]),
//                 createElement("option", { value: "de" }, ["German"]),
//                 createElement("option", { value: "zh" }, ["Chinese"]),
//                 createElement("option", { value: "ar" }, ["Arabic"])
//             ]);
//         }
//     }

//     const saveBtn = createElement("button", { class: ["save-btn"] }, ["Save"]);
//     const cancelBtn = createElement("button", { class: ["cancel-btn"] }, ["Cancel"]);

//     const editorChildren = [];
//     if (post.type === "text" || post.type === "image") {
//         editorChildren.push(createElement("label", {}, ["Caption/Text:"]), textField);
//     }
//     if (post.type === "video" || post.type === "audio") {
//         editorChildren.push(
//             createElement("label", {}, ["Title:"]), titleField,
//             createElement("label", {}, ["Description:"]), descField,
//             createElement("label", {}, ["Tags:"]), tagsField
//         );
//         if (post.type === "video") {
//             editorChildren.push(
//                 createElement("label", {}, ["Upload Subtitles:"]), subtitleInput,
//                 createElement("label", {}, ["Subtitle Language:"]), langSelect
//             );
//         }
//     }

//     editorChildren.push(saveBtn, cancelBtn);
//     const editor = createElement("div", { class: ["edit-container"] }, editorChildren);

//     // Modal returns { modal, close, closed }
//     const { modal, close } = Modal({
//         title: "Edit Post",
//         content: editor,
//         size: "large",
//         closeOnOverlayClick: true,
//     });

//     cancelBtn.addEventListener("click", () => {
//         close(); // ✅ ensures scroll is unlocked
//     });

//     saveBtn.addEventListener("click", async () => {
//         try {
//             const body = {};
//             if (post.type === "text" || post.type === "image") {
//                 body.text = textField.value;
//             }
//             if (post.type === "video" || post.type === "audio") {
//                 body.title = titleField.value;
//                 body.description = descField.value;
//                 body.tags = tagsField.value.split(",").map(t => t.trim()).filter(Boolean);
//             }
    
//             // First update post
//             const updated = await apiFetch(`/feed/post/${post.postid}`, "PATCH", body);
    
//             // Then upload subtitles if present
//             if (post.type === "video" && subtitleInput && subtitleInput.files.length > 0) {
//                 const formData = new FormData();
//                 formData.append("subtitle", subtitleInput.files[0]);
//                 formData.append("lang", langSelect.value || "en");
    
//                 await apiFetch(
//                     `/feed/post/${post.postid}/subtitles/${langSelect.value || "en"}`,
//                     "POST",
//                     formData,
//                     { isForm: true }
//                 );
//             }
    
//             // ✅ Only show success if everything above worked
//             Notify("Post updated successfully", { type: "success", duration: 2000 });
    
//             // You could also update UI immediately if needed
//             // renderPost(updated, postsContainer, i);
    
//         } catch (err) {
//             console.error(err);
//             Notify("Failed to update post", { type: "error", duration: 3000 });
//         }
//     });
    
// }