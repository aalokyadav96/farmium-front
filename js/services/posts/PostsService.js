import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { SRC_URL } from "../../state/state.js";

export async function displayPosts(content, isLoggedIn) {
  renderPostsPage(content);
}

async function renderPostsPage(container) {
  container.innerHTML = "";

  const createBtn = Button("Create Post", "crtbtn-allposts",{
    click : () => {
      navigate("/create-post");
    }
  });
  container.appendChild(createBtn);

  const heading = createElement("h2", {}, ["All Posts"]);
  container.appendChild(heading);

  const controls = createElement("div", { class: "post-controls" }, []);
  container.appendChild(controls);

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

  const chipContainer = createElement("div", { class: "category-chips" }, []);
  container.appendChild(chipContainer);

  const contentArea = createElement("div", {
    id: "posts",
    class: "hvflex"
  });
  container.appendChild(contentArea);

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
        .filter(p => {
          const matchesCategory = !selectedCategory.value || p.category === selectedCategory.value;
          const matchesKeyword =
            p.title.toLowerCase().includes(keyword) ||
            (p.content || "").toLowerCase().includes(keyword);
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
  const imageUrl = post.imagePaths?.[0]
    ? `${SRC_URL}${post.imagePaths[0]}`
    : `${SRC_URL}/default-post.jpg`;

  return createElement("a", {"href":`/post/${post._id}`}, [createElement("div", { class: "post-card" }, [
    createElement("img", {
      src: imageUrl,
      alt: `${post.title} Image`,
      loading: "lazy",
      style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
    }),
    createElement("div", { class: "post-info" }, [
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
      ]),
      // createElement("p", {}, [post.content || "No content available."])
    ])
  ])]);
}

// import { createElement } from "../../components/createElement.js";
// import { SRC_URL, apiFetch } from "../../api/api.js";
// import { createPost } from "./createPost.js";
// import { navigate } from "../../routes/index.js";
// import Button from "../../components/base/Button.js";
// import { formatRelativeTime } from "../../utils/dateUtils.js";

// let posts = [];
// let filteredPosts = [];
// let searchTerm = "";
// let activeCategory = "All";
// let sortOption = "date-desc";
// let currentPage = 1;
// const perPage = 5;

// let debounceTimer;

// export async function displayPosts(content, isLoggedIn) {
//     content.innerHTML = "";
//     const contentContainer = createElement('div', { class: "postscon" }, []);
//     content.appendChild(contentContainer);

//     const headerBlock = createElement("div", { class: "post-page-header" });

//     if (isLoggedIn) {
//         const createBtn = Button("➕ Create Post", "create-post", {
//             click: () => createPost(isLoggedIn, contentContainer)
//         }, "btn btn-primary");
//         headerBlock.appendChild(createBtn);
//     }

//     // Search input
//     const searchInput = createElement("input", {
//         type: "search",
//         placeholder: "🔍 Search posts...",
//         class: "post-search"
//     });
//     searchInput.addEventListener("input", e => {
//         clearTimeout(debounceTimer);
//         debounceTimer = setTimeout(() => {
//             searchTerm = e.target.value.toLowerCase();
//             currentPage = 1;
//             filterAndRender();
//         }, 300);
//     });
//     headerBlock.appendChild(searchInput);

//     // Sort select
//     const sortSelect = createElement("select", {}, []);
//     [
//         ["date-desc", "Newest"],
//         ["date-asc", "Oldest"],
//         ["title-asc", "Title A-Z"],
//         ["title-desc", "Title Z-A"]
//     ].forEach(([val, label]) => {
//         const opt = createElement("option", { value: val }, [label]);
//         if (val === sortOption) opt.selected = true;
//         sortSelect.appendChild(opt);
//     });
//     sortSelect.addEventListener("change", e => {
//         sortOption = e.target.value;
//         currentPage = 1;
//         filterAndRender();
//     });
//     headerBlock.appendChild(sortSelect);

//     // Category filter (buttons)
//     const categoryBar = createElement("div", { class: "post-category-bar" });
//     contentContainer.append(headerBlock, categoryBar);

//     try {
//         posts = await apiFetch("/posts");
//     } catch (err) {
//         contentContainer.appendChild(createElement("p", {}, ["❌ Failed to load posts."]));
//         console.error(err);
//         return;
//     }

//     if (!posts.length) {
//         contentContainer.appendChild(createElement("p", {}, ["📭 No posts available."]));
//         return;
//     }

//     const categories = Array.from(new Set(posts.map(p => p.category || "Uncategorized")));
//     categories.unshift("All");

//     categories.forEach(cat => {
//         const btn = createElement("button", {
//             class: cat === activeCategory ? "active" : ""
//         }, [cat]);
//         btn.addEventListener("click", () => {
//             activeCategory = cat;
//             currentPage = 1;
//             filterAndRender();
//             categoryBar.querySelectorAll("button").forEach(b => b.classList.remove("active"));
//             btn.classList.add("active");
//         });
//         categoryBar.appendChild(btn);
//     });

//     const postList = createElement("div", { class: "post-list" });
//     const loadMoreBtn = Button("⬇️ Load More", "load-more", {
//         click: () => {
//             currentPage++;
//             renderPosts(postList);
//         }
//     }, "btn btn-secondary");

//     contentContainer.appendChild(postList);
//     contentContainer.appendChild(loadMoreBtn);

//     filterAndRender();

//     function filterAndRender() {
//         filteredPosts = posts.filter(p => {
//             const matchSearch = searchTerm === "" ||
//                 p.title.toLowerCase().includes(searchTerm) ||
//                 p.content?.toLowerCase().includes(searchTerm);

//             const matchCategory = activeCategory === "All" || p.category === activeCategory;

//             return matchSearch && matchCategory;
//         });

//         sortFiltered();
//         renderPosts(postList, true);

//         if ((currentPage * perPage) >= filteredPosts.length) {
//             loadMoreBtn.setAttribute("disabled", true);
//         } else {
//             loadMoreBtn.removeAttribute("disabled");
//         }
//     }

//     function sortFiltered() {
//         filteredPosts.sort((a, b) => {
//             if (sortOption === "title-asc") return a.title.localeCompare(b.title);
//             if (sortOption === "title-desc") return b.title.localeCompare(a.title);
//             if (sortOption === "date-asc") return new Date(a.createdAt) - new Date(b.createdAt);
//             return new Date(b.createdAt) - new Date(a.createdAt);
//         });
//     }

//     function renderPosts(list, reset = false) {
//         if (reset) list.innerHTML = "";

//         const pagePosts = filteredPosts.slice(0, currentPage * perPage);
//         pagePosts.forEach(post => {
//             const postCard = createElement("div", { class: "post-card" });

//             if (post.imagePaths?.length) {
//                 const thumb = createElement("img", {
//                     src: `${SRC_URL}/${post.imagePaths[0]}`,
//                     alt: post.title,
//                     class: "post-thumbnail",
//                     loading: "lazy"
//                 });
//                 postCard.appendChild(thumb);
//             }

//             postCard.appendChild(createElement("h3", {}, [post.title]));

//             const snippet = post.content?.split("\n").find(line => line.trim()) || "";
//             postCard.appendChild(createElement("p", { class: "post-snippet" }, [
//                 snippet.length > 100 ? snippet.slice(0, 100) + "…" : snippet
//             ]));

//             const meta = createElement("p", { class: "post-meta" }, [
//                 `📁 ${post.category || "Uncategorized"} › ${post.subcategory || "General"}`,
//                 ` | 👤 ${post.createdBy || "Anonymous"}`,
//                 post.createdAt ? ` | 🕒 ${formatRelativeTime(post.createdAt)}` : ""
//             ]);
//             postCard.appendChild(meta);

//             postCard.appendChild(Button("🔎 View", `view-${post._id}`, {
//                 click: () => navigate(`/post/${post._id}`)
//             }, "btn btn-secondary"));

//             list.appendChild(postCard);
//         });
//     }
// }

// // let posts = [];
// // let filteredPosts = [];
// // let searchTerm = "";
// // let activeCategory = "All";
// // let sortOption = "date-desc";
// // let currentPage = 1;
// // const perPage = 5;

// // //

// // // import { createElement } from "../../components/createElement.js";
// // // import { SRC_URL, apiFetch } from "../../api/api.js";
// // // import { createPost } from "./createPost.js";
// // // import { navigate } from "../../routes/index.js";
// // // import Button from "../../components/base/Button.js";
// // // import { formatRelativeTime } from "../../utils/dateUtils.js"; // optional helper

// // // export async function displayPosts(content, isLoggedIn) {
// // //     content.innerHTML = "";
// // //     let contentContainer = createElement('div',{"class":"postscon"},[]);
// // //     content.appendChild(contentContainer);

// // //     const headerBlock = createElement("div", { class: "post-page-header" });

// // //     if (isLoggedIn) {
// // //         const createBtn = Button("➕ Create Post", "create-post", {
// // //             click: () => createPost(isLoggedIn, contentContainer)
// // //         }, "btn btn-primary");
// // //         headerBlock.appendChild(createBtn);
// // //     }

// // //     const searchInput = createElement("input", {
// // //         type: "search",
// // //         placeholder: "🔍 Search posts (coming soon)",
// // //         class: "post-search",
// // //         disabled: true
// // //     });

// // //     headerBlock.appendChild(searchInput);
// // //     contentContainer.appendChild(headerBlock);

// // //     let posts = [];
// // //     try {
// // //         posts = await apiFetch("/posts");
// // //     } catch (err) {
// // //         contentContainer.appendChild(createElement("p", {}, ["❌ Failed to load posts."]));
// // //         console.error(err);
// // //         return;
// // //     }

// // //     if (!posts.length) {
// // //         contentContainer.appendChild(createElement("p", {}, ["📭 No posts available."]));
// // //         return;
// // //     }

// // //     const postList = createElement("div", { class: "post-list" });

// // //     posts.forEach(post => {
// // //         const postCard = createElement("div", { class: "post-card" });

// // //         // Thumbnail using imagePaths
// // //         if (post.imagePaths?.length) {
// // //             const thumb = createElement("img", {
// // //                 src: `${SRC_URL}/${post.imagePaths[0]}`,
// // //                 alt: post.title,
// // //                 class: "post-thumbnail"
// // //             });
// // //             postCard.appendChild(thumb);
// // //         }

// // //         postCard.appendChild(createElement("h3", {}, [post.title]));

// // //         const snippet = post.content?.split("\n").find(line => line.trim()) || "";
// // //         postCard.appendChild(createElement("p", { class: "post-snippet" }, [
// // //             snippet.length > 100 ? snippet.slice(0, 100) + "…" : snippet
// // //         ]));

// // //         const meta = createElement("p", { class: "post-meta" }, [
// // //             `📁 ${post.category || "Uncategorized"} › ${post.subcategory || "General"}`,
// // //             ` | 👤 ${post.createdBy || "Anonymous"}`,
// // //             post.createdAt ? ` | 🕒 ${formatRelativeTime(post.createdAt)}` : ""
// // //         ]);
// // //         postCard.appendChild(meta);

// // //         postCard.appendChild(Button("🔎 View", `view-${post._id}`, {
// // //             click: () => navigate(`/post/${post._id}`)
// // //         }, "btn btn-secondary"));

// // //         postList.appendChild(postCard);
// // //     });

// // //     contentContainer.appendChild(postList);
// // // }

// // // import { createElement } from "../../components/createElement.js";
// // // import { apiFetch } from "../../api/api.js";
// // // import { createPost } from "./createPost.js";
// // // import { navigate } from "../../routes/index.js";
// // // import Button from "../../components/base/Button.js";
// // // import { formatRelativeTime } from "../../utils/dateUtils.js"; // optional helper

// // // export async function displayPosts(contentContainer, isLoggedIn) {
// // //     contentContainer.innerHTML = "";

// // //     const headerBlock = createElement("div", { class: "post-page-header" });

// // //     if (isLoggedIn) {
// // //         const createBtn = Button("➕ Create Post", "create-post", {
// // //             click: () => createPost(isLoggedIn, contentContainer)
// // //         }, "btn btn-primary");
// // //         headerBlock.appendChild(createBtn);
// // //     }

// // //     const searchInput = createElement("input", {
// // //         type: "search",
// // //         placeholder: "🔍 Search posts (coming soon)",
// // //         class: "post-search",
// // //         disabled: true
// // //     });

// // //     headerBlock.appendChild(searchInput);
// // //     contentContainer.appendChild(headerBlock);

// // //     let posts = [];
// // //     try {
// // //         posts = await apiFetch("/posts");
// // //     } catch (err) {
// // //         contentContainer.appendChild(createElement("p", {}, ["❌ Failed to load posts."]));
// // //         console.error(err);
// // //         return;
// // //     }

// // //     if (!posts.length) {
// // //         contentContainer.appendChild(createElement("p", {}, ["📭 No posts available."]));
// // //         return;
// // //     }

// // //     const postList = createElement("div", { class: "post-list" });

// // //     posts.forEach(post => {
// // //         const postCard = createElement("div", { class: "post-card" });

// // //         // Optional thumbnail preview
// // //         if (post.images?.length) {
// // //             const thumb = createElement("img", {
// // //                 src: post.images[0],
// // //                 alt: post.title,
// // //                 class: "post-thumbnail"
// // //             });
// // //             postCard.appendChild(thumb);
// // //         }

// // //         postCard.appendChild(createElement("h3", {}, [post.title]));

// // //         const snippet = post.content.split("\n").find(line => line.trim()) || "";
// // //         postCard.appendChild(createElement("p", { class: "post-snippet" }, [
// // //             snippet.length > 100 ? snippet.slice(0, 100) + "…" : snippet
// // //         ]));

// // //         const meta = createElement("p", { class: "post-meta" }, [
// // //             `📁 ${post.category} › ${post.subcategory}`,
// // //             ` | 👤 ${post.author?.name || "Anonymous"}`,
// // //             post.createdAt ? ` | 🕒 ${formatRelativeTime(post.createdAt)}` : ""
// // //         ]);
// // //         postCard.appendChild(meta);

// // //         if (post.tags?.length) {
// // //             const tagContainer = createElement("div", { class: "post-tags" });
// // //             post.tags.forEach(tag => {
// // //                 tagContainer.appendChild(createElement("span", { class: "tag" }, [`#${tag}`]));
// // //             });
// // //             postCard.appendChild(tagContainer);
// // //         }

// // //         postCard.appendChild(Button("🔎 View", `view-${post._id}`, {
// // //             click: () => navigate(`/post/${post._id}`)
// // //         }, "btn btn-secondary"));

// // //         postList.appendChild(postCard);
// // //     });

// // //     contentContainer.appendChild(postList);
// // // }
