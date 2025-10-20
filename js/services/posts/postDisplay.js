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
import Sightbox from "../../components/ui/Sightbox_zoom.mjs";

// --- Shared constants ---
const PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const lazyObserver = ('loading' in HTMLImageElement.prototype || typeof IntersectionObserver === 'undefined')
  ? null
  : new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const real = img.dataset.src;
        if (real) {
          img.src = real;
          img.removeAttribute("data-src");
          img.addEventListener("load", () => img.style.opacity = "1", { once: true });
        }
        lazyObserver.unobserve(img);
      });
    }, { rootMargin: "200px 0px" });

const avatarCache = new Map();
function getAvatar(userId) {
  if (!avatarCache.has(userId)) {
    avatarCache.set(userId, resolveImagePath(EntityType.USER, PictureType.THUMB, userId));
  }
  return avatarCache.get(userId);
}

// --- Main Export ---
export async function displayPost(isLoggedIn, postId, container) {
  container.replaceChildren();
  const page = createElement("div", { class: "postpage" });

  let post;
  try {
    const resp = await apiFetch(`/posts/post/${encodeURIComponent(postId)}`);
    post = resp?.post;
  } catch (err) {
    page.appendChild(renderError("⚠️ Failed to load post."));
    container.appendChild(page);
    return;
  }

  if (!post) {
    page.appendChild(renderError("⚠️ Post not found."));
    container.appendChild(page);
    return;
  }

  const frag = document.createDocumentFragment();
  frag.append(renderHeader(post));
  frag.append(renderBody(post));
  if (post.tags?.length) frag.append(renderTags(post.tags));
  frag.append(renderProfile(post));
  if (isLoggedIn && post.createdBy == getState("user")) frag.append(renderPostActions(post.postid, isLoggedIn, page));
  frag.append(renderComments(post));

  page.appendChild(frag);
  container.appendChild(page);
}

// --- Renderers ---
function renderError(msg) {
  return createElement("p", {}, [msg]);
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

function renderBody(post) {
  const content = createElement("div", { class: "post-body" });
  const blocks = post.blocks || [];
  const fragment = document.createDocumentFragment();
  let imageBuffer = [];

  const flushImages = () => {
    if (imageBuffer.length) {
      fragment.append(renderImageGroup(imageBuffer));
      imageBuffer = [];
    }
  };

  blocks.forEach(block => {
    if (block.type === "image" && block.url) {
      imageBuffer.push(block);
    } else {
      flushImages();
      if (block.type === "text" && block.content?.trim()) {
        fragment.append(createElement("p", {}, [block.content.trim()]));
      }
    }
  });
  flushImages();

  if (!fragment.childElementCount) fragment.append(createElement("p", {}, ["No content"]));
  content.append(fragment);
  return content;
}

function renderImageGroup(images) {
  const group = createElement("div", { class: "image-group" });

  images.forEach(img => {
    const realSrc = resolveImagePath(EntityType.POST, PictureType.PHOTO, img.url);
    console.log(realSrc);
    const imgEl = Imagex({
      src: realSrc,
      alt: img.alt || "Post Image",
      classes: "post-image"
    });

    // Delegate click later
    group.appendChild(imgEl);
  });

  // Delegate Sightbox click to the group
  group.addEventListener("click", e => {
    const img = e.target.closest(".post-image");
    if (!img) return;
    const src = img.dataset.src || img.src;
    Sightbox(src, "image");
  });

  return group;
}

function renderTags(tags) {
  return createElement("div", { class: "post-tags" },
    tags.map(tag => createElement("span", { class: "tag" }, [`#${tag}`]))
  );
}

function renderProfile(post) {
  const avatarUrl = getAvatar(post.createdBy);
  return userProfileCard({
    username: post.createdBy || "anonymous",
    bio: "",
    avatarUrl,
    postCount: 0,
    isFollowing: false,
    entityId: post.postid,
    entityType: "post",
    entityName: post.title,
  });
}

function renderPostActions(postId, isLoggedIn, page) {
  const editBtn = Button("✏️ Edit", "", {
    click: () => editPost(isLoggedIn, postId, page)
  }, "buttonx btn-warning");

  const deleteBtn = Button("🗑️ Delete", "delete-post", {
    click: async () => {
      if (!confirm("Are you sure you want to delete this post?")) return;
      try {
        await apiFetch(`/posts/post/${encodeURIComponent(postId)}`, "DELETE");
        Notify("✅ Post deleted.", { type: "success", duration: 3000, dismissible: true });
        navigate("/posts");
      } catch (err) {
        Notify("❌ Failed to delete post.", { type: "error", duration: 3000, dismissible: true });
        console.error(err);
      }
    }
  }, "buttonx btn-danger");

  return createElement("div", { class: "post-actions" }, [editBtn, deleteBtn]);
}

function renderComments(post) {
  const wrapper = createElement("div", { class: "post-comments" });
  const toggle = createElement("button", { class: "toggle-comments btn btn-link" }, ["💬 Show Comments"]);

  let commentsEl = null;
  let visible = false;

  toggle.addEventListener("click", () => {
    if (!visible) {
      commentsEl = createCommentsSection(post.postid, post.comments || [], "blogpost", getState("user"));
      wrapper.appendChild(commentsEl);
      toggle.textContent = "💬 Hide Comments";
    } else {
      commentsEl?.remove();
      toggle.textContent = "💬 Show Comments";
    }
    visible = !visible;
  });

  wrapper.append(createElement("h4", {}, ["Comments"]), toggle);
  return wrapper;
}