export function RenderBlogPost(container, textContent) {
    const textBlock = document.createElement("div");
    textBlock.className = "blog-post";
    textBlock.textContent = textContent;
    container.appendChild(textBlock);
}
// .blog-post {
//     background: #f9f9f9;
//     padding: 1rem;
//     border-radius: 4px;
//     white-space: pre-wrap;
//     font-family: "Georgia", serif;
// }
