import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";
import { formatRelativeTime } from "../../utils/dateUtils.js";
import { editPost } from "./createOrEditPost.js";
import { createCommentsSection } from "../comments/comments.js";
import { getState } from "../../state/state.js";
import { userProfileCard } from "./userProfileCard.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Notify from "../../components/ui/Notify.mjs";
import Imagex from "../../components/base/Imagex.js";
import Sightbox from "../../components/ui/SightBox.mjs"; // ✅ Import lightbox

export async function displayPost(isLoggedIn, postId, container) {
  container.innerHTML = "";
  const contentContainer = createElement("div", { class: "postpage" });
  container.appendChild(contentContainer);

  let resp;
  try {
    resp = await apiFetch(`/posts/${encodeURIComponent(postId)}`);
  } catch (err) {
    contentContainer.appendChild(createElement("p", {}, ["⚠️ Failed to load post."]));
    console.error(err);
    return;
  }

  const post = resp?.post;
  if (!post) {
    contentContainer.appendChild(createElement("p", {}, ["⚠️ Post not found."]));
    return;
  }

  const postContainer = createElement("div", { class: "post-detail" });
  postContainer.appendChild(renderHeader(post));

  const content = createElement("div", { class: "post-body" });

  let imageGroup = [];
  (post.blocks || []).forEach((block, index) => {
    if (block.type === "text" && block.content?.trim()) {
      if (imageGroup.length) {
        content.appendChild(renderImageGroup(imageGroup));
        imageGroup = [];
      }
      content.appendChild(createElement("p", {}, [block.content.trim()]));
    } else if (block.type === "image" && block.url) {
      imageGroup.push(block);
      const nextBlock = post.blocks[index + 1];
      if (!nextBlock || nextBlock.type !== "image") {
        content.appendChild(renderImageGroup(imageGroup));
        imageGroup = [];
      }
    }
  });

  if (imageGroup.length) {
    content.appendChild(renderImageGroup(imageGroup));
  }

  if (!content.children.length) {
    content.appendChild(createElement("p", {}, ["No content"]));
  }

  postContainer.appendChild(content);

  if (Array.isArray(post.tags) && post.tags.length) {
    postContainer.appendChild(renderTags(post.tags));
  }

  const avatarUrl = resolveImagePath(EntityType.USER, PictureType.THUMB, post.createdBy);
  postContainer.appendChild(
    userProfileCard({
      username: post.createdBy || "anonymous",
      bio: "",
      avatarUrl,
      postCount: 0,
      isFollowing: false
    })
  );

  if (isLoggedIn && post.createdBy) {
    postContainer.appendChild(renderPostActions(post.postid, isLoggedIn, contentContainer));
  }

  const commentToggle = createElement("button", {
    class: "toggle-comments btn btn-link"
  }, ["💬 Show Comments"]);

  let commentsEl = null;
  let commentsVisible = false;

  commentToggle.addEventListener("click", () => {
    if (!commentsVisible) {
      commentsEl = createCommentsSection(
        post.postid,
        post.comments || [],
        "blogpost",
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
      `👤 ${post.createdBy || "Anonymous"} • `,
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
    }, "buttonx btn-warning"),
    Button("🗑️ Delete", "delete-post", {
      click: async () => {
        if (confirm("Are you sure you want to delete this post?")) {
          try {
            await apiFetch(`/posts/post/${encodeURIComponent(postId)}`, "DELETE");
            Notify("✅ Post deleted.", { type: "success", duration: 3000, dismissible: true });
            navigate("/posts");
          } catch (err) {
            Notify("❌ Failed to delete post.", { type: "error", duration: 3000, dismissible: true });
            console.error(err);
          }
        }
      }
    }, "buttonx btn-danger")
  ]);
}

// ✅ Image group renderer with Zoombox integration
function renderImageGroup(images) {
  const group = createElement("div", { class: "image-group" });
  images.forEach(img => {
    const src = resolveImagePath(EntityType.POST, PictureType.PHOTO, img.url);
    const imgEl = Imagex({
      src,
      alt: img.alt || "Post Image",
      // style: "width: 100%; border-radius: 6px; cursor: zoom-in;"
    });
    imgEl.addEventListener("click", () => Sightbox(src, "image"));
    group.appendChild(imgEl);
  });
  return group;
}
