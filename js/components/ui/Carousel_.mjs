import Imagex from "../base/Imagex";

const Carousel = (imagesArray) => {
    let currentIndex = 0;
    let startX = 0;
    let endX = 0;

    const carouselContainer = document.createElement('div');
    carouselContainer.setAttribute("class", "carousel");

    const style = document.createElement("style");
    style.textContent = `
        .carousel {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin: auto;
            overflow: hidden;
        }
        .carousel-image-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            max-height: 50vh;
        }
        .carousel-image {
            width: 100%;
            height: auto;
            display: block;
            user-select: none;
            pointer-events: none;
        }
        .carousel-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            border: none;
            font-size: 2rem;
            padding: 0.5rem 0.8rem;
            cursor: pointer;
            z-index: 10;
        }
        .carousel-btn.prev { left: 10px; }
        .carousel-btn.next { right: 10px; }
        .carousel-btn:hover {
            background: rgba(0, 0, 0, 0.7);
        }
    `;
    carouselContainer.appendChild(style);

    const imageWrapper = document.createElement('div');
    imageWrapper.setAttribute("class", "carousel-image-wrapper");

    const img = Imagex({
        src : imagesArray[0].src,
        alt : imagesArray[0].alt || 'Carousel Image',
        class : 'carousel-image',
    });

    imageWrapper.appendChild(img);
    carouselContainer.appendChild(imageWrapper);

    function updateImage(index) {
        currentIndex = (index + imagesArray.length) % imagesArray.length;
        img.setAttribute("src", imagesArray[currentIndex].src);
        img.setAttribute("alt", imagesArray[currentIndex].alt || 'Carousel Image');
    }

    if (imagesArray.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.setAttribute("class", "carousel-btn prev");
        prevBtn.appendChild(document.createTextNode("‹"));

        const nextBtn = document.createElement('button');
        nextBtn.setAttribute("class", "carousel-btn next");
        nextBtn.appendChild(document.createTextNode("›"));

        prevBtn.addEventListener('click', () => updateImage(currentIndex - 1));
        nextBtn.addEventListener('click', () => updateImage(currentIndex + 1));

        carouselContainer.appendChild(prevBtn);
        carouselContainer.appendChild(nextBtn);

        // swipe support
        imageWrapper.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
        });

        imageWrapper.addEventListener("touchend", (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            if (Math.abs(diff) > 50) { 
                if (diff > 0) {
                    updateImage(currentIndex - 1); // swipe right -> prev
                } else {
                    updateImage(currentIndex + 1); // swipe left -> next
                }
            }
        });
    }

    return carouselContainer;
};

export default Carousel;

// import "../../../css/ui/Carousel.css";
// import Imagex from "../base/Imagex";

// const Carousel = (imagesArray) => {
//     let currentIndex = 0;

//     const carouselContainer = document.createElement('div');
//     carouselContainer.setAttribute("class", "carousel");

//     const imageWrapper = document.createElement('div');
//     imageWrapper.setAttribute("class", "carousel-image-wrapper");
   
//     const img = Imagex({
//         src : imagesArray[0].src,
//         alt : imagesArray[0].alt || 'Carousel Image',
//         class : 'carousel-image',
//     });

//     imageWrapper.appendChild(img);
//     carouselContainer.appendChild(imageWrapper);

//     function updateImage(index) {
//         currentIndex = (index + imagesArray.length) % imagesArray.length;
//         img.setAttribute("src", imagesArray[currentIndex].src);
//         img.setAttribute("alt", imagesArray[currentIndex].alt || 'Carousel Image');
//     }

//     if (imagesArray.length > 1) {
//         const prevBtn = document.createElement('button');
//         prevBtn.setAttribute("class", "carousel-btn prev");
//         prevBtn.appendChild(document.createTextNode("‹"));

//         const nextBtn = document.createElement('button');
//         nextBtn.setAttribute("class", "carousel-btn next");
//         nextBtn.appendChild(document.createTextNode("›"));

//         prevBtn.addEventListener('click', () => updateImage(currentIndex - 1));
//         nextBtn.addEventListener('click', () => updateImage(currentIndex + 1));

//         carouselContainer.appendChild(prevBtn);
//         carouselContainer.appendChild(nextBtn);
//     }

//     return carouselContainer;
// };

// export default Carousel;
