// js/services/recipes/createOrEditRecipe.js
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import {apiFetch} from "../../api/api.js";

export function createRecipe(container) {
  renderRecipeForm(container, "create", null);
}

export function editRecipe(container, recipe) {
  renderRecipeForm(container, "edit", recipe);
}
function renderRecipeForm(container, mode = "create", recipe = null) {
  container.innerHTML = "";

  const form = createElement("form", {
    class: "create-section",
    enctype: "multipart/form-data",
  });

  const userIdGroup = createFormGroup({
    label: "User ID",
    inputType: "text",
    inputId: "userId",
    inputValue: recipe?.userId || "",
    placeholder: "e.g. u123",
    isRequired: true,
  });

  const titleGroup = createFormGroup({
    label: "Recipe Title",
    inputType: "text",
    inputId: "title",
    inputValue: recipe?.title || "",
    placeholder: "Enter recipe title",
    isRequired: true,
  });

  const descriptionGroup = createFormGroup({
    label: "Description",
    inputType: "textarea",
    inputId: "description",
    inputValue: recipe?.description || "",
    placeholder: "Short summary of the dish",
    isRequired: true,
    additionalProps: { rows: 3 },
  });

  const ingredientsGroup = createFormGroup({
    label: "Ingredients",
    inputType: "textarea",
    inputId: "ingredients",
    inputValue: recipe?.ingredients
      ?.map((i) => `${i.quantity} ${i.unit} ${i.name}`)
      .join("\n") || "",
    placeholder: "List ingredients, one per line",
    isRequired: true,
    additionalProps: { rows: 5 },
  });

  const stepsGroup = createFormGroup({
    label: "Steps",
    inputType: "textarea",
    inputId: "steps",
    inputValue: recipe?.steps?.join("\n") || "",
    placeholder: "Each step on a new line",
    isRequired: true,
    additionalProps: { rows: 6 },
  });

  const prepTimeGroup = createFormGroup({
    label: "Prep Time",
    inputType: "text",
    inputId: "prepTime",
    inputValue: recipe?.prepTime || "",
    placeholder: "e.g. 25 mins",
  });

  const tagsGroup = createFormGroup({
    label: "Tags (comma-separated)",
    inputType: "text",
    inputId: "tags",
    inputValue: recipe?.tags?.join(", ") || "",
    placeholder: "e.g. spicy, vegan, south indian",
  });

  const servingsGroup = createFormGroup({
    label: "Servings",
    inputType: "number",
    inputId: "servings",
    inputValue: recipe?.servings || "",
    placeholder: "e.g. 4",
    additionalProps: { min: 1 },
  });

  const difficultyGroup = createFormGroup({
    label: "Difficulty",
    inputType: "select",
    inputId: "difficulty",
    inputValue: recipe?.difficulty || "",
    options: [
      { value: "", label: "Select difficulty" },
      { value: "Easy", label: "Easy" },
      { value: "Medium", label: "Medium" },
      { value: "Hard", label: "Hard" },
    ],
  });

  const imageGroup = createFormGroup({
    label: "Upload Images",
    inputType: "file",
    inputId: "imageUrls",
    additionalProps: {
      accept: "image/*",
      multiple: true,
    },
  });

  const previewContainer = createElement("div", {
    style: "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;",
  });
  imageGroup.appendChild(previewContainer);

  imageGroup.querySelector("input").addEventListener("change", (e) => {
    previewContainer.innerHTML = "";
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const img = createElement("img", {
        src: URL.createObjectURL(file),
        style: "max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 6px;",
      });
      previewContainer.appendChild(img);
    });
  });

  const submitBtn = Button(
    mode === "edit" ? "Update Recipe" : "Create Recipe",
    "",
    { type: "submit" }
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const endpoint = mode === "edit"
      ? `/recipes/recipe/${recipe?._id || recipe?.id}`
      : "/recipes";

    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const response = await apiFetch(endpoint, method, formData );

      // if (!response.ok) {
      //   throw new Error("Server error");
      // }

      // const result = await response.json();
      const result = await response;
      console.log("Recipe saved:", result);

      if (mode === "create") {
        form.reset();
        previewContainer.innerHTML = "";
      }

      alert("Recipe saved successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to save recipe.");
    }
  });

  form.append(
    userIdGroup,
    titleGroup,
    descriptionGroup,
    prepTimeGroup,
    tagsGroup,
    servingsGroup,
    difficultyGroup,
    ingredientsGroup,
    stepsGroup,
    imageGroup,
    submitBtn
  );

  container.appendChild(form);
}

// function renderRecipeForm(container, mode = "create", recipe = null) {
//   container.innerHTML = "";

//   const form = createElement("form", {
//     className: "recipe-form",
//     enctype: "multipart/form-data",
//   });

//   const titleGroup = createFormGroup({
//     label: "Recipe Title",
//     inputType: "text",
//     inputId: "title",
//     inputValue: recipe?.title || "",
//     placeholder: "Enter recipe title",
//     isRequired: true,
//   });

//   const descriptionGroup = createFormGroup({
//     label: "Description",
//     inputType: "textarea",
//     inputId: "description",
//     inputValue: recipe?.description || "",
//     placeholder: "Short summary of the dish",
//     isRequired: true,
//     additionalProps: { rows: 3 },
//   });

//   const ingredientsGroup = createFormGroup({
//     label: "Ingredients",
//     inputType: "textarea",
//     inputId: "ingredients",
//     inputValue: recipe?.ingredients
//       ?.map((i) => `${i.quantity} ${i.unit} ${i.name}`)
//       .join("\n") || "",
//     placeholder: "List ingredients, one per line",
//     isRequired: true,
//     additionalProps: { rows: 5 },
//   });

//   const stepsGroup = createFormGroup({
//     label: "Steps",
//     inputType: "textarea",
//     inputId: "steps",
//     inputValue: recipe?.steps?.join("\n") || "",
//     placeholder: "Each step on a new line",
//     isRequired: true,
//     additionalProps: { rows: 6 },
//   });

//   const prepTimeGroup = createFormGroup({
//     label: "Prep Time",
//     inputType: "text",
//     inputId: "prepTime",
//     inputValue: recipe?.prepTime || "",
//     placeholder: "e.g. 25 mins",
//   });

//   const tagsGroup = createFormGroup({
//     label: "Tags (comma-separated)",
//     inputType: "text",
//     inputId: "tags",
//     inputValue: recipe?.tags?.join(", ") || "",
//     placeholder: "e.g. spicy, vegan, south indian",
//   });

//   const servingsGroup = createFormGroup({
//     label: "Servings",
//     inputType: "number",
//     inputId: "servings",
//     inputValue: recipe?.servings || "",
//     placeholder: "e.g. 4",
//     additionalProps: { min: 1 },
//   });

//   const difficultyGroup = createFormGroup({
//     label: "Difficulty",
//     inputType: "select",
//     inputId: "difficulty",
//     inputValue: recipe?.difficulty || "",
//     options: [
//       { value: "", label: "Select difficulty" },
//       { value: "Easy", label: "Easy" },
//       { value: "Medium", label: "Medium" },
//       { value: "Hard", label: "Hard" },
//     ],
//   });

//   const imageGroup = createFormGroup({
//     label: "Upload Images",
//     inputType: "file",
//     inputId: "imageUrls",
//     additionalProps: {
//       accept: "image/*",
//       multiple: true,
//     },
//   });

//   // Image preview container
//   const previewContainer = createElement("div", {
//     style: "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;",
//   });
//   imageGroup.appendChild(previewContainer);

//   // Show image previews
//   imageGroup.querySelector("input").addEventListener("change", (e) => {
//     previewContainer.innerHTML = "";
//     const files = Array.from(e.target.files);
//     files.forEach((file) => {
//       const img = createElement("img", {
//         src: URL.createObjectURL(file),
//         style: "max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 6px;",
//       });
//       previewContainer.appendChild(img);
//     });
//   });

//   const submitBtn = Button(
//     mode === "edit" ? "Update Recipe" : "Create Recipe",
//     "",
//     { type: "submit" }
//   );

//   form.addEventListener("submit", (e) => {
//     e.preventDefault();

//     const formData = new FormData(form);
//     const imageFiles = formData.getAll("imageUrls");

//     const recipeData = {
//       title: formData.get("title").trim(),
//       description: formData.get("description").trim(),
//       prepTime: formData.get("prepTime").trim(),
//       tags: formData.get("tags").split(",").map((t) => t.trim()),
//       servings: parseInt(formData.get("servings")) || 1,
//       difficulty: formData.get("difficulty"),
//       steps: formData.get("steps").split("\n").map((s) => s.trim()).filter(Boolean),
//       ingredients: formData
//         .get("ingredients")
//         .split("\n")
//         .map((line) => line.trim())
//         .filter(Boolean)
//         .map((line) => {
//           const match = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
//           return match
//             ? {
//                 quantity: parseFloat(match[1]),
//                 unit: match[2],
//                 name: match[3],
//               }
//             : { name: line };
//         }),
//       imageFiles,
//       createdAt: Date.now(),
//     };

//     console.log(`${mode === "edit" ? "Updating" : "Creating"} recipe:`, recipeData);

//     if (mode === "create") {
//       form.reset();
//       previewContainer.innerHTML = "";
//     }
//   });

//   form.append(
//     titleGroup,
//     descriptionGroup,
//     prepTimeGroup,
//     tagsGroup,
//     servingsGroup,
//     difficultyGroup,
//     ingredientsGroup,
//     stepsGroup,
//     imageGroup,
//     submitBtn
//   );

//   container.appendChild(form);
// }

// // // js/services/recipes/createOrEditRecipe.js
// // import { createElement } from "../../components/createElement.js";
// // import Button from "../../components/base/Button.js";
// // import { createFormGroup } from "../../components/createFormGroup.js";

// // export function createRecipe(container) {
// //   renderRecipeForm(container, "create", null);
// // }

// // export function editRecipe(container, recipe) {
// //   renderRecipeForm(container, "edit", recipe);
// // }

// // function renderRecipeForm(container, mode = "create", recipe = null) {
// //   container.innerHTML = "";

// //   const form = createElement("form", {
// //     className: "recipe-form",
// //     enctype: "multipart/form-data",
// //   });

// //   // TITLE
// //   const titleGroup = createFormGroup({
// //     label: "Recipe Title",
// //     inputType: "text",
// //     inputId: "title",
// //     inputValue: recipe?.title || "",
// //     placeholder: "Enter recipe title",
// //     isRequired: true,
// //   });

// //   // INGREDIENTS
// //   const ingredientsGroup = createFormGroup({
// //     label: "Ingredients",
// //     inputType: "textarea",
// //     inputId: "ingredients",
// //     inputValue: recipe?.ingredients || "",
// //     placeholder: "List ingredients, one per line",
// //     isRequired: true,
// //     additionalProps: { rows: 5 },
// //   });

// //   // INSTRUCTIONS
// //   const instructionsGroup = createFormGroup({
// //     label: "Instructions",
// //     inputType: "textarea",
// //     inputId: "instructions",
// //     inputValue: recipe?.instructions || "",
// //     placeholder: "Explain cooking steps",
// //     isRequired: true,
// //     additionalProps: { rows: 7 },
// //   });

// //   // COOKING TIME
// //   const timeGroup = createFormGroup({
// //     label: "Cooking Time (minutes)",
// //     inputType: "number",
// //     inputId: "cookingTime",
// //     inputValue: recipe?.cookingTime || "",
// //     placeholder: "e.g. 30",
// //     additionalProps: { min: 1 },
// //   });

// //   // DIFFICULTY SELECT
// //   const difficultyGroup = createFormGroup({
// //     label: "Difficulty",
// //     inputType: "select",
// //     inputId: "difficulty",
// //     inputValue: recipe?.difficulty || "",
// //     options: [
// //       { value: "", label: "Select difficulty" },
// //       { value: "Easy", label: "Easy" },
// //       { value: "Medium", label: "Medium" },
// //       { value: "Hard", label: "Hard" },
// //     ],
// //   });

// //   // SERVINGS
// //   const servingsGroup = createFormGroup({
// //     label: "Servings",
// //     inputType: "number",
// //     inputId: "servings",
// //     inputValue: recipe?.servings || "",
// //     placeholder: "e.g. 4",
// //     additionalProps: { min: 1 },
// //   });

// //   // IMAGE FILE
// //   const imageGroup = createFormGroup({
// //     label: "Upload Image",
// //     inputType: "file",
// //     inputId: "imageFile",
// //     additionalProps: {
// //       accept: "image/*",
// //     },
// //   });

// //   // IMAGE PREVIEW
// //   const imagePreview = createElement("img", {
// //     id: "imagePreview",
// //     src: recipe?.imageUrl || "",
// //     alt: "Image preview",
// //     style: "max-width: 200px; margin-top: 10px; display: block;",
// //   });

// //   imageGroup.appendChild(imagePreview);

// //   // Update preview on file select
// //   imageGroup.querySelector("input").addEventListener("change", (e) => {
// //     const file = e.target.files?.[0];
// //     if (file) {
// //       imagePreview.src = URL.createObjectURL(file);
// //     } else {
// //       imagePreview.src = "";
// //     }
// //   });

// //   // SUBMIT BUTTON
// //   const submitBtn = Button(
// //     mode === "edit" ? "Update Recipe" : "Create Recipe",
// //     "",
// //     { type: "submit" }
// //   );

// //   // HANDLE SUBMISSION
// //   form.addEventListener("submit", (e) => {
// //     e.preventDefault();

// //     const formData = new FormData(form);
// //     const data = {
// //       title: formData.get("title").trim(),
// //       ingredients: formData.get("ingredients").trim(),
// //       instructions: formData.get("instructions").trim(),
// //       cookingTime: formData.get("cookingTime"),
// //       difficulty: formData.get("difficulty"),
// //       servings: formData.get("servings"),
// //       imageFile: formData.get("imageFile"),
// //     };

// //     console.log(`${mode === "edit" ? "Updating" : "Creating"} recipe:`, data);

// //     if (mode === "create") form.reset();
// //     imagePreview.src = "";
// //   });

// //   form.append(
// //     titleGroup,
// //     ingredientsGroup,
// //     instructionsGroup,
// //     timeGroup,
// //     difficultyGroup,
// //     servingsGroup,
// //     imageGroup,
// //     submitBtn
// //   );

// //   container.appendChild(form);
// // }
