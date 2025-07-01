import "../../../css/ui/GridxGallery.css";
import SightBox from "./SightBox.mjs";

const GridxGallery = (imagesArray) => {
    const galleryContainer = document.createElement("div");
    galleryContainer.className = "gallery-masonry";

    imagesArray.forEach((image) => {
        const figure = document.createElement("figure");
        figure.className = "gallery-item";

        const img = document.createElement("img");
        img.src = image.src;
        img.alt = image.alt || "Gallery Image";
        img.className = "gallery-image";

        // Lightbox effect when clicked
        img.addEventListener("click", () => {
            SightBox(image.src);
        });

        figure.appendChild(img);
        galleryContainer.appendChild(figure);
    });

    return galleryContainer;
};

export default GridxGallery;
