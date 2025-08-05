import { createElement } from "../../components/createElement";
import Button from "../../components/base/Button.js";
import { SRC_URL, apiFetch } from "../../api/api";

import { renderToolProduct } from "./typeRenderers/renderToolProduct.js";
import { renderBookProduct } from "./typeRenderers/renderBookProduct.js";
import { renderClothingProduct } from "./typeRenderers/renderClothingProduct.js";
import { renderElectronicProduct } from "./typeRenderers/renderElectronicProduct.js";
import { renderGroceryProduct } from "./typeRenderers/renderGroceryProduct.js";
import { renderGenericProduct } from "./typeRenderers/renderGenericProduct.js";

const productRenderers = {
  tool: renderToolProduct,
  book: renderBookProduct,
  clothing: renderClothingProduct,
  electronics: renderElectronicProduct,
  grocery: renderGroceryProduct,
  _default: renderGenericProduct,
};


export async function displayProduct(isLoggedIn, productType, productId, contentContainer) {
  contentContainer.innerHTML = "";

  const product = await apiFetch(`/products/${productType}/${productId}`);
  if (!product) {
    contentContainer.appendChild(
      createElement("p", { class: "error" }, ["Product not found."])
    );
    return;
  }

  const renderer = productRenderers[productType] || productRenderers._default;
  const productPage = renderer(product, isLoggedIn, productType, productId, contentContainer);
  contentContainer.appendChild(productPage);
}

// import { createElement } from "../../components/createElement";
// import Button from "../../components/base/Button.js";
// import { SRC_URL, apiFetch } from "../../api/api";


// export async function displayProduct(isLoggedIn, productType, productId, contentContainer) {
//   contentContainer.innerHTML = ""; // Clear previous content

//   const product = await apiFetch(`/products/${productType}/${productId}`);
//   if (!product) {
//     contentContainer.appendChild(
//       createElement("p", { class: "error" }, ["Product not found."])
//     );
//     return;
//   }

//   let quantity = 1;
//   const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);

//   const decrementBtn = Button("−", "", {
//     click: () => {
//       if (quantity > 1) {
//         quantity--;
//         quantityDisplay.textContent = String(quantity);
//       }
//     },
//   });

//   const incrementBtn = Button("+", "", {
//     click: () => {
//       quantity++;
//       quantityDisplay.textContent = String(quantity);
//     },
//   });

//   const quantityControl = createElement("div", { class: "quantity-control" }, [
//     decrementBtn,
//     quantityDisplay,
//     incrementBtn,
//   ]);

//   const handleAdd = () => {
//     addToCart({
//       category: productType,
//       item: product.name,
//       quantity,
//       price: product.price,
//       unit: product.unit || "unit",
//       isLoggedIn,
//     });
//   };

//   const imageGallery = product.imageUrls?.length
//     ? createElement(
//         "div",
//         { class: "product-image-gallery" },
//         product.imageUrls.map((url) =>
//           createElement("img", {
//             src: `${SRC_URL}/uploads/${url}`,
//             alt: product.name,
//             class: "product-image",
//           })
//         )
//       )
//     : createElement("div", { class: "no-image" }, ["No Image Available"]);

//   const productDetails = createElement("div", { class: "product-details" }, [
//     createElement("h2", {}, [product.name]),
//     createElement("p", {}, [product.description]),
//     createElement("p", {}, [`Price: ₹${product.price.toFixed(2)} / ${product.unit || "unit"}`]),
//     createElement("label", {}, ["Quantity:"]),
//     quantityControl,
//     Button("Add to Cart", `add-product-${productId}`, { click: handleAdd }, "buttonx"),
//     isLoggedIn
//       ? Button(
//           "Edit Product",
//           `edit-product-${productId}`,
//           {
//             click: () => {
//               renderItemForm(contentContainer, "edit", product, productType, () => {
//                 displayProduct(isLoggedIn, productType, productId, contentContainer);
//               });
//             },
//           },
//           "buttonx"
//         )
//       : null,
//   ]);

//   const productPage = createElement("div", { class: "product-page" }, [
//     imageGallery,
//     productDetails,
//   ]);

//   contentContainer.appendChild(productPage);
// }

// // export async function displayProduct(isLoggedIn, productType, productId, contentContainer) {
// //     // Handle rendering logic
// //     console.log(isLoggedIn, productType, productId, contentContainer);
// //   }
  