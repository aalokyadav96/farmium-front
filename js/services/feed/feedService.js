import { navigate } from "../../routes/index.js";
import { setupPostCreation } from "./createPost.js";
import { fetchFeed } from "./fetchFeed.js";

async function displayFeed(isLoggedIn, feedsec) {
    if (!isLoggedIn) {
        navigate('/login');
        return;
    }

    feedsec.appendChild(generateFeedHTML());

    // Set up event listeners for post creation and media upload
    setupPostCreation();

    const postsContainer = document.getElementById("postsContainer");
    postsContainer.innerHTML = '<p>Loading posts...</p>';
    
    fetchFeed(postsContainer);

}


function generateFeedHTML() {
    // Create the container div
    const container = document.createElement('div');
    container.className = 'container';

    // Create the main feed section
    const main = document.createElement('main');
    main.className = 'feed';

    // Create the post-compose div
    const postCompose = document.createElement('div');
    postCompose.className = 'post-compose';

    // Create the post header div with the select element
    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';

    // Create the label element
    const postTypeLabel = document.createElement('label');
    postTypeLabel.htmlFor = 'postType';
    postTypeLabel.textContent = 'Post Type:';

    // Create the select element
    const postTypeSelector = document.createElement('select');
    postTypeSelector.id = 'postType';
    postTypeSelector.className = 'post-type-selector';

    const defaultOption = new Option('Select Post Type', 'text');
    const imageOption = new Option('Image Post', 'image');
    const videoOption = new Option('Video Post', 'video');

    postTypeSelector.add(defaultOption);
    postTypeSelector.add(imageOption);
    postTypeSelector.add(videoOption);

    // Append the label and select elements to the header
    postHeader.appendChild(postTypeLabel);
    postHeader.appendChild(postTypeSelector);

    // Create the media upload section
    const mediaUpload = document.createElement('div');
    mediaUpload.id = 'mediaUpload';
    mediaUpload.className = 'media-upload';

    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.id = 'imageUpload';
    imageUpload.accept = 'image/png, image/gif, image/jpeg, image/tiff, image/webp';
    imageUpload.multiple = true;
    imageUpload.style.display = 'none';

    const videoUpload = document.createElement('input');
    videoUpload.type = 'file';
    videoUpload.id = 'videoUpload';
    videoUpload.accept = 'video/*, image/gif';
    videoUpload.style.display = 'none';

    mediaUpload.appendChild(imageUpload);
    mediaUpload.appendChild(videoUpload);

    // Create the media preview div
    const mediaPreview = document.createElement('div');
    mediaPreview.id = 'mediaPreview';
    mediaPreview.className = 'media-preview hflex';
    // mediaPreview.contentEditable = 'true';

    // Create the post button
    const postButton = document.createElement('button');
    postButton.id = 'postButton';
    postButton.className = 'post-button';
    postButton.textContent = 'Post';

    // Assemble the post-compose section
    postCompose.appendChild(postHeader);
    postCompose.appendChild(mediaUpload);
    postCompose.appendChild(mediaPreview);
    postCompose.appendChild(postButton);

    // Create the posts container section
    const postsContainer = document.createElement('section');
    postsContainer.id = 'postsContainer';
    postsContainer.className = 'postsContainer';

    // Assemble the main section
    main.appendChild(postCompose);
    main.appendChild(postsContainer);

    // Add the main section to the container
    container.appendChild(main);

    // Append the container to the body or desired parent
    return container;
}



export { displayFeed, generateFeedHTML };