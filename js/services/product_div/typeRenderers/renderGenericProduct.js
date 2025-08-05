import { createElement } from "../../../components/createElement";
import Button from "../../../components/base/Button.js";
import { SRC_URL } from "../../../api/api.js";

export function renderGenericProduct(product, isLoggedIn, productType, productId, container) {
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
    ? createElement(
        "div",
        { class: "product-image-gallery" },
        product.imageUrls.map((url) =>
          createElement("img", {
            src: `${SRC_URL}/uploads/${url}`,
            alt: product.name || "Image",
            class: "product-image",
          })
        )
      )
    : createElement("div", { class: "no-image" }, ["No Image Available"]);

  const detailFields = Object.entries(product).map(([key, value]) =>
    createElement("div", { class: "product-field" }, [
      createElement("strong", {}, [key + ": "]),
      createElement("span", {}, [
        typeof value === "object"
          ? Array.isArray(value)
            ? value.join(", ")
            : JSON.stringify(value)
          : String(value),
      ]),
    ])
  );

  const details = [
    ...detailFields,
    createElement("label", {}, ["Quantity:"]),
    quantityControl,
    Button("Add to Cart", `add-${productId}`, { click: handleAdd }, "buttonx"),
    isLoggedIn
      ? Button("Edit", `edit-${productId}`, {
          click: () => {
            renderItemForm(container, "edit", product, productType, () => {
              displayProduct(isLoggedIn, productType, productId, container);
            });
          },
        }, "buttonx")
      : null,
  ];

  return createElement("div", { class: "product-page" }, [
    imageGallery,
    createElement("div", { class: "product-details" }, details),
  ]);
}
