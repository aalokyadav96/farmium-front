import { renderProduct } from "./renderProduct.js";
import { createElement } from "../../components/createElement";
import { apiFetch } from "../../api/api";

export async function displayProduct(isLoggedIn, productType, productId, contentContainer) {
  contentContainer.replaceChildren();

  const product = await apiFetch(`/products/${productType}/${productId}`);
  if (!product) {
    contentContainer.appendChild(
      createElement("p", { class: "error" }, ["Product not found."])
    );
    return;
  }

  const productPage = renderProduct(product, isLoggedIn, productType, productId, contentContainer);
  contentContainer.appendChild(productPage);
}

// import { renderProduct } from "./renderProduct.js";
// import { createElement } from "../../components/createElement";
// import { apiFetch } from "../../api/api";

// export async function displayProduct(isLoggedIn, productType, productId, contentContainer) {
//   contentContainer.replaceChildren();

//   const product = await apiFetch(`/products/${productType}/${productId}`);
//   if (!product) {
//     contentContainer.appendChild(
//       createElement("p", { class: "error" }, ["Product not found."])
//     );
//     return;
//   }

//   const productPage = renderProduct(product, isLoggedIn, productType, productId, contentContainer);
//   contentContainer.appendChild(productPage);
// }
