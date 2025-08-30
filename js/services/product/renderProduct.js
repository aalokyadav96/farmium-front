import { createElement } from "../../components/createElement";
import Button from "../../components/base/Button.js";
import { SRC_URL } from "../../api/api";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
export function renderProduct(product, isLoggedIn, productType, productId, container) {
  const physical = ["clothing", "grocery", "produce", "tool", "electronics", "appliance", "furniture"];
  const media = ["book", "software", "course"];
  const subscription = ["subscription", "service"];
  const creative = ["art", "collectible"];
  const vehicle = ["vehicle"];

  let quantity = 1;

  const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);

  const decrementBtn = Button("−", "", {
    click: () => {
      if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = String(quantity);
      }
    },
  });

  const incrementBtn = Button("+", "", {
    click: () => {
      quantity++;
      quantityDisplay.textContent = String(quantity);
    },
  });

  const quantityControl = createElement("div", { class: "quantity-control" }, [
    decrementBtn,
    quantityDisplay,
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

  const imageGallery = product.imageUrls?.length
    ? createElement("div", { class: "product-image-gallery" }, product.imageUrls.map((url) =>
        createElement("img", {
          // src: `${SRC_URL}/uploads/${url}`,
          src: resolveImagePath(EntityType.PRODUCT, PictureType.THUMB, `${url}`),
          alt: product.name || "Image",
          class: "product-image",
        })
      ))
    : createElement("div", { class: "no-image" }, ["No Image Available"]);

  const detailFields = [];

  detailFields.push(createElement("h2", {}, [product.name]));
  detailFields.push(createElement("p", {}, [product.description]));
  detailFields.push(createElement("p", {}, [`Price: ₹${product.price?.toFixed(2)} / ${product.unit || "unit"}`]));

  if (physical.includes(productType)) {
    if (product.size) detailFields.push(createElement("p", {}, [`Size: ${product.size}`]));
    if (product.color) detailFields.push(createElement("p", {}, [`Color: ${product.color}`]));
    if (product.ingredients) detailFields.push(createElement("p", {}, [`Ingredients: ${product.ingredients}`]));
    if (product.expiryDate) detailFields.push(createElement("p", {}, [`Expiry: ${product.expiryDate}`]));
    if (product.weight) detailFields.push(createElement("p", {}, [`Weight: ${product.weight}`]));
    if (product.specs) {
      Object.entries(product.specs).forEach(([key, value]) => {
        detailFields.push(createElement("p", {}, [`${key}: ${value}`]));
      });
    }
  } else if (media.includes(productType)) {
    if (productType === "book") {
      if (product.author) detailFields.push(createElement("p", {}, [`Author: ${product.author}`]));
      if (product.isbn) detailFields.push(createElement("p", {}, [`ISBN: ${product.isbn}`]));
    }
    if (productType === "software") {
      if (product.platform) detailFields.push(createElement("p", {}, [`Platform: ${product.platform}`]));
      if (product.version) detailFields.push(createElement("p", {}, [`Version: ${product.version}`]));
      if (product.license) detailFields.push(createElement("p", {}, [`License: ${product.license}`]));
    }
    if (productType === "course") {
      if (product.instructor) detailFields.push(createElement("p", {}, [`Instructor: ${product.instructor}`]));
      if (product.duration) detailFields.push(createElement("p", {}, [`Duration: ${product.duration}`]));
    }
  } else if (subscription.includes(productType)) {
    if (product.billingCycle) detailFields.push(createElement("p", {}, [`Billing: ${product.billingCycle}`]));
    if (product.trialPeriod) detailFields.push(createElement("p", {}, [`Trial: ${product.trialPeriod}`]));
    if (product.scope) detailFields.push(createElement("p", {}, [`Scope: ${product.scope}`]));
    if (product.duration) detailFields.push(createElement("p", {}, [`Duration: ${product.duration}`]));
  } else if (creative.includes(productType)) {
    if (product.artist) detailFields.push(createElement("p", {}, [`Artist: ${product.artist}`]));
    if (product.medium) detailFields.push(createElement("p", {}, [`Medium: ${product.medium}`]));
    if (product.dimensions) detailFields.push(createElement("p", {}, [`Dimensions: ${product.dimensions}`]));
  } else if (vehicle.includes(productType)) {
    if (product.engine) detailFields.push(createElement("p", {}, [`Engine: ${product.engine}`]));
    if (product.mileage) detailFields.push(createElement("p", {}, [`Mileage: ${product.mileage}`]));
    if (product.fuelType) detailFields.push(createElement("p", {}, [`Fuel: ${product.fuelType}`]));
  }

  detailFields.push(createElement("label", {}, ["Quantity:"]));
  detailFields.push(quantityControl);
  detailFields.push(
    Button("Add to Cart", `add-${productId}`, { click: handleAdd }, "buttonx")
  );

  if (isLoggedIn) {
    detailFields.push(
      Button("Edit", `edit-${productId}`, {
        click: () => renderItemForm(container, "edit", product, productType, () => {
          displayProduct(isLoggedIn, productType, productId, container);
        }),
      }, "buttonx")
    );
  }

  return createElement("div", { class: "product-page" }, [
    imageGallery,
    createElement("div", { class: "product-details" }, detailFields),
  ]);
}
