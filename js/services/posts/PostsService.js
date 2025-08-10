import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { SRC_URL } from "../../state/state.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";


export async function displayPosts(container, isLoggedIn) {
  renderPostsPage(container);
}

async function renderPostsPage(container) {
  container.innerHTML = "";

  const postsWrapper = createElement("div", { class: "posts-wrapper" });
  container.appendChild(postsWrapper);

  const postsAside = createElement("aside", { class: "posts-aside" });
  const postsMain = createElement("div", { class: "posts-main" });
  postsWrapper.appendChild(postsMain);
  postsWrapper.appendChild(postsAside);

  postsAside.appendChild(createElement("h3",{},["Actions"]));
  const createBtn = Button("Create Post", "crtbtn-allposts", {
    click: () => {
      navigate("/create-post");
    }
  });
  postsAside.appendChild(createBtn);

  postsMain.appendChild(createElement("h2", {}, ["All Posts"]));

  const controls = createElement("div", { class: "post-controls" });

  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search posts...",
    class: "post-search"
  });
  controls.appendChild(searchInput);

  const sortSelect = createElement("select", { class: "post-sort" }, [
    createElement("option", { value: "date" }, ["Sort by Date"]),
    createElement("option", { value: "title" }, ["Sort by Title"])
  ]);
  controls.appendChild(sortSelect);

  const chipContainer = createElement("div", { class: "category-chips" });

  postsMain.appendChild(controls);
  postsMain.appendChild(chipContainer);
  // postsAside.appendChild(controls);
  // postsAside.appendChild(chipContainer);

  const contentArea = createElement("div", {
    id: "posts",
    class: "hvflex"
  });
  postsMain.appendChild(contentArea);

  try {
    const resp = await apiFetch("/posts?page=1&limit=1000");
    const posts = Array.isArray(resp) ? resp : [];

    if (posts.length === 0) {
      contentArea.appendChild(createElement("p", {}, ["No posts available."]));
      return;
    }

    const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];
    const selectedCategory = { value: null };

    categories.forEach(cat => {
      const chip = createElement("button", {
        class: "category-chip",
        onclick: () => {
          selectedCategory.value = selectedCategory.value === cat ? null : cat;
          renderFilteredPosts();
        }
      }, [cat]);
      chipContainer.appendChild(chip);
    });

    searchInput.addEventListener("input", renderFilteredPosts);
    sortSelect.addEventListener("change", renderFilteredPosts);

    function renderFilteredPosts() {
      const keyword = searchInput.value.toLowerCase();
      const sortBy = sortSelect.value;

      const filtered = posts
        .filter(post => {
          const matchesCategory = !selectedCategory.value || post.category === selectedCategory.value;
          const matchesKeyword =
            post.title?.toLowerCase().includes(keyword) ||
            post.content?.toLowerCase().includes(keyword);
          return matchesCategory && matchesKeyword;
        })
        .sort((a, b) => {
          if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
          if (sortBy === "title") return a.title.localeCompare(b.title);
          return 0;
        });

      contentArea.innerHTML = "";
      filtered.forEach(p => contentArea.appendChild(createPostCard(p)));
    }

    renderFilteredPosts();

  } catch (err) {
    console.error("Error fetching posts", err);
    contentArea.appendChild(
      createElement("p", { class: "error-text" }, ["Failed to load posts."])
    );
  }
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
      new Date(post.createdAt).toLocaleString()
    ])
  ]);

  const postLink = createElement("a", { href: `/post/${post.postid}` }, [
    createElement("img", {
      src: resolveImagePath(EntityType.POST, PictureType.THUMB, post.imagePaths[0]),
      alt: `${post.title || "Untitled"} Image`,
      loading: "lazy",
      style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
    }),
    postInfo
  ]);

  return createElement("div", { class: "post-card" }, [postLink]);
}
