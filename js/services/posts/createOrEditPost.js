import { createElement } from "../../components/createElement.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";

const categoryMap = {
    News: ["Politics", "Sports", "Economy", "Technology", "World"],
    Blog: ["Travel", "Food", "Lifestyle", "Personal", "Health"],
    Review: ["Event", "Place", "Product", "Movie", "Book"],
    Tutorial: ["Coding", "Cooking", "DIY", "Design"],
    Opinion: ["Editorial", "Analysis", "Satire"],
    Interview: ["Expert", "Celebrity", "Case Study"]
};

// Utility function to build a select element
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
        Snackbar("No subcategories found for selected category.", 3000);
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

function renderPostForm(postData = {}, onSubmit) {
    const form = createElement('form');

    const mainCategorySelect = createSelect(
        'category-main',
        'category-main',
        Object.keys(categoryMap),
        postData.category
    );

    const subCategorySelect = createSelect(
        'category-sub',
        'category-sub',
        categoryMap[postData.category] || [],
        postData.subcategory
    );

    const titleInput = createElement('input', {
        type: 'text',
        id: 'title',
        name: 'title',
        placeholder: 'Post title',
        required: true,
        value: postData.title || ''
    });

    const contentTextarea = createElement('textarea', {
        id: 'textcontent',
        name: 'textcontent',
        placeholder: 'Write your post...',
        required: true,
        rows: 6
    });
    contentTextarea.value = postData.content || '';
    const charCount = createElement('span', { class: 'char-count' }, [`${contentTextarea.value.length} chars`]);
    contentTextarea.addEventListener('input', () => {
        charCount.textContent = `${contentTextarea.value.length} chars`;
    });

    const imageInput = createElement('input', {
        type: 'file',
        id: 'images',
        name: 'images',
        multiple: true,
        accept: 'image/*'
    });

    const referenceInput = createElement('input', {
        type: 'text',
        id: 'reference-id',
        name: 'reference-id',
        placeholder: 'Enter related entity ID (Product / Place / Event)',
        style: 'display: none;'
    });
    const referenceGroup = createInputGroup('Reference ID (in case of place, event or product)', referenceInput);

    function updateReferenceVisibility(main, sub) {
        const shouldShow = main === 'Review' && ['Product', 'Place', 'Event'].includes(sub);
        referenceInput.style.display = shouldShow ? '' : 'none';
        referenceInput.required = shouldShow;
    }

    mainCategorySelect.addEventListener('change', e => {
        const newMain = e.target.value;
        populateSubCategories(subCategorySelect, newMain);
        updateReferenceVisibility(newMain, '');
    });

    subCategorySelect.addEventListener('change', () => {
        updateReferenceVisibility(mainCategorySelect.value, subCategorySelect.value);
    });

    const submitBtn = createElement('button', {
        type: 'submit',
        class: 'btn btn-primary'
    }, [postData._id ? 'Update Post' : 'Create Post']);

    const cancelBtn = createElement('button', {
        type: 'button',
        class: 'btn btn-secondary',
        style: 'margin-left: 10px;'
    }, ['Cancel']);
    cancelBtn.addEventListener('click', () => navigate('/posts'));

    form.append(
        createInputGroup('Main Category', mainCategorySelect),
        createInputGroup('Sub Category', subCategorySelect),
        referenceGroup,
        createInputGroup('Title', titleInput),
        createInputGroup('Content', contentTextarea, charCount),
        createInputGroup('Images', imageInput),
        submitBtn,
        cancelBtn
    );

    form.addEventListener('submit', async e => {
        e.preventDefault();
        submitBtn.disabled = true;
        await onSubmit(form, !!postData._id, postData._id);
        submitBtn.disabled = false;
    });

    return form;
}

async function handlePostSubmit(form, isEdit = false, existingId = null) {
    const formData = new FormData(form);
    const title       = formData.get("title")?.trim();
    const content     = formData.get("textcontent")?.trim();
    const category    = formData.get("category-main");
    const subcategory = formData.get("category-sub");
    const referenceId = formData.get("reference-id")?.trim();
    const files       = form.querySelector('#images')?.files;

    if (!title || !content || !category || !subcategory) {
        Snackbar("Please fill in all required fields.", 3000);
        return;
    }

    if (category === "Review" && ["Product", "Place", "Event"].includes(subcategory)) {
        if (!referenceId) {
            Snackbar("Reference ID is required for this review type.", 3000);
            return;
        }
    }

    const cleaned = new FormData();
    cleaned.append("title", title);
    cleaned.append("content", content);
    cleaned.append("category", category);
    cleaned.append("subcategory", subcategory);

    if (referenceId) {
        cleaned.append("referenceId", referenceId);
    }

    if (files && files.length) {
        Array.from(files).forEach((file, index) => {
            const error = validateImage(file);
            if (error) {
                Snackbar(error, 3000);
                return;
            }
            cleaned.append(`images_${index + 1}`, file); // unique field names
        });
        
    }

    try {
        Snackbar(isEdit ? "Updating post..." : "Creating post...", 2000);
        const endpoint = isEdit
            ? `/posts/post/${existingId}`
            : '/posts/post';
        const method = isEdit ? 'PUT' : 'POST';
        const result = await apiFetch(endpoint, method, cleaned);
        Snackbar(isEdit ? "Post updated!" : "Post created!", 3000);
        navigate(`/post/${isEdit ? existingId : result.postid}`);
    } catch (err) {
        Snackbar(`Error: ${err.message || err}`, 3000);
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

// import { createElement } from "../../components/createElement.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';
// import { navigate } from "../../routes/index.js";
// import { apiFetch } from "../../api/api.js";

// const categoryMap = {
//     News: ["Politics", "Sports", "Economy", "Technology", "World"],
//     Blog: ["Travel", "Food", "Lifestyle", "Personal", "Health"],
//     Review: ["Book", "Movie", "Product", "Place", "Event"],
//     Tutorial: ["Coding", "Cooking", "DIY", "Design"],
//     Opinion: ["Editorial", "Analysis", "Satire"],
//     Interview: ["Expert", "Celebrity", "Case Study"]
// };

// // Utility function to build a select element
// function createSelect(id, name, options, selectedValue = '') {
//     const select = createElement('select', { id, name, required: true });
//     select.appendChild(createElement('option', { value: '' }, [`Select ${name}`]));
//     options.forEach(opt =>
//         select.appendChild(
//             createElement('option', {
//                 value: opt,
//                 selected: opt === selectedValue
//             }, [opt])
//         )
//     );
//     return select;
// }

// function createInputGroup(labelText, inputElement, extraNode = null) {
//     const wrapper = createElement('div', { class: 'form-group' });
//     const label = createElement('label', { for: inputElement.id }, [labelText]);
//     wrapper.appendChild(label);
//     wrapper.appendChild(inputElement);
//     if (extraNode) wrapper.appendChild(extraNode);
//     return wrapper;
// }

// function populateSubCategories(selectEl, mainCategory, selected = '') {
//     selectEl.innerHTML = '';
//     selectEl.appendChild(createElement('option', { value: '' }, ['Select sub category']));
//     const subs = categoryMap[mainCategory];
//     if (!subs) {
//         Snackbar("No subcategories found for selected category.", 3000);
//         return;
//     }
//     subs.forEach(sub =>
//         selectEl.appendChild(
//             createElement('option', {
//                 value: sub,
//                 selected: sub === selected
//             }, [sub])
//         )
//     );
// }

// function renderPostForm(postData = {}, onSubmit) {
//     const form = createElement('form');

//     const mainCategorySelect = createSelect(
//         'category-main',
//         'category-main',
//         Object.keys(categoryMap),
//         postData.category
//     );

//     const subCategorySelect = createSelect(
//         'category-sub',
//         'category-sub',
//         categoryMap[postData.category] || [],
//         postData.subcategory
//     );

//     const titleInput = createElement('input', {
//         type: 'text',
//         id: 'title',
//         name: 'title',
//         placeholder: 'Post title',
//         required: true,
//         value: postData.title || ''
//     });

//     const contentTextarea = createElement('textarea', {
//         id: 'textcontent',
//         name: 'textcontent',
//         placeholder: 'Write your post...',
//         required: true,
//         rows: 6
//     });
//     contentTextarea.value = postData.content || '';
//     const charCount = createElement('span', { class: 'char-count' }, [`${contentTextarea.value.length} chars`]);
//     contentTextarea.addEventListener('input', () => {
//         charCount.textContent = `${contentTextarea.value.length} chars`;
//     });

//     const imageInput = createElement('input', {
//         type: 'file',
//         id: 'images',
//         name: 'images',
//         multiple: true,
//         accept: 'image/*'
//     });

//     mainCategorySelect.addEventListener('change', e => {
//         populateSubCategories(subCategorySelect, e.target.value);
//     });

//     const submitBtn = createElement('button', {
//         type: 'submit',
//         class: 'btn btn-primary'
//     }, [postData._id ? 'Update Post' : 'Create Post']);

//     const cancelBtn = createElement('button', {
//         type: 'button',
//         class: 'btn btn-secondary',
//         style: 'margin-left: 10px;'
//     }, ['Cancel']);
//     cancelBtn.addEventListener('click', () => navigate('/posts'));

//     form.append(
//         createInputGroup('Main Category', mainCategorySelect),
//         createInputGroup('Sub Category', subCategorySelect),
//         createInputGroup('Title', titleInput),
//         createInputGroup('Content', contentTextarea, charCount),
//         createInputGroup('Images', imageInput),
//         submitBtn,
//         cancelBtn
//     );

//     form.addEventListener('submit', async e => {
//         e.preventDefault();
//         submitBtn.disabled = true;
//         await onSubmit(form, !!postData._id, postData._id);
//         submitBtn.disabled = false;
//     });

//     return form;
// }

// async function handlePostSubmit(form, isEdit = false, existingId = null) {
//     const formData = new FormData(form);
//     const title       = formData.get("title")?.trim();
//     const content     = formData.get("textcontent")?.trim();
//     const category    = formData.get("category-main");
//     const subcategory = formData.get("category-sub");
//     const files       = form.querySelector('#images')?.files;

//     if (!title || !content || !category || !subcategory) {
//         Snackbar("Please fill in all required fields.", 3000);
//         return;
//     }

//     const cleaned = new FormData();
//     cleaned.append("title", title);
//     cleaned.append("content", content);
//     cleaned.append("category", category);
//     cleaned.append("subcategory", subcategory);

//     if (files && files.length) {
//         for (let file of files) {
//             const error = validateImage(file);
//             if (error) {
//                 Snackbar(error, 3000);
//                 return;
//             }
//             cleaned.append("images", file);
//         }
//     }

//     try {
//         Snackbar(isEdit ? "Updating post..." : "Creating post...", 2000);
//         const endpoint = isEdit
//             ? `/posts/post/${existingId}`
//             : '/posts/post';
//         const method = isEdit ? 'PUT' : 'POST';
//         const result = await apiFetch(endpoint, method, cleaned);
//         Snackbar(isEdit ? "Post updated!" : "Post created!", 3000);
//         navigate(`/post/${isEdit ? existingId : result.postid}`);
//     } catch (err) {
//         Snackbar(`Error: ${err.message || err}`, 3000);
//     }
// }

// function validateImage(file) {
//     const maxSize = 5 * 1024 * 1024;
//     const validTypes = ["image/jpeg", "image/png", "image/webp"];
//     if (!validTypes.includes(file.type)) return "Only JPG, PNG or WebP images allowed.";
//     if (file.size > maxSize) return "Image too large (max 5 MB).";
//     return null;
// }

// export { renderPostForm, handlePostSubmit };
