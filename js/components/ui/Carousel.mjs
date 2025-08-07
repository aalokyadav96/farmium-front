import "../../../css/ui/Carousel.css";

const Carousel = (imagesArray) => {
    let currentIndex = 0;

    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'carousel-image-wrapper';

    const img = document.createElement('img');
    img.src = imagesArray[0].src;
    img.alt = imagesArray[0].alt || 'Carousel Image';
    img.className = 'carousel-image';

    imageWrapper.appendChild(img);
    carouselContainer.appendChild(imageWrapper);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev';
    prevBtn.textContent = '‹';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next';
    nextBtn.textContent = '›';

    function updateImage(index) {
        currentIndex = (index + imagesArray.length) % imagesArray.length;
        img.src = imagesArray[currentIndex].src;
        img.alt = imagesArray[currentIndex].alt || 'Carousel Image';
    }

    prevBtn.addEventListener('click', () => updateImage(currentIndex - 1));
    nextBtn.addEventListener('click', () => updateImage(currentIndex + 1));

    carouselContainer.appendChild(prevBtn);
    carouselContainer.appendChild(nextBtn);

    return carouselContainer;
};

export default Carousel;
