import { apiFetch, bannerFetch } from "../../api/api";
import { createElement } from "../../components/createElement";
import { createFormGroup } from "../../components/createFormGroup.js";
import Button from "../../components/base/Button.js";
import { capitalize } from "../profile/profileHelpers.js";

import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { navigate } from "../../routes/index.js";

async function renderPostEditor({ isLoggedIn, postId, contentContainer, mode }) {
  if (!isLoggedIn) {
    contentContainer.replaceChildren(
      createElement("div", {}, ["You must be logged in to " + mode + " a post."])
    );
    return;
  }

  let existingPost = null;
  if (mode === "edit" && postId) {
    try {
      const data = await apiFetch(`/posts/post/${postId}`);
      existingPost = data.post;
    } catch {
      contentContainer.replaceChildren(
        createElement("div", {}, ["Failed to load post."])
      );
      return;
    }
  }

  // --- Form groups ---
  const titleGroup = createFormGroup({
    type: "text",
    id: "title",
    name: "title",
    label: "Title",
    value: existingPost ? existingPost.title : "",
    placeholder: "Enter post title",
    required: true
  });

  const categoryGroup = createFormGroup({
    type: "select",
    id: "category",
    name: "category",
    label: "Category",
    value: existingPost ? existingPost.category : "",
    placeholder: "Choose category",
    options: ["General", "Review", "Announcement", "Story"],
    required: true
  });

  const subcategoryGroup = createFormGroup({
    type: "select",
    id: "subcategory",
    name: "subcategory",
    label: "Subcategory",
    value: existingPost ? existingPost.subcategory : "",
    placeholder: "Choose subcategory",
    options: ["General", "Product", "Place", "Event"],
    required: true
  });

  const referenceIdGroup = createFormGroup({
    type: "text",
    id: "referenceId",
    name: "referenceId",
    label: "Reference ID",
    value: existingPost ? (existingPost.referenceId || "") : "",
    placeholder: "Enter reference ID"
  });
  referenceIdGroup.style.display = "none";

  function toggleReferenceId() {
    const categoryVal = categoryGroup.querySelector("select").value;
    const subVal = subcategoryGroup.querySelector("select").value;
    const needsReference =
      categoryVal === "Review" && ["Product", "Place", "Event"].includes(subVal);
    referenceIdGroup.style.display = needsReference ? "block" : "none";
  }
  categoryGroup.querySelector("select").addEventListener("change", toggleReferenceId);
  subcategoryGroup.querySelector("select").addEventListener("change", toggleReferenceId);

  // --- Blocks handling ---
  let blocks = existingPost ? existingPost.blocks : [];

  const blocksContainer = createElement("div", { class: "blocks-container" });
  const blocksTextarea = createFormGroup({
    type: "textarea",
    id: "blocks",
    name: "blocks",
    label: "Blocks (JSON)",
    value: JSON.stringify(blocks, null, 2),
    placeholder: "Blocks JSON",
    required: true
  });
  blocksTextarea.style.display = "none";

  function syncBlocks() {
    blocksTextarea.querySelector("textarea").value = JSON.stringify(blocks, null, 2);
  }

  function renderBlocks() {
    blocksContainer.replaceChildren();

    blocks.forEach((block, i) => {
      let blockNode;

      if (block.type === "text") {
        const input = createElement("textarea", { rows: 3 }, [block.content || ""]);
        input.addEventListener("input", () => {
          blocks[i].content = input.value;
          syncBlocks();
        });
        blockNode = createElement("div", { class: "block block-text", draggable: "true", "data-index": i }, [
          createElement("span", { class: "block-label" }, ["Text Block"]),
          input
        ]);
      } else if (block.type === "image") {
        const fileInput = createElement("input", { type: "file", accept: "image/*" });
        const preview = createElement("img", { class: "image-preview" });

        if (block.url) {
          const realSrc = resolveImagePath(EntityType.POST, PictureType.PHOTO, block.url);
          preview.setAttribute("src", realSrc);
        }

        fileInput.addEventListener("change", async () => {
          if (!fileInput.files.length) return;
          const formData = new FormData();
          formData.append("image", fileInput.files[0]);
          try {
            // upload immediately to backend, get URL
            const res = await bannerFetch("/posts/upload", "POST", formData, { isForm: true });
            block.url = res.url;
            preview.setAttribute("src", resolveImagePath(EntityType.POST, PictureType.PHOTO, block.url));
            syncBlocks();
          } catch (err) {
            console.error("Upload failed", err);
          }
        });

        blockNode = createElement("div", { class: "block block-image", draggable: "true", "data-index": i }, [
          createElement("span", { class: "block-label" }, ["Image Block"]),
          fileInput,
          preview
        ]);
      }

      const removeBtn = Button("Remove", `remove-block-${i}`, {
        click: () => {
          blocks.splice(i, 1);
          renderBlocks();
          syncBlocks();
        }
      },"buttonx");
      blockNode.appendChild(removeBtn);

      // drag & drop
      blockNode.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", i);
      });
      blockNode.addEventListener("dragover", (e) => {
        e.preventDefault();
        blockNode.classList.add("drag-over");
      });
      blockNode.addEventListener("dragleave", () => {
        blockNode.classList.remove("drag-over");
      });
      blockNode.addEventListener("drop", (e) => {
        e.preventDefault();
        blockNode.classList.remove("drag-over");
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const toIndex = i;
        if (fromIndex !== toIndex) {
          const [moved] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, moved);
          renderBlocks();
          syncBlocks();
        }
      });

      blocksContainer.appendChild(blockNode);
    });
  }

  const addTextBtn = Button("Add Text Block", "add-text", {
    click: () => {
      blocks.push({ type: "text", content: "" });
      renderBlocks();
      syncBlocks();
    }
  },"buttonx");

  const addImageBtn = Button("Add Image Block", "add-image", {
    click: () => {
      blocks.push({ type: "image", url: "" });
      renderBlocks();
      syncBlocks();
    }
  },"buttonx");

  renderBlocks();
  syncBlocks();

  const messageBox = createElement("div", { id: "message-box" });

  async function handleSubmit() {
    const formData = new FormData();
    formData.append("title", titleGroup.querySelector("input").value);
    formData.append("category", categoryGroup.querySelector("select").value);
    formData.append("subcategory", subcategoryGroup.querySelector("select").value);
  
    const needsReference =
      categoryGroup.querySelector("select").value === "Review" &&
      ["Product", "Place", "Event"].includes(subcategoryGroup.querySelector("select").value);
    if (needsReference) {
      const refVal = referenceIdGroup.querySelector("input").value;
      if (refVal.trim()) {
        formData.append("referenceId", refVal.trim());
      }
    }
  
    // 🧱 Filter out empty blocks before sending
    const filteredBlocks = blocks.filter(b => {
      if (b.type === "text") return b.content && b.content.trim() !== "";
      if (b.type === "image") return b.url && b.url.trim() !== "";
      return false;
    });
  
    formData.append("blocks", JSON.stringify(filteredBlocks, null, 2));
  
    const endpoint = mode === "create" ? "/posts/post" : `/posts/post/${postId}`;
    const method = mode === "create" ? "POST" : "PATCH";
  
    try {
      const res = await apiFetch(endpoint, method, formData, { isForm: true });
      messageBox.replaceChildren(
        createElement("span", {}, [
          mode === "create"
            ? "Post created with ID " + res.postid
            : "Post updated successfully"
        ])
      );
      navigate(`/post/${res.postid}`);
    } catch (err) {
      messageBox.replaceChildren(
        createElement("span", {}, ["Error: " + (err.message || "Unknown error")])
      );
    }
  }
  

  // async function handleSubmit() {
  //   const formData = new FormData();
  //   formData.append("title", titleGroup.querySelector("input").value);
  //   formData.append("category", categoryGroup.querySelector("select").value);
  //   formData.append("subcategory", subcategoryGroup.querySelector("select").value);

  //   const needsReference =
  //     categoryGroup.querySelector("select").value === "Review" &&
  //     ["Product", "Place", "Event"].includes(subcategoryGroup.querySelector("select").value);
  //   if (needsReference) {
  //     const refVal = referenceIdGroup.querySelector("input").value;
  //     if (refVal.trim()) {
  //       formData.append("referenceId", refVal.trim());
  //     }
  //   }

  //   formData.append("blocks", blocksTextarea.querySelector("textarea").value);

  //   const endpoint = mode === "create" ? "/posts/post" : `/posts/post/${postId}`;
  //   const method = mode === "create" ? "POST" : "PATCH";
  //   alert(method);
  //   try {
  //     const res = await apiFetch(endpoint, method, formData, { isForm: true });
  //     messageBox.replaceChildren(
  //       createElement("span", {}, [
  //         mode === "create"
  //           ? "Post created with ID " + res.postid
  //           : "Post updated successfully"
  //       ])
  //     );
  //     navigate(`/post/${res.postid}`);
  //   } catch (err) {
  //     messageBox.replaceChildren(
  //       createElement("span", {}, ["Error: " + (err.message || "Unknown error")])
  //     );
  //   }
  // }

  const submitBtn = Button(
    mode === "create" ? "Create Post" : "Update Post",
    "submit-post",
    { click: handleSubmit },"buttonx"
  );

  const editorForm = createElement("div", { class: "post-editor" }, [
    titleGroup,
    categoryGroup,
    subcategoryGroup,
    referenceIdGroup,
    blocksContainer,
    addTextBtn,
    addImageBtn,
    blocksTextarea,
    submitBtn,
    messageBox
  ]);

  let hdng = createElement("h2", {}, [`${capitalize(mode)} Post`]);
  let container = createElement("div", { class: "create-section" }, [hdng, editorForm]);
  contentContainer.replaceChildren(container);
}

// --- Public API ---
export async function createPost(isLoggedIn, contentContainer) {
  return renderPostEditor({ isLoggedIn, contentContainer, mode: "create" });
}

export async function editPost(isLoggedIn, postId, contentContainer) {
  return renderPostEditor({ isLoggedIn, postId, contentContainer, mode: "edit" });
}
