import { createElement } from "../../../components/createElement";
import Button from "../../../components/base/Button.js";
import { SRC_URL } from "../../../api/api";
export function renderGroceryProduct(product, isLoggedIn, productType, productId, container) {
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
      unit: product.unit || "kg",
      isLoggedIn,
    });
  };

  const imageGallery = product.imageUrls?.length
    ? createElement("div", { class: "product-image-gallery" }, product.imageUrls.map((url) =>
        createElement("img", {
          src: `${SRC_URL}/uploads/${url}`,
          alt: product.name,
          class: "product-image",
        })
      ))
    : createElement("div", { class: "no-image" }, ["No Image Available"]);

  const expiryInfo = product.expiryDate ? `Expiry: ${product.expiryDate}` : "";

  const details = [
    createElement("h2", {}, [product.name]),
    createElement("p", {}, [product.description]),
    createElement("p", {}, [expiryInfo]),
    createElement("p", {}, [`Price: ₹${product.price.toFixed(2)} / ${product.unit || "kg"}`]),
    createElement("label", {}, ["Quantity:"]),
    quantityControl,
    Button("Add to Cart", `add-${productId}`, { click: handleAdd }, "buttonx"),
    isLoggedIn
      ? Button("Edit", `edit-${productId}`, {
          click: () => renderItemForm(container, "edit", product, productType, () => {
            displayProduct(isLoggedIn, productType, productId, container);
          }),
        }, "buttonx")
      : null,
  ];

  return createElement("div", { class: "product-page" }, [imageGallery, createElement("div", { class: "product-details" }, details)]);
}
