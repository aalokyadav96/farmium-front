import "../../../css/ui/GridxMasonary.css";

const layoutMasonry = (container, columnCount, gap = 10) => {
    const items = Array.from(container.children);
    const containerWidth = container.clientWidth;
    const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = Array(columnCount).fill(0);

    items.forEach(item => {
        item.style.width = `${columnWidth}px`;
        item.style.position = "absolute";

        const minCol = columnHeights.indexOf(Math.min(...columnHeights));
        const x = (columnWidth + gap) * minCol;
        const y = columnHeights[minCol];

        item.style.transform = `translate(${x}px, ${y}px)`;

        columnHeights[minCol] += item.offsetHeight + gap;
    });

    container.style.height = `${Math.max(...columnHeights)}px`;
};

const GridxGallery = (divArray, columnCount = 3, gap = 10) => {
    const galleryContainer = document.createElement("div");
    galleryContainer.className = "gallery-masonry";
    galleryContainer.style.position = "relative";

    divArray.forEach(div => {
        div.classList.add("gallery-item");
        galleryContainer.appendChild(div);
    });

    const doLayout = () => layoutMasonry(galleryContainer, columnCount, gap);

    // Layout after DOM attachment and on resize
    requestAnimationFrame(doLayout);
    window.addEventListener("resize", doLayout);

    return galleryContainer;
};

export default GridxGallery;
