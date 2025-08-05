  
import { createElement } from "../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import GridGallery from "../../components/ui/GridGallery.mjs";
import Button from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";
import { formatRelativeTime } from "../../utils/dateUtils.js";
import { editPost } from "./editPost.js";
import { createCommentsSection } from "../comments/comments.js";
import { getState } from "../../state/state.js";
import { userProfileCard } from "./userProfileCard.js";
import Sightbox from "../../components/ui/SightBox.mjs";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";


export async function displayPost(isLoggedIn, postId, container) {
    container.innerHTML = "";
    const contentContainer = createElement("div", { class: "postpage" });
    container.appendChild(contentContainer);
  
    let post;
    try {
      post = await apiFetch(`/posts/${postId}`);
    } catch (err) {
      contentContainer.appendChild(createElement("p", {}, ["⚠️ Failed to load post."]));
      console.error(err);
      return;
    }
  
    const postContainer = createElement("div", { class: "post-detail" });
    postContainer.appendChild(renderHeader(post));
  
    if (post.imagePaths?.length) {
      const imgarray = post.imagePaths.map(path => ({
        src: resolveImagePath(EntityType.POST, PictureType.PHOTO, path),
        alt: post.title || "Post Image"
      }));
      
      postContainer.appendChild(GridGallery(imgarray));
    }
  
    const content = createElement("div", { class: "post-body" });
    (post.content?.trim().split("\n") || ["No content"]).forEach(line =>
      content.appendChild(createElement("p", {}, [line.trim()]))
    );
    postContainer.appendChild(content);
  
    if (post.tags?.length) postContainer.appendChild(renderTags(post.tags));
  
    const avatarPath = resolveImagePath(
      EntityType.USER,
      PictureType.THUMB,
      post.createdBy
    );
    
    postContainer.appendChild(
      userProfileCard({
        username: post.createdBy || "anonymous",
        bio: "Secretly Greatly",
        avatarUrl: `${post.createdBy}.jpg`,
        postCount: 20,
        isFollowing: false
      })
    );
  
    if (isLoggedIn && post.createdBy) {
      postContainer.appendChild(renderPostActions(postId, isLoggedIn, contentContainer));
    }
  
    const commentToggle = createElement("button", {
      class: "toggle-comments btn btn-link"
    }, ["💬 Show Comments"]);
  
    let commentsEl = null;
    let commentsVisible = false;
  
    commentToggle.addEventListener("click", () => {
      if (!commentsVisible) {
        commentsEl = createCommentsSection(
          postId,
          post.comments || [],
          "blogpost",
          post._id,
          getState("user")
        );
        postContainer.appendChild(commentsEl);
        commentToggle.textContent = "💬 Hide Comments";
        commentsVisible = true;
      } else {
        if (commentsEl) commentsEl.remove();
        commentToggle.textContent = "💬 Show Comments";
        commentsVisible = false;
      }
    });
  
    const commentWrapper = createElement("div", { class: "post-comments" }, [
      createElement("h4", {}, ["Comments"]),
      commentToggle
    ]);
  
    contentContainer.append(postContainer, commentWrapper);
  }
  
  function renderHeader(post) {
    return createElement("div", { class: "post-data" }, [
      createElement("h2", {}, [post.title || "Untitled"]),
      createElement("p", { class: "post-meta" }, [
        `📁 ${post.category || "Uncategorized"} › ${post.subcategory || "General"} • `,
        `👤 ${post.author?.name || "Anonymous"} • `,
        post.createdAt ? `🕒 ${formatRelativeTime(post.createdAt)}` : ""
      ])
    ]);
  }
  
  function renderTags(tags) {
    return createElement("div", { class: "post-tags" }, tags.map(tag =>
      createElement("span", { class: "tag" }, [`#${tag}`])
    ));
  }
  
  function renderPostActions(postId, isLoggedIn, contentContainer) {
    return createElement("div", { class: "post-actions" }, [
      Button("✏️ Edit", "", {
        click: () => {
          contentContainer.innerHTML = "";
          editPost(isLoggedIn, postId, contentContainer);
        }
      }, "btn btn-warning"),
      Button("🗑️ Delete", "delete-post", {
        click: async () => {
          if (confirm("Are you sure you want to delete this post?")) {
            try {
              await apiFetch(`/posts/post/${postId}`, "DELETE");
              Snackbar("✅ Post deleted.", 3000);
              navigate("/posts");
            } catch (err) {
              Snackbar("❌ Failed to delete post.", 3000);
              console.error(err);
            }
          }
        }
      }, "btn btn-danger")
    ]);
  }
  
// import { createElement } from "../../components/createElement.js";
// import { SRC_URL, apiFetch } from "../../api/api.js";
// import Snackbar from "../../components/ui/Snackbar.mjs";
// import GridGallery from "../../components/ui/GridGallery.mjs";
// import Button from "../../components/base/Button.js";
// import { navigate } from "../../routes/index.js";
// import { formatRelativeTime } from "../../utils/dateUtils.js";
// import { editPost } from "./editPost.js";
// import { createCommentsSection } from "../comments/comments.js";
// import { getState } from "../../state/state.js";
// import { userProfileCard } from "./userProfileCard.js";
// import Sightbox from "../../components/ui/SightBox.mjs";

// export async function displayPost(isLoggedIn, postId, container) {
//     container.innerHTML = "";
//     let contentContainer = createElement('div',{"class":"postpage"},[]);

//     container.appendChild(contentContainer);

//     let post;
//     try {
//         post = await apiFetch(`/posts/${postId}`);
//     } catch (err) {
//         contentContainer.appendChild(createElement("p", {}, ["⚠️ Failed to load post."]));
//         console.error(err);
//         return;
//     }

//     const postContainer = createElement("div", { class: "post-detail" });

//     // Header
//     postContainer.appendChild(renderHeader(post));

//     // // Images
//     // if (post.imagePaths?.length) postContainer.appendChild(renderImages(post.imagePaths, post.title));

//     // Images
//     if (post.imagePaths?.length) {
//         const imgarray = post.imagePaths.map(path => ({
//             src: `${SRC_URL}${path}`,
//             alt: post.title || "Post Image"
//         }));

//         postContainer.appendChild(GridGallery(imgarray));
//     }


//     // Body content
//     const content = createElement("div", { class: "post-body" });
//     const contentLines = post.content?.trim().split("\n") || ["No content"];
//     contentLines.forEach(line => {
//         content.appendChild(createElement("p", {}, [line.trim()]));
//     });
//     postContainer.appendChild(content);

//     // Tags
//     if (post.tags?.length) postContainer.appendChild(renderTags(post.tags));

//     // Author card
//     postContainer.appendChild(userProfileCard({ username: post.createdBy, bio: "Secretly Greatly", avatarUrl: `/userpic/thumb/${post.createdBy}.jpg`, postCount: 20, isFollowing: false }));

//     // Edit/Delete buttons if owner
//     if (isLoggedIn && post.createdBy) postContainer.appendChild(renderPostActions(postId, isLoggedIn, contentContainer));

//     // Comments
//     const commentToggle = createElement("button", { class: "toggle-comments btn btn-link" }, ["💬 Show Comments"]);
//     commentToggle.addEventListener("click", () => {
//         if (!post._commentsVisible) {
//             const comments = createCommentsSection(postId, post.comments || [], "blogpost", post._id, getState("user"));
//             postContainer.appendChild(comments);
//             post._commentsVisible = true;
//             commentToggle.textContent = "💬 Hide Comments";
//         } else {
//             const commentsEl = postContainer.querySelector(".comments-section");
//             if (commentsEl) commentsEl.remove();
//             post._commentsVisible = false;
//             commentToggle.textContent = "💬 Show Comments";
//         }
//     });

//     const commentWrapper = createElement("div", { class: "post-comments" }, [
//         createElement("h4", {}, ["Comments"]),
//         commentToggle
//     ]);

//     contentContainer.append(postContainer, commentWrapper);
// }

// // Helper subcomponents
// function renderHeader(post) {
//     return createElement("div", { class: "post-data" }, [
//         createElement("h2", {}, [post.title || "Untitled"]),
//         createElement("p", { class: "post-meta" }, [
//             `📁 ${post.category || "Uncategorized"} › ${post.subcategory || "General"} • `,
//             `👤 ${post.author?.name || "Anonymous"} • `,
//             post.createdAt ? `🕒 ${formatRelativeTime(post.createdAt)}` : ""
//         ])
//     ]);
// }

// function renderTags(tags) {
//     const tagContainer = createElement("div", { class: "post-tags" });
//     tags.forEach(tag => tagContainer.appendChild(createElement("span", { class: "tag" }, [`#${tag}`])));
//     return tagContainer;
// }

// function renderImages(imagePaths, title = "") {
//     const gallery = createElement("div", { class: "post-images" });
//     imagePaths.forEach(path => {
//         const img = createElement("img", {
//             src: `${SRC_URL}/${path}`,
//             alt: title || "Post image",
//             class: "post-image-thumb",
//             loading: "lazy"
//         });
//         img.onerror = () => (img.src = "/fallback.jpg");
//         img.addEventListener("click", () => Sightbox(img.src, "image"));
//         gallery.appendChild(img);
//     });
//     return gallery;
// }

// function renderPostActions(postId, isLoggedIn, contentContainer) {
//     return createElement("div", { class: "post-actions" }, [
//         Button("✏️ Edit", {
//             class: "btn btn-warning",
//             ariaLabel: "Edit post"
//         }, {
//             click: () => {
//                 contentContainer.innerHTML = "";
//                 editPost(isLoggedIn, postId, contentContainer);
//             }
//         }),
//         Button("🗑️ Delete", "delete-post", {
//             click: async () => {
//                 if (confirm("Are you sure you want to delete this post?")) {
//                     try {
//                         await apiFetch(`/posts/post/${postId}`, "DELETE");
//                         Snackbar("✅ Post deleted.", 3000);
//                         navigate("/posts");
//                     } catch (err) {
//                         Snackbar("❌ Failed to delete post.", 3000);
//                         console.error(err);
//                     }
//                 }
//             }
//         }, "btn btn-danger")
//     ]);
// }

// // function openLightbox(imgUrl) {
// //     const overlay = createElement("div", { class: "lightbox" });
// //     const img = createElement("img", { src: imgUrl });
// //     const close = createElement("button", { class: "lightbox-close", "aria-label": "Close lightbox" }, ["×"]);
// //     overlay.addEventListener("click", e => {
// //         if (e.target === overlay || e.target === close) overlay.remove();
// //     });
// //     overlay.append(img, close);
// //     document.body.appendChild(overlay);
// // }

// // export async function displayPost(isLoggedIn, postid, contentContainer) {
// //     contentContainer.textContent = '';

// //     let post;
// //     try {
// //         post = await apiFetch(`/posts/${postid}`);
// //     } catch (err) {
// //         contentContainer.appendChild(createElement('p', {}, ['⚠️ Failed to load post.']));
// //         console.error(err);
// //         return;
// //     }

// //     const postContainer = createElement('div', { class: 'post-detail' });

// //     const header = createElement('div', { class: 'post-header' }, [
// //         createElement('h2', {}, [post.title || "Untitled"]),
// //         createElement('p', { class: 'post-meta' }, [
// //             `📁 ${post.category || "Uncategorized"} › ${post.subcategory || "General"} `,
// //             `• 👤 ${post.author?.name || 'Anonymous'} `,
// //             post.createdAt ? `• 🕒 ${formatRelativeTime(post.createdAt)}` : ""
// //         ])
// //     ]);

// //     const content = createElement('div', { class: 'post-body' });
// //     const contentParagraphs = post.content?.split("\n").map(line =>
// //         createElement("p", {}, [line.trim()])
// //     ) || [createElement("p", {}, ["No content"])];

// //     content.append(...contentParagraphs);

// //     if (post.tags?.length) {
// //         const tagList = createElement('div', { class: 'post-tags' });
// //         post.tags.forEach(tag => {
// //             tagList.appendChild(createElement('span', { class: 'tag' }, [`#${tag}`]));
// //         });
// //         postContainer.appendChild(tagList);
// //     }

// //     if (post.imagePaths?.length) {
// //         const imageGallery = createElement('div', { class: 'post-images' });
// //         post.imagePaths.forEach(src => {
// //             const img = createElement('img', {
// //                 src: `${SRC_URL}/${src}`,
// //                 alt: post.title,
// //                 class: 'post-image-thumb',
// //                 loading: 'lazy'
// //             });
// //             img.addEventListener("click", () => openLightbox(`${SRC_URL}/${src}`));
// //             img.onerror = () => { img.src = "/fallback.jpg"; };
// //             imageGallery.appendChild(img);
// //         });
// //         postContainer.appendChild(imageGallery);
// //     }

// //     postContainer.append(header, content);

// //     // Show actions if logged in and user is the owner
// //     if (isLoggedIn && post.createdBy) {
// //         const actions = createElement('div', { class: 'post-actions' }, [
// //             Button('✏️ Edit', {
// //                 class: 'btn btn-warning',
// //             }, {
// //                 click: () => {
// //                     contentContainer.innerHTML = "";
// //                     editPost(isLoggedIn, postid, contentContainer);
// //                 }
// //             }),
// //             Button("🗑️ Delete", "delete-post", {
// //                 click: async () => {
// //                     if (confirm("Are you sure you want to delete this post?")) {
// //                         try {
// //                             await apiFetch(`/posts/post/${postid}`, 'DELETE');
// //                             Snackbar("✅ Post deleted.", 3000);
// //                             navigate('/posts');
// //                         } catch (err) {
// //                             Snackbar("❌ Failed to delete post.", 3000);
// //                             console.error(err);
// //                         }
// //                     }
// //                 }
// //             }, "btn btn-danger")
// //         ]);
// //         postContainer.appendChild(actions);
// //     }

// //     /* */
// //     postContainer.appendChild(userProfileCard());

// //     const commentButton = document.createElement("span");
// //     commentButton.className = "comment";
// //     commentButton.textContent = "Comment";
// //     commentButton.addEventListener("click", () => {
// //         if (!post._commentSectionVisible) {
// //             const commentsEl = createCommentsSection(postid, post.comments || [], "blogpost", post._id, getState("user"));
// //             postContainer.appendChild(commentsEl);
// //             post._commentSectionVisible = true;
// //         }
// //     });

// //     /* */

// //     // const commentsBlock = createElement("div", { class: "post-comments" }, [
// //     //     createElement("h4", {}, ["💬 Comments"]),
// //     //     createElement("p", {}, ["(Coming soon...)"])
// //     // ]);

// //     const commentsBlock = createElement("div", { class: "post-comments" }, [
// //         createElement("h4", {}, ["💬 Comments"]),
// //         commentButton
// //     ]);

// //     contentContainer.append(postContainer, commentsBlock);
// // }

// // function openLightbox(imgUrl) {
// //     const overlay = createElement("div", { class: "lightbox" });
// //     const img = createElement("img", { src: imgUrl });
// //     const close = createElement("button", { class: "lightbox-close" }, ["×"]);

// //     overlay.addEventListener("click", (e) => {
// //         if (e.target === overlay || e.target === close) overlay.remove();
// //     });

// //     overlay.append(img, close);
// //     document.body.appendChild(overlay);
// // }
