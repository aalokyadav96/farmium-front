import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import Imagex from "../../components/base/Imagex.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { displayListingPage } from "../../utils/displayListingPage.js";

export function displayPosts(container, isLoggedIn) {
  container.replaceChildren();

  displayListingPage(container, {
    title: "All Posts",
    apiEndpoint: "/posts?page=1&limit=100",
    cardBuilder: createPostCard,
    type: "posts",
    pageSize: 10,
    sidebarActions: aside => {
      aside.appendChild(createElement("h3", {}, ["Actions"]));
      if (isLoggedIn) {
        aside.append(
          Button(
            "Create Post",
            "crtbtn-allposts",
            { click: () => navigate("/create-post") },
            "buttonx"
          )
        );
      }
    }
  });
}

function createPostCard(post) {
  const postInfo = createElement("div", { class: "post-info" }, [
    createElement("h3", {}, [post.title || "Untitled"]),
    createElement("p", {}, [
      createElement("strong", {}, ["Category: "]),
      post.category || "-"
    ]),
    createElement("p", {}, [
      createElement("strong", {}, ["Subcategory: "]),
      post.subcategory || "-"
    ]),
    createElement("p", {}, [
      createElement("strong", {}, ["Posted on: "]),
      post.createdAt ? new Date(post.createdAt).toLocaleString() : "-"
    ]),
    createElement("p", {}, [
      createElement("strong", {}, ["Created By: "]),
      post.createdBy || "-"
    ])
  ]);

  const postThumb = Imagex({
    src: post.thumb
      ? resolveImagePath(EntityType.POST, PictureType.THUMB, post.thumb)
      : "/default-thumb.png",
    alt: `${post.title || "Untitled"} Image`,
    loading: "lazy",
    style: "width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px;"
  });

  const postCard = createElement("div", { class: "post-card" }, [
    postThumb,
    postInfo
  ]);

  return createElement("a", {
    href: "#",
    events: {
      click: e => {
        e.preventDefault();
        navigate(`/post/${encodeURIComponent(post.postid)}`);
      }
    }
  }, [postCard]);
}
