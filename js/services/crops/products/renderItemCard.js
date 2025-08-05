import Button from "../../../components/base/Button";
import { createElement } from "../../../components/createElement";
import { navigate } from "../../../routes";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

export function renderItemCard(item, type, isLoggedIn, container, refresh) {
  let quantity = 1;

  const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);

  const decrementBtn = Button("−", "", {
    click: (e) => {
      e.stopPropagation();
      if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = String(quantity);
      }
    },
  });

  const incrementBtn = Button("+", "", {
    click: (e) => {
      e.stopPropagation();
      quantity++;
      quantityDisplay.textContent = String(quantity);
    },
  });

  const quantityControl = createElement("div", { class: "quantity-control" }, [
    decrementBtn,
    quantityDisplay,
    incrementBtn,
  ]);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart({
      category: type,
      item: item.name,
      quantity,
      price: item.price,
      unit: item.unit || "unit",
      isLoggedIn,
    });
  };

  const imageGallery = item.imageUrls?.length
  ? createElement(
      "div",
      { class: "image-gallery" },
      item.imageUrls.map((url) =>
        createElement("img", {
          src: resolveImagePath(EntityType.PLACE, PictureType.IMAGE, url),
          alt: item.name,
          class: "thumbnail"
        })
      )
    )
  : createElement("div", { class: "no-image" }, ["No Image"]);


  const card = createElement("div", { class: `${type}-card` }, [
    imageGallery,
    createElement("h3", {}, [item.name]),
    createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
    createElement("p", {}, [item.description]),
    createElement("label", {}, ["Quantity:"]),
    quantityControl,
    Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "buttonx"),
    Button(
      "Edit",
      `edit-${type}-${item.id}`,
      {
        click: (e) => {
          e.stopPropagation();
          renderItemForm(container, "edit", item, type, refresh);
        },
      },
      "buttonx"
    ),
  ]);

  card.addEventListener("click", () => {
    navigate(`/products/${type}/${item.id}`);
  });

  return card;
}

// import Button from "../../../components/base/Button";
// import { createElement } from "../../../components/createElement";

// export function renderItemCard(item, type, isLoggedIn, container, refresh) {
//     let quantity = 1;
  
//     const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);
  
//     const decrementBtn = Button("−", "", {
//       click: () => {
//         if (quantity > 1) {
//           quantity--;
//           quantityDisplay.textContent = String(quantity);
//         }
//       },
//     });
  
//     const incrementBtn = Button("+", "", {
//       click: () => {
//         quantity++;
//         quantityDisplay.textContent = String(quantity);
//       },
//     });
  
//     const quantityControl = createElement("div", { class: "quantity-control" }, [
//       decrementBtn,
//       quantityDisplay,
//       incrementBtn,
//     ]);
  
//     const handleAdd = () => {
//       addToCart({
//         category: type,
//         item: item.name,
//         quantity,
//         price: item.price,
//         unit: item.unit || "unit",
//         isLoggedIn,
//       });
//     };
  
//     const imageGallery = item.imageUrls?.length
//       ? createElement(
//           "div",
//           { class: "image-gallery" },
//           item.imageUrls.map((url) =>
//             createElement("img", {
//               src: `${SRC_URL}/uploads/${url}`,
//               alt: item.name,
//               class: "thumbnail",
//             })
//           )
//         )
//       : createElement("div", { class: "no-image" }, ["No Image"]);
  
//     return createElement("div", { class: `${type}-card` }, [
//       imageGallery,
//       createElement("h3", {}, [item.name]),
//       createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
//       createElement("p", {}, [item.description]),
//       createElement("label", {}, ["Quantity:"]),
//       quantityControl,
//       Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "buttonx"),
//       Button(
//         "Edit",
//         `edit-${type}-${item.id}`,
//         {
//           click: () => renderItemForm(container, "edit", item, type, refresh),
//         },
//         "buttonx"
//       ),
//     ]);
//   }