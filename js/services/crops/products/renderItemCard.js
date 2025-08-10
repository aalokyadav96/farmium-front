import Button from "../../../components/base/Button";
import { createElement } from "../../../components/createElement";
import Carousel from "../../../components/ui/Carousel.mjs";
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
      [
        createElement("img", {
          src: resolveImagePath(EntityType.PRODUCT, PictureType.THUMB, item.imageUrls[0]),
          alt: item.name,
          class: "thumbnail"
        })]):"";


  // const imageGallery = item.imageUrls?.length
  // ? createElement(
  //     "div",
  //     { class: "image-gallery" },
  //     item.imageUrls.map((url) =>
  //       createElement("img", {
  //         src: resolveImagePath(EntityType.PRODUCT, PictureType.PHOTO, url),
  //         alt: item.name,
  //         class: "thumbnail"
  //       })
  //     )
  //   )
  // : createElement("div", { class: "no-image" }, ["No Image"]);

  // const imageGallery = createElement("div",{},[]);
  // if (item.imageUrls?.length) {
  //   const imgarray = item.imageUrls.map(path => ({
  //     src: resolveImagePath(EntityType.PRODUCT, PictureType.PHOTO, path),
  //     alt: item.title || "Post Image"
  //   }));
  //   imageGallery.appendChild(Carousel(imgarray));
  // }

  const card = createElement("div", { class: `${type}-card` }, [
    imageGallery,
    createElement("h3", {}, [item.name]),
    createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
    createElement("p", {}, [item.description]),
    createElement("label", {}, ["Quantity:"]),
    quantityControl,
    Button("Add to Cart", `add-to-cart-${item.productid}`, { click: handleAdd }, "buttonx"),
    Button(
      "Edit",
      `edit-${type}-${item.productid}`,
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
    navigate(`/products/${type}/${item.productid}`);
  });

  return card;
}
