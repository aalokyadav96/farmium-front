import { createElement } from "../../components/createElement.js";

export function ImageGallery(images = []) {
    return createElement("div", {
        class: "image-gallery",
        style: {
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "1rem"
        }
    }, images.map(src =>
        createElement("img", {
            src,
            style: {
                width: "120px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #ccc"
            }
        })
    ));
}
