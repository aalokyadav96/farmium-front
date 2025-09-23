import { createElement } from "../../components/createElement";
import Button from "../../components/base/Button.js";
import { SRC_URL } from "../../api/api";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { renderItemForm } from "../crops/products/createOrEdit.js";
import { displayProduct } from "./productPage.js";

export function renderProduct(product, isLoggedIn, productType, productId, container) {
  let quantity = 1;

  const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);
  const decrementBtn = Button("−", "", { click: () => {
    if (quantity > 1) quantity--;
    quantityDisplay.textContent = String(quantity);
  }});
  const incrementBtn = Button("+", "", { click: () => {
    quantity++;
    quantityDisplay.textContent = String(quantity);
  }});
  const quantityControl = createElement("div", { class: "quantity-control" }, [
    decrementBtn, quantityDisplay, incrementBtn
  ]);

  const handleAdd = () => {
    addToCart({
      category: productType,
      item: product.name,
      quantity,
      price: product.price,
      unit: product.unit || "unit",
      isLoggedIn,
    });
  };

  // Image gallery
  const imageGallery = product.imageUrls?.length
    ? createElement("div", { class: "product-image-gallery" }, 
        product.imageUrls.map(url => createElement("img", {
          src: resolveImagePath(EntityType.PRODUCT, PictureType.THUMB, url),
          alt: product.name || "Image",
          class: "product-image",
        }))
      )
    : createElement("div", { class: "no-image" }, ["No Image Available"]);

  // Product details container
  const detailFields = [];

  // Dynamically render all product fields except images
  Object.entries(product).forEach(([key, value]) => {
    if (value == null || key === "imageUrls") return;

    // Convert camelCase or snake_case to readable label
    const label = key.replace(/([A-Z])/g, ' $1')
                     .replace(/_/g, ' ')
                     .replace(/^./, str => str.toUpperCase());

    // Special handling for price
    if (key === "price") {
      detailFields.push(createElement("p", {}, [`Price: ₹${value?.toFixed(2)} / ${product.unit || "unit"}`]));
    } else if (key === "featured") {
      // Skip featured for now
    } else if (key === "quantity" || key === "unit") {
      // Skip, handled by quantity control
    } else {
      detailFields.push(createElement("p", {}, [`${label}: ${value}`]));
    }
  });

  // Quantity and Add to Cart
  detailFields.push(createElement("label", {}, ["Quantity:"]));
  detailFields.push(quantityControl);
  detailFields.push(Button("Add to Cart", `add-${productId}`, { click: handleAdd }, "buttonx"));

  // Edit button if logged in
  if (isLoggedIn) {
    detailFields.push(Button("Edit", `edit-${productId}`, {
      click: () => renderItemForm(container, "edit", product, productType, () => {
        displayProduct(isLoggedIn, productType, productId, container);
      }),
    }, "buttonx"));
  }

  return createElement("div", { class: "product-page" }, [
    imageGallery,
    createElement("div", { class: "product-details" }, detailFields),
  ]);
}
