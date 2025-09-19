import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import Imagex from "../../components/base/Imagex.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { filterItems, sortItems, debounce } from "../../utils/listUtils.js";

// --- display all posts ---
export async function displayPosts(container, isLoggedIn) {
  renderPostsPage(container);
}

async function renderPostsPage(container) {
  container.replaceChildren();

  const postsWrapper = createElement("div", { class: "posts-wrapper" });
  container.appendChild(postsWrapper);

  const postsAside = createElement("aside", { class: "posts-aside" });
  const postsMain = createElement("div", { class: "posts-main" });
  postsWrapper.appendChild(postsMain);
  postsWrapper.appendChild(postsAside);

  // aside actions
  postsAside.appendChild(createElement("h3", {}, ["Actions"]));
  postsAside.appendChild(
    Button("Create Post", "crtbtn-allposts", { click: () => navigate("/create-post") })
  );

  // heading
  postsMain.appendChild(createElement("h2", {}, ["All Posts"]));

  // controls
  const controls = createElement("div", { class: "post-controls" });
  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search posts...",
    class: "post-search"
  });
  const sortSelect = createElement("select", { class: "post-sort" }, [
    createElement("option", { value: "date" }, ["Sort by Date"]),
    createElement("option", { value: "title" }, ["Sort by Title"])
  ]);
  controls.appendChild(searchInput);
  controls.appendChild(sortSelect);

  const chipContainer = createElement("div", { class: "category-chips" });
  postsMain.appendChild(controls);
  postsMain.appendChild(chipContainer);

  const contentArea = createElement("div", { id: "posts", class: "postscon" });
  postsMain.appendChild(contentArea);

  try {
    const resp = await apiFetch("/posts?page=1&limit=100");
    const posts = Array.isArray(resp?.posts) ? resp.posts : [];

    if (posts.length === 0) {
      contentArea.appendChild(createElement("p", {}, ["No posts available."]));
      return;
    }

    // category chips
    const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];
    const selectedCategory = { value: null };

    categories.forEach(cat => {
      const chip = createElement("button", {
        class: "category-chip",
        onclick: () => {
          selectedCategory.value = selectedCategory.value === cat ? null : cat;
          renderFilteredPosts();
          updateActiveChips();
        }
      }, [cat]);
      chipContainer.appendChild(chip);
    });

    function updateActiveChips() {
      Array.from(chipContainer.children).forEach(btn => {
        btn.classList.toggle("active", btn.textContent === selectedCategory.value);
      });
    }

    // debounced search
    const debouncedFilter = debounce(renderFilteredPosts, 300);
    searchInput.addEventListener("input", debouncedFilter);
    sortSelect.addEventListener("change", renderFilteredPosts);

    function renderFilteredPosts() {
      const filtered = sortItems(
        filterItems(posts, {
          keyword: searchInput.value,
          category: selectedCategory.value
        }),
        sortSelect.value
      );

      contentArea.replaceChildren();
      if (!filtered.length) {
        contentArea.appendChild(createElement("p", {}, ["No matching posts."]));
        return;
      }

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

  const postLink = createElement("a", { href: `/post/${encodeURIComponent(post.postid)}` }, [
    Imagex({
      src: post.thumb
        ? resolveImagePath(EntityType.POST, PictureType.THUMB, post.thumb)
        : "/default-thumb.png",
      alt: `${post.title || "Untitled"} Image`,
      loading: "lazy",
    }),
    postInfo
  ]);

  return createElement("div", { class: "post-card" }, [postLink]);
}
