// postCreation/config.js

export const postTypeConfig = {
  image: {
    inputId: "imageUpload",
    fileKey: "images",
    createMediaElement: (src) => {
      const img = new Image();
      img.src = src;
      return img;
    },
    validateFile: (file) =>
      file.type.startsWith("image/") &&
      file.size >= 10 * 1024 &&
      file.size <= 1024 * 1024 * 1024,
  },
  video: {
    inputId: "videoUpload",
    fileKey: "videos",
    createMediaElement: (src) => {
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      return video;
    },
    validateFile: (file) =>
      file.type.startsWith("video/") &&
      file.size >= 10 * 1024 &&
      file.size <= 1024 * 1024 * 1024,
  },
  // Add new types like webtoon, audio, pdf, etc. here

  // webtoon: {
  //   inputId: "webtoonUpload",
  //   fileKey: "webtoon_images",
  //   createMediaElement: (src) => {
  //     const img = new Image();
  //     img.src = src;
  //     img.classList.add("webtoon-image"); // Add a class for vertical scroll style
  //     return img;
  //   },
  //   validateFile: (file) =>
  //     file.type.startsWith("image/") &&
  //     file.size >= 10 * 1024 &&
  //     file.size <= 10 * 1024 * 1024, // webtoons are usually split into lighter slices
  // },

  // blog: {
  //   inputId: "blogUpload", // can be a textarea or markdown file
  //   fileKey: "blog_content",
  //   createMediaElement: (src) => {
  //     const container = document.createElement("div");
  //     container.classList.add("blog-preview");
  //     container.innerText = src;
  //     return container;
  //   },
  //   validateFile: (file) =>
  //     file.type === "text/markdown" ||
  //     file.type === "text/plain" ||
  //     file.name.endsWith(".md"),
  // },
};
