export const createQualitySelector = (video, baseSrc, availableResolutions) => {
  const selector = document.createElement("select");
  selector.className = "quality-selector buttonx";

  const allQualities = [1440, 1080, 720, 480, 360, 240, 144];
  const available = ["original", ...allQualities.filter(q => availableResolutions.includes(q))];

  const stored = localStorage.getItem("videoQuality") || `${Math.min(...availableResolutions)}`;

  available.forEach((quality) => {
    const isOriginal = quality === "original";
    const label = isOriginal ? "Original" : `${quality}p`;
    const value = isOriginal ? `${baseSrc}.mp4` : `${baseSrc}-${quality}p.mp4`;

    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;

    const cleanedStored = stored.replace("p", "");
    const match = isOriginal
      ? stored === "original"
      : parseInt(cleanedStored) === quality;

    option.selected = match;
    selector.appendChild(option);
  });

  selector.addEventListener("change", (event) => {
    const selectedSrc = event.target.value;
    const selectedQuality = selectedSrc.includes("-")
      ? selectedSrc.split("-").pop().replace(".mp4", "")
      : "original";

    localStorage.setItem("videoQuality", selectedQuality);
    video.src = selectedSrc;
    video.play();
  });

  return {
    selector,
    qualities: available
  };
};

// export const createQualitySelector = (video, baseSrc, availableResolutions) => {
//     const selector = document.createElement("select");
//     selector.className = "quality-selector buttonx";
  
//     const allQualities = ["original", 1440, 1080, 720, 480, 360, 240, 144];
//     const available = ["original", ...allQualities.filter((q) => availableResolutions.includes(q))];
//     const stored = localStorage.getItem("videoQuality") || `${Math.min(...availableResolutions)}p`;
  
//     available.forEach((quality) => {
//       const label = quality === "original" ? "Original" : `${quality}p`;
//       const value = quality === "original" ? `${baseSrc}.mp4` : `${baseSrc}-${quality}p.mp4`;
  
//       const option = document.createElement("option");
//       option.value = value;
//       option.textContent = label;
//       option.selected = stored === label;
//       selector.appendChild(option);
//     });
  
//     selector.addEventListener("change", (event) => {
//       const selectedSrc = event.target.value;
//       const selectedQuality = selectedSrc.includes("-")
//         ? selectedSrc.split("-").pop().replace(".mp4", "")
//         : "original";
  
//       localStorage.setItem("videoQuality", selectedQuality);
//       video.src = selectedSrc;
//       video.play();
//     });
  
//     return {
//       selector,
//       qualities: available
//     };
//   };
  