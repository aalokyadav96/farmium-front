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

  // --- Add-to-cart handler ---
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

  // --- Image Gallery ---
  const gallerySection = createElement("div", { class: "gallery-section" });
  const images = (product.images || []).filter(Boolean);
  if (images.length) {
    const urls = images.map(name =>
      resolveImagePath(EntityType.PRODUCT, PictureType.PHOTO, name)
    );
    gallerySection.appendChild(ImageGallery(urls));
  }

  // --- Basic Info ---
  const title = createElement("h1", { class: "product-title" }, [product.name || "Unnamed"]);
  const priceTag = createElement("div", { class: "product-price" }, [
    `₹${product.price?.toFixed(2) || "0.00"} / ${product.unit || "unit"}`,
  ]);

  const description = product.description
    ? createElement("p", { class: "product-description" }, [product.description])
    : null;

  // --- Entity-specific sections ---
  const entitySection = renderEntitySpecific(product, productType);

  // --- Actions ---
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

  // --- Assemble layout ---
  const contentSection = createElement("div", { class: "product-info-section" }, [
    title,
    priceTag,
    description,
    entitySection,
    actions,
  ]);

  return createElement("div", { class: `product-page ${productType}-layout` }, [
    gallerySection,
    contentSection,
  ]);
}

/* ---------------------------
   Entity-Specific Renderers
---------------------------- */

function renderEntitySpecific(product, type) {
  switch (type) {
    case "product":
      return renderGenericProduct(product);
    case "tool":
      return renderTool(product);
    case "subscription":
      return renderSubscription(product);
    case "media":
      return renderMedia(product);
    case "fmcg":
      return renderFMCG(product);
    case "art":
      return renderArt(product);
    default:
      return createElement("div", { class: "entity-details" }, ["No additional details available."]);
  }
}

function renderGenericProduct(p) {
  return section("Details", [
    field("Size", p.size),
    field("Color", p.color),
    field("Weight", p.weight),
    field("Specs", objectToText(p.specs)),
  ]);
}

function renderTool(p) {
  return section("Tool Specifications", [
    field("Material", p.specs?.Material),
    field("Use", p.specs?.Use),
  ]);
}

function renderSubscription(p) {
  return section("Subscription Details", [
    field("Billing Cycle", p.billingCycle),
    field("Trial Period", p.trialPeriod),
    field("Scope", p.scope),
    field("Duration", p.duration),
  ]);
}

function renderMedia(p) {
  return section("Media Information", [
    field("Author", p.author),
    field("ISBN", p.isbn),
    field("Platform", p.platform),
    field("Version", p.version),
    field("License", p.license),
    field("Duration", p.duration),
  ]);
}

function renderFMCG(p) {
  return section("Product Composition", [
    field("Ingredients", p.ingredients),
    field("Expiry Date", p.expiryDate),
    field("Weight", p.weight),
  ]);
}

function renderArt(p) {
  const artCard = createElement("div", { class: "art-card" }, [
    field("Artist", p.artist),
    field("Medium", p.medium),
    field("Dimensions", p.dimensions),
  ]);
  return createElement("section", { class: "art-section" }, [artCard]);
}

/* ---------------------------
   Utility UI Builders
---------------------------- */

function section(title, children) {
  const validChildren = children.filter(Boolean);
  if (!validChildren.length) return null;
  return createElement("section", { class: "details-section" }, [
    createElement("h3", { class: "section-title" }, [title]),
    ...validChildren,
  ]);
}

function field(label, value) {
  if (!value) return null;
  return createElement("p", { class: "product-field" }, [`${label}: ${value}`]);
}

function objectToText(obj) {
  if (!obj) return null;
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}
