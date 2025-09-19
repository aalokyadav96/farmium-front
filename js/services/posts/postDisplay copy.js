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

// --- Main Export ---
export async function displayPost(isLoggedIn, postId, container) {
  container.replaceChildren();
  const page = createElement("div", { class: "postpage" });
  container.appendChild(page);

  let post;
  try {
    const resp = await apiFetch(`/posts/post/${encodeURIComponent(postId)}`);
    post = resp?.post;
  } catch (err) {
    return page.appendChild(renderError("⚠️ Failed to load post."));
  }

  if (!post) {
    return page.appendChild(renderError("⚠️ Post not found."));
  }

  const body = renderBody(post);
  const tags = post.tags?.length ? renderTags(post.tags) : null;
  const profile = renderProfile(post);
  const actions = isLoggedIn && post.createdBy
    ? renderPostActions(post.postid, isLoggedIn, page)
    : null;
  const comments = renderComments(post);

  page.replaceChildren(
    renderHeader(post),
    body,
    ...(tags ? [tags] : []),
    profile,
    ...(actions ? [actions] : []),
    comments
  );
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

  // Group consecutive images
  const blocks = post.blocks || [];
  let imageBuffer = [];
  const flushImages = () => {
    if (imageBuffer.length) {
      content.appendChild(renderImageGroup(imageBuffer));
      imageBuffer = [];
    }
  };

  blocks.forEach((block, i) => {
    if (block.type === "text" && block.content?.trim()) {
      flushImages();
      content.appendChild(createElement("p", {}, [block.content.trim()]));
    } else if (block.type === "image" && block.url) {
      imageBuffer.push(block);
      const next = blocks[i + 1];
      if (!next || next.type !== "image") flushImages();
    }
  });
  flushImages();

  if (!content.childElementCount) {
    content.appendChild(createElement("p", {}, ["No content"]));
  }

  return content;
}

// put near top of file
const PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function renderImageGroup(images) {
  const group = createElement("div", { class: "image-group" });

  const supportsNativeLazy = 'loading' in HTMLImageElement.prototype;
  let observer = null;
  if (!supportsNativeLazy && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const real = img.getAttribute("data-src");
        if (real) {
          img.src = real;
          img.removeAttribute("data-src");
        }
        obs.unobserve(img);
      });
    }, { rootMargin: "200px 0px" });
  }

  images.forEach(img => {
    const realSrc = resolveImagePath(EntityType.POST, PictureType.PHOTO, img.url);

    // Ensure Imagex always receives a non-empty src
    const imgEl = Imagex({
      src: supportsNativeLazy ? realSrc : PLACEHOLDER,
      alt: img.alt || "Post Image",
      classes: "post-image"
    });

    // accessibility / perf hints
    imgEl.setAttribute("loading", "lazy");
    imgEl.decoding = "async";

    // fade-in
    imgEl.style.opacity = "0";
    imgEl.style.transition = "opacity 220ms ease";

    if (supportsNativeLazy) {
      // native lazy: we already set the real src, wait for load to fade in
      imgEl.addEventListener("load", () => { imgEl.style.opacity = "1"; }, { once: true });
    } else {
      // fallback: leave placeholder and set data-src so observer can swap it in
      imgEl.setAttribute("data-src", realSrc);

      if (observer) {
        observer.observe(imgEl);
        // when swapped in by observer, fade-in on load
        imgEl.addEventListener("load", () => { imgEl.style.opacity = "1"; }, { once: true });
      } else {
        // no IntersectionObserver: load immediately as last resort
        imgEl.src = realSrc;
        imgEl.addEventListener("load", () => { imgEl.style.opacity = "1"; }, { once: true });
      }
    }

    // Sightbox should open the real image
    imgEl.addEventListener("click", () => Sightbox(realSrc, "image"));

    group.appendChild(imgEl);
  });

  return group;
}


function renderTags(tags) {
  return createElement("div", { class: "post-tags" },
    tags.map(tag => createElement("span", { class: "tag" }, [`#${tag}`]))
  );
}

function renderProfile(post) {
  const avatarUrl = resolveImagePath(EntityType.USER, PictureType.THUMB, post.createdBy);
  return userProfileCard({
    username: post.createdBy || "anonymous",
    bio: "",
    avatarUrl,
    postCount: 0,
    isFollowing: false,
    userid: post.createdBy,
  });
}

function renderPostActions(postId, isLoggedIn, page) {
  const editBtn = Button("✏️ Edit", "", {
    click: () => {
      page.replaceChildren();
      editPost(isLoggedIn, postId, page);
    }
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
