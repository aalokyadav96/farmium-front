
import { createElement } from "../../components/createElement";
import Button from "../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { renderItemForm } from "../crops/products/createOrEdit.js";
import { displayProduct } from "./productPage.js";
import { ImageGallery } from "../../components/ui/IMageGallery.mjs";

export function renderProduct(product, isLoggedIn, productType, productId, container) {
  let quantity = 1;

  // --- Quantity control ---
  const quantityValue = createElement("span", { class: "quantity-value" }, [String(quantity)]);

  const decrementBtn = Button("−", "", {
    click: () => {
      if (quantity > 1) quantity--;
      quantityValue.textContent = String(quantity);
    },
  }, "quantity-btn");

  const incrementBtn = Button("+", "", {
    click: () => {
      quantity++;
      quantityValue.textContent = String(quantity);
    },
  }, "quantity-btn");

  const quantityControl = createElement("div", { class: "quantity-control" }, [
    decrementBtn,
    quantityValue,
    incrementBtn,
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

  // --- Image Gallery Section ---
  const gallerySection = createElement("div", { class: "gallery-section" });
  const images = (product.images || []).filter(Boolean);
  if (images.length) {
    const urls = images.map(name =>
      resolveImagePath(EntityType.PRODUCT, PictureType.PHOTO, name)
    );
    gallerySection.appendChild(ImageGallery(urls));
  }

  // --- Product Info Section ---
  const title = createElement("h1", { class: "product-title" }, [product.name || "Unnamed Product"]);
  const priceTag = createElement("div", { class: "product-price" }, [
    `₹${product.price?.toFixed(2) || "0.00"} / ${product.unit || "unit"}`,
  ]);

  const description = product.description
    ? createElement("p", { class: "product-description" }, [product.description])
    : null;

  const detailsList = createElement("div", { class: "product-details-list" });
  Object.entries(product).forEach(([key, value]) => {
    if (value == null || key === "images" || key === "description" || key === "price" || key === "unit" || key === "featured") return;
    const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, str => str.toUpperCase());
    detailsList.appendChild(createElement("p", { class: "product-field" }, [`${label}: ${value}`]));
  });

  // --- Action Buttons ---
  const actions = createElement("div", { class: "product-actions" }, [
    createElement("div", { class: "quantity-wrapper" }, [
      createElement("label", { for: `qty-${productId}` }, ["Quantity:"]),
      quantityControl,
    ]),
    Button("Add to Cart", `add-${productId}`, { click: handleAdd }, "buttonx"),
  ]);

  if (isLoggedIn) {
    actions.appendChild(Button("Edit", `edit-${productId}`, {
      click: () => renderItemForm(container, "edit", product, productType, () => {
        displayProduct(isLoggedIn, productType, productId, container);
      }),
    }, "buttonx"));
  }

  // --- Layout Assembly ---
  const contentSection = createElement("div", { class: "product-info-section" }, [
    title,
    priceTag,
    description,
    detailsList,
    actions,
  ]);

  return createElement("div", { class: "product-page" }, [
    gallerySection,
    contentSection,
  ]);
}

