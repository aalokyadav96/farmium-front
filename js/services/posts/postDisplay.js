
import { createElement } from "../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import Button from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";
import { formatRelativeTime } from "../../utils/dateUtils.js";
import { editPost } from "./editPost.js";
import { createCommentsSection } from "../comments/comments.js";
import { getState } from "../../state/state.js";
import { userProfileCard } from "./userProfileCard.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Carousel from "../../components/ui/Carousel.mjs";
import Notify from "../../components/ui/Notify.mjs";

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

  // if (post.imagePaths?.length) {
  //   const imgarray = post.imagePaths.map(path => ({
  //     // src: resolveImagePath(EntityType.POST, PictureType.THUMB, path),
  //     src: path,
  //     alt: post.title || "Post Image"
  //   }));
    

  // }
    if (post.imagePaths?.length) {
      const imgarray = post.imagePaths.map(path => ({
        src: resolveImagePath(EntityType.POST, PictureType.PHOTO, path),
        alt: post.title || "Post Image"
      }));
      postContainer.appendChild(Carousel(imgarray));
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
        post.postid,
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
