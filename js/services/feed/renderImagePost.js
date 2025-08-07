import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import ZoomBox from "../../components/ui/ZoomBox.mjs";

async function RenderImagePost(mediaContainer, media) {
    const mediaClasses = [
        'PostPreviewImageView_-one__-6MMx',
        'PostPreviewImageView_-two__WP8GL',
        'PostPreviewImageView_-three__HLsVN',
        'PostPreviewImageView_-four__fYIRN',
        'PostPreviewImageView_-five__RZvWx',
        'PostPreviewImageView_-six__EG45r',
        'PostPreviewImageView_-seven__65gnj',
        'PostPreviewImageView_-eight__SoycA'
    ];
    const classIndex = Math.min(media.length - 1, mediaClasses.length - 1);
    const assignedClass = mediaClasses[classIndex];

    const imageList = document.createElement('ul');
    imageList.className = `preview_image_wrap__Q29V8 PostPreviewImageView_-artist__WkyUA PostPreviewImageView_-bottom_radius__Mmn-- ${assignedClass}`;

    const fullImagePaths = media.map(img => resolveImagePath(EntityType.FEED, PictureType.PHOTO, img));

    media.forEach((img, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'PostPreviewImageView_image_item__dzD2P';

        const image = document.createElement('img');

        const thumbPath = resolveImagePath(EntityType.FEED, PictureType.THUMB, img);
        image.src = thumbPath;
        image.loading = "lazy";
        image.alt = "Post Image";
        image.className = 'post-image PostPreviewImageView_post_image__zLzXH';
        image.addEventListener("click", () => startZoombox(fullImagePaths, index));

        listItem.appendChild(image);
        imageList.appendChild(listItem);
    });

    mediaContainer.appendChild(imageList);
}

async function startZoombox(img, index) {
    ZoomBox(img, index);
}

export { RenderImagePost };

// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
// import ZoomBox from "../../components/ui/ZoomBox.mjs";

// async function RenderImagePost(mediaContainer, media) {
//     const mediaClasses = [
//         'PostPreviewImageView_-one__-6MMx',
//         'PostPreviewImageView_-two__WP8GL',
//         'PostPreviewImageView_-three__HLsVN',
//         'PostPreviewImageView_-four__fYIRN',
//         'PostPreviewImageView_-five__RZvWx',
//         'PostPreviewImageView_-six__EG45r',
//         'PostPreviewImageView_-seven__65gnj',
//         'PostPreviewImageView_-eight__SoycA'
//     ];
//     const classIndex = Math.min(media.length - 1, mediaClasses.length - 1);
//     const assignedClass = mediaClasses[classIndex];

//     const imageList = document.createElement('ul');
//     imageList.className = `preview_image_wrap__Q29V8 PostPreviewImageView_-artist__WkyUA PostPreviewImageView_-bottom_radius__Mmn-- ${assignedClass}`;

//     media.forEach((img, index) => {
//         const listItem = document.createElement('li');
//         listItem.className = 'PostPreviewImageView_image_item__dzD2P';

//         const image = document.createElement('img');

//         const thumbPath = resolveImagePath(EntityType.FEED, PictureType.THUMB, img);
//         image.src = thumbPath;
//         // image.src = img;
//         image.loading = "lazy";
//         image.alt = "Post Image";
//         image.className = 'post-image PostPreviewImageView_post_image__zLzXH';
//         image.addEventListener("click", () => startZoombox(media, index));

//         listItem.appendChild(image);
//         imageList.appendChild(listItem);
//     });

//     mediaContainer.appendChild(imageList);
// }

// async function startZoombox(img, index) {
//     ZoomBox(img, index);
// }

// export { RenderImagePost };

// // import ZoomBox from "../../components/ui/ZoomBox.mjs";
// // // import MultiView from "../../components/ui/Multiview.mjs";

// // async function RenderImagePost(mediaContainer, media) {
// //     const mediaClasses = [
// //         'PostPreviewImageView_-one__-6MMx',
// //         'PostPreviewImageView_-two__WP8GL',
// //         'PostPreviewImageView_-three__HLsVN',
// //         'PostPreviewImageView_-four__fYIRN',
// //         'PostPreviewImageView_-five__RZvWx',
// //         'PostPreviewImageView_-six__EG45r',
// //         'PostPreviewImageView_-seven__65gnj',
// //         'PostPreviewImageView_-eight__SoycA'
// //     ];
// //     const classIndex = Math.min(media.length - 1, mediaClasses.length - 1);
// //     const assignedClass = mediaClasses[classIndex];

// //     const imageList = document.createElement('ul');
// //     imageList.className = `preview_image_wrap__Q29V8 PostPreviewImageView_-artist__WkyUA PostPreviewImageView_-bottom_radius__Mmn-- ${assignedClass}`;

// //     media.forEach((img, index) => {
// //         const listItem = document.createElement('li');
// //         listItem.className = 'PostPreviewImageView_image_item__dzD2P';

// //         const image = document.createElement('img');

// //         // 🔥 Remove "thumb/" from image path
// //         let imgurl = `${img.replace("postpic/", "postpic/thumb/")}`;
// //         image.src = imgurl;
// //         image.loading = "lazy";
// //         image.alt = "Post Image";
// //         image.className = 'post-image PostPreviewImageView_post_image__zLzXH';
// //         // Open image in ZoomBox on click
// //         image.addEventListener("click", () => startZoombox(media, index));

// //         listItem.appendChild(image);
// //         imageList.appendChild(listItem);
// //     });

// //     mediaContainer.appendChild(imageList);
// // }

// // async function startZoombox(img, index) {
// //     // if (img.length === 2) {
// //     //     MultiView(img);
// //     // } else {
// //         // new ZoomBox(img, index);
// //         ZoomBox(img, index);
// //     // }
// // }


// // export { RenderImagePost };
