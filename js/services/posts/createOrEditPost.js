import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import Notify from "../../components/ui/Notify.mjs";

// --- Create Post ---
export async function createPost(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    if (!isLoggedIn) {
        Notify("Login required to post.", { type:"warning", duration:3000, dismissible:true });
        navigate('/login');
        return;
    }

    const section = createElement('div', { class: "create-section" });
    section.appendChild(createElement('h2', {}, ['Create Post']));

    const draft = JSON.parse(localStorage.getItem("draftPost") || "{}");
    const form = renderPostForm(draft);

    section.appendChild(form);
    contentContainer.appendChild(section);
}

// --- Edit Post ---
export async function editPost(isLoggedIn, postId, contentContainer) {
    contentContainer.innerHTML = '';
    if (!isLoggedIn) {
        Notify("Login required to edit post.", { type:"warning", duration:3000, dismissible:true });
        navigate('/login');
        return;
    }

    let post;
    try {
        post = await apiFetch(`/posts/${encodeURIComponent(postId)}`);
    } catch (err) {
        Notify("Failed to load post for editing.", { type:"error", duration:3000, dismissible:true });
        console.error(err);
        return;
    }

    const section = createElement('div', { class: "edit-section" });
    section.appendChild(createElement('h2', {}, ['Edit Post']));

    const localDraft = JSON.parse(localStorage.getItem("draftPost") || "{}");
    const initialData = Object.keys(localDraft).length ? localDraft : post.post;

    const form = renderPostForm(initialData);

    section.appendChild(form);
    contentContainer.appendChild(section);
}

const categoryMap = {
    News: ["Politics", "Sports", "Economy", "Technology", "World"],
    Blog: ["Travel", "Food", "Lifestyle", "Personal", "Health"],
    Review: ["Event", "Place", "Product", "Movie", "Book"],
    Tutorial: ["Coding", "Cooking", "DIY", "Design"],
    Opinion: ["Editorial", "Analysis", "Satire"],
    Interview: ["Expert", "Celebrity", "Case Study"]
};

function createSelect(id, name, options, selectedValue = '') {
    const select = createElement('select', { id, name, required: true });
    select.appendChild(createElement('option', { value: '' }, [`Select ${name}`]));
    options.forEach(opt =>
        select.appendChild(
            createElement('option', {
                value: opt,
                selected: opt === selectedValue
            }, [opt])
        )
    );
    return select;
}

function createInputGroup(labelText, inputElement, extraNode = null) {
    const wrapper = createElement('div', { class: 'form-group' });
    const label = createElement('label', { for: inputElement.id }, [labelText]);
    wrapper.appendChild(label);
    wrapper.appendChild(inputElement);
    if (extraNode) wrapper.appendChild(extraNode);
    return wrapper;
}

function populateSubCategories(selectEl, mainCategory, selected = '') {
    selectEl.innerHTML = '';
    selectEl.appendChild(createElement('option', { value: '' }, ['Select sub category']));
    const subs = categoryMap[mainCategory];
    if (!subs) {
        Notify("No subcategories found for selected category.", {type:"error",duration:3000, dismissible:true});
        return;
    }
    subs.forEach(sub =>
        selectEl.appendChild(
            createElement('option', {
                value: sub,
                selected: sub === selected
            }, [sub])
        )
    );
}

// --- Block editor helpers ---
function createTextBlock(value = "", onRemove) {
    const textarea = createElement("textarea", { rows: 4, placeholder: "Write text..." });
    textarea.value = value;
    const removeBtn = createElement("button", { type: "button", class: "btn btn-danger", style: "margin-left:6px;" }, ["Remove"]);
    removeBtn.addEventListener("click", () => onRemove());
    const wrapper = createElement("div", { class: "block-wrapper" }, [textarea, removeBtn]);
    return { type: "text", el: wrapper, input: textarea };
}

function createImageBlock(url = "", onRemove) {
    const input = createElement("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
    const preview = createElement("div", { style: "margin-top:6px;" });
    let currentURL = null;

    if (url) {
        const img = createElement("img", { src: url, style: "max-width:150px; border-radius:6px;" });
        preview.appendChild(img);
        currentURL = url;
    }

    input.addEventListener("change", e => {
        preview.innerHTML = "";
        if (currentURL && currentURL.startsWith("blob:")) URL.revokeObjectURL(currentURL);
        const f = e.target.files[0];
        if (f) {
            currentURL = URL.createObjectURL(f);
            preview.appendChild(createElement("img", { src: currentURL, style: "max-width:150px; border-radius:6px;" }));
        }
    });

    const removeBtn = createElement("button", { type: "button", class: "btn btn-danger", style: "margin-left:6px;" }, ["Remove"]);
    removeBtn.addEventListener("click", () => {
        if (currentURL && currentURL.startsWith("blob:")) URL.revokeObjectURL(currentURL);
        onRemove();
    });

    const wrapper = createElement("div", {}, [input, preview, removeBtn]);
    return { type: "image", el: wrapper, input, getUrl: () => currentURL || preview.querySelector("img")?.src };
}

function renderBlockEditor(initialBlocks = []) {
    const container = createElement("div", { id: "block-editor" });
    const blocks = [];

    function addBlock(type, data = {}, index = blocks.length) {
        let block;
        const onRemove = () => {
            container.removeChild(block.el);
            const idx = blocks.indexOf(block);
            if (idx > -1) blocks.splice(idx, 1);
        };
        if (type === "text") block = createTextBlock(data.content || "", onRemove);
        else if (type === "image") block = createImageBlock(data.url || "", onRemove);

        block.el.setAttribute("draggable", "true");
        block.el.style.cursor = "grab";

        // drag & drop
        block.el.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", blocks.indexOf(block));
            block.el.style.opacity = "0.5";
        });
        block.el.addEventListener("dragend", () => block.el.style.opacity = "1");
        block.el.addEventListener("dragover", e => { e.preventDefault(); block.el.style.borderTop = "2px solid #007bff"; });
        block.el.addEventListener("dragleave", () => { block.el.style.borderTop = ""; });
        block.el.addEventListener("drop", e => {
            e.preventDefault(); block.el.style.borderTop = "";
            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
            const toIndex = blocks.indexOf(block);
            if (fromIndex === toIndex) return;
            if (fromIndex < toIndex) container.insertBefore(blocks[fromIndex].el, blocks[toIndex].el.nextSibling);
            else container.insertBefore(blocks[fromIndex].el, blocks[toIndex].el);
            const moved = blocks.splice(fromIndex, 1)[0];
            blocks.splice(toIndex, 0, moved);
        });

        if (index >= container.children.length - 1) container.appendChild(block.el);
        else container.insertBefore(block.el, container.children[index]);
        blocks.push(block);
    }

    const controls = createElement("div", { style: "margin:10px 0;" }, [
        createElement("button", { type: "button" }, ["Add Text"]),
        createElement("button", { type: "button", style: "margin-left:6px;" }, ["Add Image"])
    ]);

    controls.children[0].addEventListener("click", () => addBlock("text"));
    controls.children[1].addEventListener("click", () => addBlock("image"));

    container.appendChild(controls);
    initialBlocks.forEach(b => addBlock(b.type, b));

    return { container, getBlocks: () => blocks };
}

// --- Form ---
function renderPostForm(postData = {}) {
    const form = createElement('form');

    const mainCategorySelect = createSelect('category-main', 'category-main', Object.keys(categoryMap), postData.category);
    const subCategorySelect = createSelect('category-sub', 'category-sub', categoryMap[postData.category] || [], postData.subcategory);

    const titleInput = createElement('input', { type: 'text', id: 'title', name: 'title', placeholder: 'Post title', required: true, value: postData.title || '' });

    const blockEditor = renderBlockEditor(postData.blocks || []);
    const referenceInput = createElement('input', { type: 'text', id: 'reference-id', name: 'reference-id', placeholder: 'Enter related entity ID (Product / Place / Event)', style: 'display:none;' });
    const referenceGroup = createInputGroup('Reference ID (in case of place, event or product)', referenceInput);

    function updateReferenceVisibility(main, sub) {
        const shouldShow = main === 'Review' && ['Product', 'Place', 'Event'].includes(sub);
        referenceInput.style.display = shouldShow ? '' : 'none';
        referenceInput.required = shouldShow;
    }
    updateReferenceVisibility(postData.category, postData.subcategory);

    mainCategorySelect.addEventListener('change', e => {
        const newMain = e.target.value;
        populateSubCategories(subCategorySelect, newMain);
        updateReferenceVisibility(newMain, '');
    });
    subCategorySelect.addEventListener('change', () => updateReferenceVisibility(mainCategorySelect.value, subCategorySelect.value));

    const submitBtn = createElement('button', { type: 'submit', class: 'btn btn-primary' }, [postData.postid ? 'Update Post' : 'Create Post']);
    const cancelBtn = createElement('button', { type: 'button', class: 'btn btn-secondary', style: 'margin-left:10px;' }, ['Cancel']);

    form.addEventListener('input', () => {
        const draft = {
            title: titleInput.value || "",
            category: mainCategorySelect.value || "",
            subcategory: subCategorySelect.value || "",
            blocks: blockEditor.getBlocks().map(b => b.type === 'text' ? { type: 'text', content: b.input.value } : { type: 'image', url: b.getUrl() || "" })
        };
        localStorage.setItem("draftPost", JSON.stringify(draft));
    });

    cancelBtn.addEventListener('click', () => {
        if (confirm("You have unsaved changes. Are you sure you want to leave?")) navigate('/posts');
    });

    form.append(
        createInputGroup('Main Category', mainCategorySelect),
        createInputGroup('Sub Category', subCategorySelect),
        referenceGroup,
        createInputGroup('Title', titleInput),
        createElement("div", {}, [createElement("label", {}, ["Content"]), blockEditor.container]),
        submitBtn,
        cancelBtn
    );

    form.addEventListener('submit', async e => {
        e.preventDefault();
        submitBtn.disabled = true;
        await handlePostSubmit(form, blockEditor.getBlocks(), !!postData.postid, postData.postid);
        submitBtn.disabled = false;
        localStorage.removeItem("draftPost");
    });

    return form;
}

// --- Submit handler ---
async function handlePostSubmit(form, blocks, isEdit = false, existingId = null) {
    const title = form.querySelector("#title")?.value.trim() || "";
    const category = form.querySelector("#category-main").value;
    const subcategory = form.querySelector("#category-sub").value;
    const referenceId = form.querySelector("#reference-id")?.value.trim();

    if (!title || !category || !subcategory) {
        Notify("Please fill in all required fields.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    if (category === "Review" && ["Product", "Place", "Event"].includes(subcategory) && !referenceId) {
        Notify("Reference ID is required for this review type.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    const payload = new FormData();
    payload.append("title", title);
    payload.append("category", category);
    payload.append("subcategory", subcategory);
    if (referenceId) payload.append("referenceId", referenceId);

    const blockData = [];
    let fileIndex = 0;

    for (const block of blocks) {
        if (block.type === "text") {
            const val = block.input.value.trim();
            if (val) blockData.push({ type: "text", content: val });
        } else if (block.type === "image") {
            const file = block.input?.files?.[0];
            if (file) {
                const error = validateImage(file);
                if (error) {
                    Notify(error, { type: "error", duration: 3000, dismissible: true });
                    return;
                }
                const placeholder = `__file_${fileIndex}__`;
                payload.append("images[]", file);
                blockData.push({ type: "image", placeholder });
                fileIndex++;
            } else {
                const url = block.getUrl();
                if (url) blockData.push({ type: "image", url });
            }
        }
    }

    payload.append("blocks", JSON.stringify(blockData));

    try {
        Notify(isEdit ? "Updating post..." : "Creating post...", { type: "info", duration: 3000, dismissible: true });
        const endpoint = isEdit ? `/posts/post/${encodeURIComponent(existingId)}` : '/posts/post';
        const method = isEdit ? 'PUT' : 'POST';
        const result = await apiFetch(endpoint, method, payload);
        Notify(isEdit ? "Post updated!" : "Post created!", { type: "success", duration: 3000, dismissible: true });
        localStorage.removeItem("draftPost");
        navigate(`/post/${isEdit ? existingId : result.postid}`);
    } catch (err) {
        Notify(`Error: ${err.message || err}`, { type: "error", duration: 3000, dismissible: true });
    }
}

function validateImage(file) {
    const maxSize = 5 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) return "Only JPG, PNG or WebP images allowed.";
    if (file.size > maxSize) return "Image too large (max 5 MB).";
    return null;
}

export { renderPostForm, handlePostSubmit };
