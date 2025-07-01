// import { RenderImagePost } from "../feed/renderImagePost.js";
// import { RenderVideoPost } from "../feed/renderVideoPost.js";
// import { RenderAudioPost } from "../feed/renderAudioPost.js";


// Create Media Content
function createChatContent(post, media) {
    console.log(post);
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'post-media';

    // if (post.type === "image" && media.length > 0) {
    //     RenderImagePost(mediaContainer, media);
    // } else if (post.type === "video" && media.length > 0) {
    //     RenderVideoPost(mediaContainer, media);
    // } else if (post.type === "audio" && media.length > 0) {
    //     RenderAudioPost(mediaContainer, media);
    // }

    return mediaContainer;
}

export { createChatContent };