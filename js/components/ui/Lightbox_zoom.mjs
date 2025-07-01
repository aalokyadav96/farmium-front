
import "../../../css/ui/Lightbox.css";

const Lightbox = (images, initialIndex = 0) => {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox-overlay";

  const content = document.createElement("div");
  content.className = "lightbox-content";

  // Image Container (to prevent page zoom)
  const imgContainer = document.createElement("div");
  imgContainer.className = "lightbox-image-container";

  const img = document.createElement("img");
  img.src = images[initialIndex];
  img.alt = "Lightbox Image";
  imgContainer.appendChild(img);
  content.appendChild(imgContainer);

  let lastTap = 0;
  let isZoomed = false;
  let scale = 1, startX = 0, startY = 0, offsetX = 0, offsetY = 0, isDragging = false;
  let currentIndex = initialIndex;

  // Image Counter (e.g., "1 / 10")
  const counter = document.createElement("div");
  counter.className = "lightbox-counter";
  counter.textContent = `${currentIndex + 1} / ${images.length}`;
  content.appendChild(counter);

  // Double Tap to Zoom
  img.addEventListener("touchend", (e) => {
    const currentTime = new Date().getTime();
    if (currentTime - lastTap < 300) {
      isZoomed = !isZoomed;
      scale = isZoomed ? 2 : 1;
      img.style.transform = `scale(${scale})`;
      img.style.transition = "transform 0.3s ease";
      img.style.cursor = isZoomed ? "grab" : "default";
    }
    lastTap = currentTime;
  });

  // Pinch-to-Zoom
  let initialDistance = 0;
  img.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches[0], e.touches[1]);
    }
  });

  img.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      scale = Math.min(Math.max(1, currentDistance / initialDistance), 3);
      img.style.transform = `scale(${scale})`;
      isZoomed = scale > 1;
    }
  });

  // Drag Zoomed Image
  img.addEventListener("mousedown", (e) => {
    if (!isZoomed) return;
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    img.style.cursor = "grabbing";
  });

  img.addEventListener("mousemove", (e) => {
    if (!isDragging || !isZoomed) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    img.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
  });

  img.addEventListener("mouseup", () => {
    isDragging = false;
    img.style.cursor = "grab";
  });

  img.addEventListener("mouseleave", () => {
    isDragging = false;
    img.style.cursor = "grab";
  });

  // Swipe Navigation
  let touchStartX = 0;
  let touchEndX = 0;
  img.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1 && !isZoomed) {
      touchStartX = e.touches[0].clientX;
    }
  });

  img.addEventListener("touchend", (e) => {
    if (!isZoomed) {
      touchEndX = e.changedTouches[0].clientX;
      handleSwipe();
    }
  });

  const handleSwipe = () => {
    const swipeDistance = touchStartX - touchEndX;
    if (Math.abs(swipeDistance) > 50) {
      swipeDistance > 0 ? nextImage() : prevImage();
    }
  };

  // Reset Zoom
  const resetZoom = () => {
    scale = 1;
    img.style.transform = "scale(1)";
    img.style.left = "0px";
    img.style.top = "0px";
    img.style.cursor = "default";
    offsetX = 0;
    offsetY = 0;
    isZoomed = false;
  };

  const getDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const updateImage = (index) => {
    img.src = images[index];
    resetZoom();
    counter.textContent = `${index + 1} / ${images.length}`;
  };

  const prevImage = () => {
    currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    updateImage(currentIndex);
  };

  const nextImage = () => {
    currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    updateImage(currentIndex);
  };

  // Close Button
  const closeButton = document.createElement("button");
  closeButton.className = "lightbox-close-btn";
  closeButton.textContent = "X";
  closeButton.addEventListener("click", () => {
    lightbox.remove();
  });

  content.appendChild(closeButton);
  lightbox.appendChild(content);
  document.body.appendChild(lightbox);
};

export default Lightbox;


// import "../../../css/ui/Lightbox.css";

// const Lightbox = (images, initialIndex = 0) => {
//   const lightbox = document.createElement("div");
//   lightbox.className = "lightbox-overlay";

//   const content = document.createElement("div");
//   content.className = "lightbox-content";

//   const img = document.createElement("img");
//   img.src = images[initialIndex];
//   img.alt = "Lightbox Image";

//   content.appendChild(img);

//   let lastTap = 0;
//   let isZoomed = false;
//   let offsetX = 0, offsetY = 0, startX = 0, startY = 0, isDragging = false;
//   let initialDistance = 0;
//   let scale = 1;
//   let currentIndex = initialIndex;

//   // Double Tap to Zoom
//   img.addEventListener("touchend", (e) => {
//     const currentTime = new Date().getTime();
//     const tapLength = currentTime - lastTap;

//     if (tapLength < 300 && tapLength > 0) {
//       if (!isZoomed) {
//         scale = 2;
//         img.style.transform = `scale(${scale})`;
//         img.style.transition = "transform 0.3s ease";
//         img.style.cursor = "grab";
//         isZoomed = true;
//       } else {
//         resetZoom();
//       }
//     }
//     lastTap = currentTime;
//   });

//   // Pinch-to-Zoom
//   img.addEventListener("touchstart", (e) => {
//     if (e.touches.length === 2) {
//       initialDistance = getDistance(e.touches[0], e.touches[1]);
//     }
//   });

//   img.addEventListener("touchmove", (e) => {
//     if (e.touches.length === 2) {
//       const currentDistance = getDistance(e.touches[0], e.touches[1]);
//       let pinchScale = currentDistance / initialDistance;

//       scale = Math.min(Math.max(1, pinchScale), 3); // Limit scale between 1x and 3x
//       img.style.transform = `scale(${scale})`;
//       isZoomed = scale > 1;
//     }
//   });

//   // Drag Zoomed Image
//   img.addEventListener("mousedown", (e) => {
//     if (!isZoomed) return;
//     isDragging = true;
//     startX = e.clientX - offsetX;
//     startY = e.clientY - offsetY;
//     img.style.cursor = "grabbing";
//   });

//   img.addEventListener("mousemove", (e) => {
//     if (!isDragging || !isZoomed) return;
//     offsetX = e.clientX - startX;
//     offsetY = e.clientY - startY;
//     img.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
//   });

//   img.addEventListener("mouseup", () => {
//     isDragging = false;
//     img.style.cursor = "grab";
//   });

//   img.addEventListener("mouseleave", () => {
//     isDragging = false;
//     img.style.cursor = "grab";
//   });

//   // Swipe Navigation
//   let touchStartX = 0;
//   let touchEndX = 0;

//   img.addEventListener("touchstart", (e) => {
//     if (e.touches.length === 1 && !isZoomed) {
//       touchStartX = e.touches[0].clientX;
//     }
//   });

//   img.addEventListener("touchend", (e) => {
//     if (!isZoomed) {
//       touchEndX = e.changedTouches[0].clientX;
//       handleSwipe();
//     }
//   });

//   const handleSwipe = () => {
//     const swipeDistance = touchStartX - touchEndX;
//     if (Math.abs(swipeDistance) > 50) {
//       if (swipeDistance > 0) {
//         nextImage();
//       } else {
//         prevImage();
//       }
//     }
//   };

//   // Reset Zoom
//   const resetZoom = () => {
//     scale = 1;
//     img.style.transform = "scale(1)";
//     img.style.left = "0px";
//     img.style.top = "0px";
//     img.style.cursor = "default";
//     offsetX = 0;
//     offsetY = 0;
//     isZoomed = false;
//   };

//   const getDistance = (touch1, touch2) => {
//     const dx = touch2.clientX - touch1.clientX;
//     const dy = touch2.clientY - touch1.clientY;
//     return Math.sqrt(dx * dx + dy * dy);
//   };

//   const updateImage = (index) => {
//     img.src = images[index];
//     resetZoom();
//   };

//   const prevImage = () => {
//     currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
//     updateImage(currentIndex);
//   };

//   const nextImage = () => {
//     currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
//     updateImage(currentIndex);
//   };

//   // if (images.length > 1) {
//   //   const prevButton = document.createElement("button");
//   //   prevButton.className = "lightbox-prev-btn";
//   //   prevButton.textContent = "Prev";
//   //   prevButton.addEventListener("click", prevImage);

//   //   const nextButton = document.createElement("button");
//   //   nextButton.className = "lightbox-next-btn";
//   //   nextButton.textContent = "Next";
//   //   nextButton.addEventListener("click", nextImage);

//   //   content.appendChild(prevButton);
//   //   content.appendChild(nextButton);
//   // }

//   const closeButton = document.createElement("button");
//   closeButton.className = "lightbox-close-btn";
//   closeButton.textContent = "X";
//   closeButton.addEventListener("click", () => {
//     lightbox.remove();
//   });

//   content.appendChild(closeButton);
//   lightbox.appendChild(content);
//   document.body.appendChild(lightbox);
// };

// export default Lightbox;


// // import "../../../css/ui/Lightbox.css";

// // const Lightbox = (images, initialIndex = 0) => {
// //   const lightbox = document.createElement("div");
// //   lightbox.className = "lightbox-overlay";

// //   const content = document.createElement("div");
// //   content.className = "lightbox-content";

// //   const img = document.createElement("img");
// //   img.src = images[initialIndex];
// //   img.alt = "Lightbox Image";

// //   content.appendChild(img);

// //   let lastTap = 0;
// //   let isZoomed = false;
// //   let offsetX = 0, offsetY = 0, startX = 0, startY = 0, isDragging = false;
// //   let initialDistance = 0;
// //   let scale = 1;

// //   // Double Tap to Zoom
// //   img.addEventListener("touchend", (e) => {
// //     const currentTime = new Date().getTime();
// //     const tapLength = currentTime - lastTap;

// //     if (tapLength < 300 && tapLength > 0) {
// //       if (!isZoomed) {
// //         scale = 2;
// //         img.style.transform = `scale(${scale})`;
// //         img.style.transition = "transform 0.3s ease";
// //         img.style.cursor = "grab";
// //         isZoomed = true;
// //       } else {
// //         resetZoom();
// //       }
// //     }
// //     lastTap = currentTime;
// //   });

// //   // Pinch-to-Zoom
// //   img.addEventListener("touchstart", (e) => {
// //     if (e.touches.length === 2) {
// //       initialDistance = getDistance(e.touches[0], e.touches[1]);
// //     }
// //   });

// //   img.addEventListener("touchmove", (e) => {
// //     if (e.touches.length === 2) {
// //       const currentDistance = getDistance(e.touches[0], e.touches[1]);
// //       let pinchScale = currentDistance / initialDistance;

// //       scale = Math.min(Math.max(1, pinchScale), 3); // Limit scale between 1x and 3x
// //       img.style.transform = `scale(${scale})`;
// //       isZoomed = scale > 1;
// //     }
// //   });

// //   // Drag Zoomed Image
// //   img.addEventListener("mousedown", (e) => {
// //     if (!isZoomed) return;
// //     isDragging = true;
// //     startX = e.clientX - offsetX;
// //     startY = e.clientY - offsetY;
// //     img.style.cursor = "grabbing";
// //   });

// //   img.addEventListener("mousemove", (e) => {
// //     if (!isDragging || !isZoomed) return;
// //     offsetX = e.clientX - startX;
// //     offsetY = e.clientY - startY;
// //     img.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
// //   });

// //   img.addEventListener("mouseup", () => {
// //     isDragging = false;
// //     img.style.cursor = "grab";
// //   });

// //   img.addEventListener("mouseleave", () => {
// //     isDragging = false;
// //     img.style.cursor = "grab";
// //   });

// //   // Reset Zoom
// //   const resetZoom = () => {
// //     scale = 1;
// //     img.style.transform = "scale(1)";
// //     img.style.left = "0px";
// //     img.style.top = "0px";
// //     img.style.cursor = "default";
// //     offsetX = 0;
// //     offsetY = 0;
// //     isZoomed = false;
// //   };

// //   const getDistance = (touch1, touch2) => {
// //     const dx = touch2.clientX - touch1.clientX;
// //     const dy = touch2.clientY - touch1.clientY;
// //     return Math.sqrt(dx * dx + dy * dy);
// //   };

// //   const updateImage = (index) => {
// //     img.src = images[index];
// //     resetZoom();
// //   };

// //   if (images.length > 1) {
// //     const prevButton = document.createElement("button");
// //     prevButton.className = "lightbox-prev-btn";
// //     prevButton.textContent = "Prev";

// //     const nextButton = document.createElement("button");
// //     nextButton.className = "lightbox-next-btn";
// //     nextButton.textContent = "Next";

// //     let currentIndex = initialIndex;

// //     prevButton.addEventListener("click", () => {
// //       currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
// //       updateImage(currentIndex);
// //     });

// //     nextButton.addEventListener("click", () => {
// //       currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
// //       updateImage(currentIndex);
// //     });

// //     content.appendChild(prevButton);
// //     content.appendChild(nextButton);
// //   }

// //   const closeButton = document.createElement("button");
// //   closeButton.className = "lightbox-close-btn";
// //   closeButton.textContent = "Close";
// //   closeButton.addEventListener("click", () => {
// //     lightbox.remove();
// //   });

// //   content.appendChild(closeButton);
// //   lightbox.appendChild(content);
// //   document.body.appendChild(lightbox);
// // };

// // export default Lightbox;


// // // import "../../../css/ui/Lightbox.css";

// // // const Lightbox = (images, initialIndex = 0) => {
// // //   const lightbox = document.createElement("div");
// // //   lightbox.className = "lightbox-overlay";

// // //   const content = document.createElement("div");
// // //   content.className = "lightbox-content";

// // //   const img = document.createElement("img");
// // //   img.src = images[initialIndex];
// // //   img.alt = "Lightbox Image";

// // //   content.appendChild(img);

// // //   let lastTap = 0;
// // //   let isZoomed = false;
// // //   let offsetX = 0, offsetY = 0, startX = 0, startY = 0, isDragging = false;
// // //   let initialDistance = 0;
// // //   let scale = 1;

// // //   // Double Tap to Zoom
// // //   img.addEventListener("touchend", (e) => {
// // //     const currentTime = new Date().getTime();
// // //     const tapLength = currentTime - lastTap;

// // //     if (tapLength < 300 && tapLength > 0) {
// // //       if (!isZoomed) {
// // //         scale = 2;
// // //         img.style.transform = `scale(${scale})`;
// // //         img.style.transition = "transform 0.3s ease";
// // //         img.style.cursor = "grab";
// // //         isZoomed = true;
// // //       } else {
// // //         resetZoom();
// // //       }
// // //     }
// // //     lastTap = currentTime;
// // //   });

// // //   // Pinch-to-Zoom
// // //   img.addEventListener("touchstart", (e) => {
// // //     if (e.touches.length === 2) {
// // //       initialDistance = getDistance(e.touches[0], e.touches[1]);
// // //     }
// // //   });

// // //   img.addEventListener("touchmove", (e) => {
// // //     if (e.touches.length === 2) {
// // //       const currentDistance = getDistance(e.touches[0], e.touches[1]);
// // //       let pinchScale = currentDistance / initialDistance;

// // //       scale = Math.min(Math.max(1, pinchScale), 3); // Limit scale between 1x and 3x
// // //       img.style.transform = `scale(${scale})`;
// // //       isZoomed = scale > 1;
// // //     }
// // //   });

// // //   // Drag Zoomed Image
// // //   img.addEventListener("mousedown", (e) => {
// // //     if (!isZoomed) return;
// // //     isDragging = true;
// // //     startX = e.clientX - offsetX;
// // //     startY = e.clientY - offsetY;
// // //     img.style.cursor = "grabbing";
// // //   });

// // //   img.addEventListener("mousemove", (e) => {
// // //     if (!isDragging || !isZoomed) return;
// // //     offsetX = e.clientX - startX;
// // //     offsetY = e.clientY - startY;
// // //     img.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
// // //   });

// // //   img.addEventListener("mouseup", () => {
// // //     isDragging = false;
// // //     img.style.cursor = "grab";
// // //   });

// // //   img.addEventListener("mouseleave", () => {
// // //     isDragging = false;
// // //     img.style.cursor = "grab";
// // //   });

// // //   // Reset Zoom
// // //   const resetZoom = () => {
// // //     scale = 1;
// // //     img.style.transform = "scale(1)";
// // //     img.style.left = "0px";
// // //     img.style.top = "0px";
// // //     img.style.cursor = "default";
// // //     offsetX = 0;
// // //     offsetY = 0;
// // //     isZoomed = false;
// // //   };

// // //   const getDistance = (touch1, touch2) => {
// // //     const dx = touch2.clientX - touch1.clientX;
// // //     const dy = touch2.clientY - touch1.clientY;
// // //     return Math.sqrt(dx * dx + dy * dy);
// // //   };

// // //   const updateImage = (index) => {
// // //     img.src = images[index];
// // //     resetZoom();
// // //   };

// // //   if (images.length > 1) {
// // //     const prevButton = document.createElement("button");
// // //     prevButton.className = "lightbox-prev-btn";
// // //     prevButton.textContent = "Prev";

// // //     const nextButton = document.createElement("button");
// // //     nextButton.className = "lightbox-next-btn";
// // //     nextButton.textContent = "Next";

// // //     let currentIndex = initialIndex;

// // //     prevButton.addEventListener("click", () => {
// // //       currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
// // //       updateImage(currentIndex);
// // //     });

// // //     nextButton.addEventListener("click", () => {
// // //       currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
// // //       updateImage(currentIndex);
// // //     });

// // //     content.appendChild(prevButton);
// // //     content.appendChild(nextButton);
// // //   }

// // //   const closeButton = document.createElement("button");
// // //   closeButton.className = "lightbox-close-btn";
// // //   closeButton.textContent = "Close";
// // //   closeButton.addEventListener("click", () => {
// // //     lightbox.remove();
// // //   });

// // //   content.appendChild(closeButton);
// // //   lightbox.appendChild(content);
// // //   document.body.appendChild(lightbox);
// // // };

// // // export default Lightbox;

// // // // import "../../../css/ui/Lightbox.css";

// // // // const Lightbox = (images, initialIndex = 0) => {
// // // //   const lightbox = document.createElement("div");
// // // //   lightbox.className = "lightbox-overlay";

// // // //   // Create the lightbox content
// // // //   const content = document.createElement("div");
// // // //   content.className = "lightbox-content";

// // // //   // Create the image element
// // // //   const img = document.createElement("img");
// // // //   img.src = images[initialIndex];
// // // //   img.alt = "Lightbox Image";

// // // //   content.appendChild(img);

// // // //   // Image zoom & drag functionality
// // // //   let lastTap = 0;
// // // //   let isZoomed = false;
// // // //   let offsetX = 0,
// // // //     offsetY = 0,
// // // //     startX = 0,
// // // //     startY = 0,
// // // //     isDragging = false;

// // // //   // Double Tap to Zoom
// // // //   img.addEventListener("touchend", (e) => {
// // // //     const currentTime = new Date().getTime();
// // // //     const tapLength = currentTime - lastTap;

// // // //     if (tapLength < 300 && tapLength > 0) {
// // // //       if (!isZoomed) {
// // // //         img.style.transform = "scale(2)";
// // // //         img.style.transition = "transform 0.3s ease";
// // // //         img.style.cursor = "grab";
// // // //         isZoomed = true;
// // // //       } else {
// // // //         img.style.transform = "scale(1)";
// // // //         img.style.left = "0px";
// // // //         img.style.top = "0px";
// // // //         img.style.cursor = "default";
// // // //         isZoomed = false;
// // // //       }
// // // //     }
// // // //     lastTap = currentTime;
// // // //   });

// // // //   // Enable dragging when zoomed
// // // //   img.addEventListener("mousedown", (e) => {
// // // //     if (!isZoomed) return;
// // // //     isDragging = true;
// // // //     startX = e.clientX - offsetX;
// // // //     startY = e.clientY - offsetY;
// // // //     img.style.cursor = "grabbing";
// // // //   });

// // // //   img.addEventListener("mousemove", (e) => {
// // // //     if (!isDragging || !isZoomed) return;
// // // //     offsetX = e.clientX - startX;
// // // //     offsetY = e.clientY - startY;
// // // //     img.style.transform = `scale(2) translate(${offsetX}px, ${offsetY}px)`;
// // // //   });

// // // //   img.addEventListener("mouseup", () => {
// // // //     isDragging = false;
// // // //     img.style.cursor = "grab";
// // // //   });

// // // //   img.addEventListener("mouseleave", () => {
// // // //     isDragging = false;
// // // //     img.style.cursor = "grab";
// // // //   });

// // // //   // Image navigation
// // // //   const updateImage = (index) => {
// // // //     img.src = images[index];
// // // //     img.style.transform = "scale(1)"; // Reset zoom on new image
// // // //     isZoomed = false;
// // // //     offsetX = 0;
// // // //     offsetY = 0;
// // // //   };

// // // //   if (images.length > 1) {
// // // //     // Navigation buttons
// // // //     const prevButton = document.createElement("button");
// // // //     prevButton.className = "lightbox-prev-btn";
// // // //     prevButton.textContent = "Prev";
// // // //     const nextButton = document.createElement("button");
// // // //     nextButton.className = "lightbox-next-btn";
// // // //     nextButton.textContent = "Next";

// // // //     let currentIndex = initialIndex;

// // // //     prevButton.addEventListener("click", () => {
// // // //       currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
// // // //       updateImage(currentIndex);
// // // //     });

// // // //     nextButton.addEventListener("click", () => {
// // // //       currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
// // // //       updateImage(currentIndex);
// // // //     });

// // // //     content.appendChild(prevButton);
// // // //     content.appendChild(nextButton);
// // // //   }

// // // //   // Close button
// // // //   const closeButton = document.createElement("button");
// // // //   closeButton.className = "lightbox-close-btn";
// // // //   closeButton.textContent = "Close";
// // // //   closeButton.addEventListener("click", () => {
// // // //     lightbox.remove();
// // // //   });

// // // //   content.appendChild(closeButton);
// // // //   lightbox.appendChild(content);
// // // //   document.body.appendChild(lightbox);
// // // // };

// // // // export default Lightbox;


// // // // // import "../../../css/ui/Lightbox.css";
// // // // // const Lightbox = (images, initialIndex = 0) => {
// // // // //   const lightbox = document.createElement('div');
// // // // //   lightbox.className = 'lightbox-overlay';

// // // // //   // Create the lightbox content
// // // // //   const content = document.createElement('div');
// // // // //   content.className = 'lightbox-content';

// // // // //   // Create the image element
// // // // //   const img = document.createElement('img');
// // // // //   img.src = images[initialIndex];
// // // // //   img.alt = 'Lightbox Image';
// // // // //   content.appendChild(img);

// // // // //   // Function to update image
// // // // //   const updateImage = (index) => {
// // // // //     img.src = images[index];
// // // // //   };

// // // // //   if (images.length > 1) {
// // // // //     // Create navigation buttons
// // // // //     const prevButton = document.createElement('button');
// // // // //     prevButton.className = 'lightbox-prev-btn';
// // // // //     prevButton.textContent = 'Prev';
// // // // //     const nextButton = document.createElement('button');
// // // // //     nextButton.className = 'lightbox-next-btn';
// // // // //     nextButton.textContent = 'Next';

// // // // //     // Set initial index
// // // // //     let currentIndex = initialIndex;

// // // // //     // Navigate to the previous image
// // // // //     prevButton.addEventListener('click', () => {
// // // // //       currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
// // // // //       updateImage(currentIndex);
// // // // //     });

// // // // //     // Navigate to the next image
// // // // //     nextButton.addEventListener('click', () => {
// // // // //       currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
// // // // //       updateImage(currentIndex);
// // // // //     });
    
// // // // //     content.appendChild(prevButton);
// // // // //     content.appendChild(nextButton);
// // // // //   }

// // // // //   // Add close button
// // // // //   const closeButton = document.createElement('button');
// // // // //   closeButton.className = 'lightbox-close-btn';
// // // // //   closeButton.textContent = 'Close';
// // // // //   closeButton.addEventListener('click', () => {
// // // // //     lightbox.remove();
// // // // //   });

// // // // //   // Append elements to the content
// // // // //   content.appendChild(closeButton);

// // // // //   // Append the content to the lightbox
// // // // //   lightbox.appendChild(content);

// // // // //   // Append the lightbox to the body or any container
// // // // //   document.body.appendChild(lightbox);
// // // // // };

// // // // // export default Lightbox;