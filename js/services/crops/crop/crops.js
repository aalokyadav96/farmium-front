import { navigate } from "../../../routes";
import { createElement } from "../../../components/createElement";
import { SRC_URL, apiFetch } from "../../../api/api";
import { guessCategoryFromName, createPromoLink } from "./displayCrops.helpers";

export async function displayCrops(contentContainer, isLoggedIn) {
  // tag filters remain static
  const tagFilters = ['Organic', 'Imported', 'Local', 'Bestseller'];
  let data = {};
  let activeTags = new Set();

  // 1️⃣ Fetch & categorize
  try {
    const { cropTypes = [] } = await apiFetch("/crops/types");
    const categorized = {};

    cropTypes.forEach(crop => {
      const category = guessCategoryFromName(crop.name);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push({
        ...crop,
        image: crop.imageUrl || "placeholder.jpg",
        category,
        tags: crop.tags || [],
        seasonMonths: crop.seasonMonths || []
      });
    });

    data = categorized;
  } catch (err) {
    contentContainer.innerHTML = "";
    const errorMsg = createElement("p", {}, [
      `Failed to load crops: ${err.message}`
    ]);
    contentContainer.appendChild(errorMsg);
    return;
  }

  // if no data at all
  if (!Object.keys(data).length) {
    contentContainer.innerHTML = "";
    contentContainer.appendChild(
      createElement("p", {}, ["No crops available."])
    );
    return;
  }

  // 2️⃣ Build layout
  contentContainer.innerHTML = "";
  const layout = createElement("div", { class: "catalogue-layout" });
  const main   = createElement("main",  { class: "catalogue-main" });
  const aside  = createElement("aside", { class: "catalogue-aside" });
  layout.append(main, aside);
  contentContainer.appendChild(layout);

  // 3️⃣ Top controls: search + sort + tag-chips
  const searchBox = createElement("input", {
    type: "text",
    placeholder: "Search crops…",
    class: "search-box"
  });

  const sortSelect = createElement("select", { class: "sort-box" }, [
    createElement("option", { value: "az" }, ["A → Z"]),
    createElement("option", { value: "za" }, ["Z → A"])
  ]);

  const controls = createElement("div", { class: "top-controls" }, [
    searchBox,
    sortSelect
  ]);

  const tagChips = createElement("div", { class: "tag-filters" });
  tagFilters.forEach(tag => {
    const chip = createElement("button", { class: "tag-chip" }, [tag]);
    chip.onclick = () => {
      chip.classList.toggle("active");
      chip.classList.contains("active") ? activeTags.add(tag) : activeTags.delete(tag);
      updateAllTabs();
    };
    tagChips.appendChild(chip);
  });

  main.append(controls, tagChips);

  // 4️⃣ Tabs & containers (dynamic!)
  const tabButtons  = createElement("div", { class: "tabs" });
  const tabsWrapper = createElement("div", { id: "catalogue-container" });
  main.append(tabButtons, tabsWrapper);

  // derive categories from fetched data
  const categories = Object.keys(data);
  const tabs       = {};
  let currentTab   = categories[0];

  categories.forEach((cat, i) => {
    // button
    const btn = createElement("button", {}, [
      `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${data[cat].length})`
    ]);
    btn.onclick = () => {
      currentTab = cat;
      showTab(cat);
      updateTab(cat);
    };
    if (i === 0) btn.classList.add("active");
    tabButtons.appendChild(btn);

    // content container
    const pane = createElement("div", {
      class: "tab-content",
      id: cat,
      style: `display: ${i === 0 ? "block" : "none"}`
    });
    tabs[cat] = pane;
    tabsWrapper.appendChild(pane);
  });

  // 5️⃣ Filtering & rendering
  function updateTab(category) {
    const crops = data[category] || [];
    const term  = searchBox.value.trim().toLowerCase();
    const sortBy = sortSelect.value;
    const container = tabs[category];
    container.innerHTML = "";

    // filter
    let visible = crops.filter(c =>
      c.name.toLowerCase().includes(term) &&
      [...activeTags].every(t => c.tags.includes(t))
    );

    // sort
    visible.sort((a, b) =>
      sortBy === "az"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    // render each
    visible.forEach(c => container.appendChild(renderCropCard(c)));
  }

  function updateAllTabs() {
    categories.forEach(cat => {
      updateTab(cat);
      tabs[cat].style.display = cat === currentTab ? "block" : "none";
    });
    // update tab button styles
    Array.from(tabButtons.children).forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.textContent.toLowerCase().startsWith(currentTab)
      );
    });
  }

  function showTab(cat) {
    categories.forEach(c => {
      tabs[c].style.display = c === cat ? "block" : "none";
    });
    Array.from(tabButtons.children).forEach(btn =>
      btn.classList.toggle("active", btn.textContent.toLowerCase().startsWith(cat))
    );
  }

  // 6️⃣ Card renderer & seasonal helper
  function renderCropCard(c) {
    const card = createElement("div", { class: "crop-card" });
    const img  = createElement("img", {
      src: `${SRC_URL}/${c.image}`,
      alt: c.name,
      loading: "lazy"
    });

    const title = createElement("h4", {}, [c.name]);
    const info  = createElement("p", { class: "crop-info" }, [
      `₹${c.minPrice} - ₹${c.maxPrice} per ${c.unit}`,
      ` • ${c.availableCount} listing(s)`
    ]);

    const trend = createElement("div", { class: "price-chart-placeholder" }, [
      "📈 Price Trend"
    ]);

    const seasonNote = createElement("p", {
      class: `season-indicator ${
        isSeasonal(c) ? "in-season" : "off-season"
      }`
    }, [
      isSeasonal(c) ? "🟢 In Season" : "🔴 Off Season"
    ]);

    const tagWrap = createElement("div", { class: "tag-wrap" });
    c.tags.forEach(t => {
      tagWrap.appendChild(createElement("span", { class: "tag-pill" }, [t]));
    });

    const btn = createElement("button", {}, ["View Farms"]);
    btn.onclick = () => navigate(`/crop/${c.name.toLowerCase()}`);

    card.append(img, title, info, trend, seasonNote, tagWrap, btn);
    return card;
  }

  function isSeasonal(c) {
    const now = new Date().getMonth() + 1;
    return c.seasonMonths.includes(now);
  }

  // initial render
  updateAllTabs();

  // 7️⃣ Sidebar promos (unchanged)
  aside.append(
    createElement("h3", {}, ["🌟 Featured Crops"]),
    createElement("div", { class: "featured-list" }),
    createElement("h3", {}, ["💸 Deals"]),
    createElement("div", { class: "promo-box" }, [
      createPromoLink("🧃 Buy 2 kg Tomatoes, get 10% off!", "Tomato", data),
      createPromoLink("🥭 Fresh Mangoes now ₹40/kg!", "Mango", data)
    ]),
    createElement("h3", {}, ["📅 Seasonal Picks"]),
    createElement("div", { class: "promo-box" }, [
      createElement("p", {}, ["🍉 Watermelons are ripe this week"]),
      createElement("p", {}, ["🌽 Baby corn harvest starting soon"])
    ])
  );
}

// import { navigate } from "../../../routes";
// import { createElement } from "../../../components/createElement";
// import { SRC_URL, apiFetch } from "../../../api/api";
// import { guessCategoryFromName, createPromoLink } from "./displayCrops.helpers";

// export async function displayCrops(contentContainer, isLoggedIn) {
//   // const categories = ['fruits', 'vegetables', 'grains', 'millets', 'flowers'];
//   const tagFilters = ['Organic', 'Imported', 'Local', 'Bestseller'];

//   let data = {};
//   let activeTags = new Set();

//   const categories = Object.keys(data);

//   try {
//     const response = await apiFetch("/crops/types");
//     const cropsArray = response.cropTypes || [];
//     const categorized = {};

//     cropsArray.forEach(crop => {
//       const category = guessCategoryFromName(crop.name);
//       if (!categorized[category]) categorized[category] = [];
//       categorized[category].push({
//         ...crop,
//         image: crop.imageUrl || "placeholder.jpg",
//         category,
//         tags: crop.tags || [],
//         seasonMonths: crop.seasonMonths || []
//       });
//     });

//     data = categorized;
//   } catch (err) {
//     contentContainer.innerHTML = "";
//     const errorMsg = createElement("p", {}, [`Failed to load crops: ${err.message}`]);
//     contentContainer.appendChild(errorMsg);
//     return;
//   }

//   // Layout
//   contentContainer.innerHTML = "";
//   const layout = createElement("div", { class: "catalogue-layout" });
//   const main = createElement("main", { class: "catalogue-main" });
//   const aside = createElement("aside", { class: "catalogue-aside" });
//   layout.append(main, aside);
//   contentContainer.appendChild(layout);

//   // Controls
//   const searchBox = createElement("input", {
//     type: "text",
//     placeholder: "Search crops...",
//     class: "search-box"
//   });
//   const sortSelect = createElement("select", { class: "sort-box" }, [
//     createElement("option", { value: "az" }, ["A → Z"]),
//     createElement("option", { value: "za" }, ["Z → A"])
//   ]);

//   const controls = createElement("div", { class: "top-controls" }, [searchBox, sortSelect]);
//   const tagChips = createElement("div", { class: "tag-filters" });
//   tagFilters.forEach(tag => {
//     const chip = createElement("button", { class: "tag-chip" }, [tag]);
//     chip.onclick = () => {
//       if (activeTags.has(tag)) activeTags.delete(tag);
//       else activeTags.add(tag);
//       updateAllTabs();
//       updateChipsUI();
//     };
//     tagChips.appendChild(chip);
//   });

//   const updateChipsUI = () => {
//     Array.from(tagChips.children).forEach(btn =>
//       btn.classList.toggle("active", activeTags.has(btn.textContent))
//     );
//   };

//   main.append(controls, tagChips);

//   // Tabs
//   const tabButtons = createElement("div", { class: "tabs" });
//   const tabsWrapper = createElement("div", { id: "catalogue-container" });
//   main.append(tabButtons, tabsWrapper);

//   const tabs = {};
//   let currentTab = categories.find(cat => data[cat]?.length) || categories[0];

//   categories.forEach((category, index) => {
//     const tabBtn = createElement("button", {}, [
//       `${category.charAt(0).toUpperCase() + category.slice(1)} (${data[category]?.length || 0})`
//     ]);
//     tabBtn.onclick = () => {
//       currentTab = category;
//       showTab(category);
//       updateTab(category);
//     };
//     tabButtons.appendChild(tabBtn);

//     const tabContent = createElement("div", {
//       class: "tab-content",
//       id: category,
//       style: `display: ${index === 0 ? "block" : "none"}`
//     });
//     tabs[category] = tabContent;
//     tabsWrapper.appendChild(tabContent);
//   });

//   function updateTab(category) {
//     const crops = data[category];
//     if (!crops) return;

//     const term = searchBox.value.toLowerCase();
//     const sortBy = sortSelect.value;
//     const container = tabs[category];
//     container.innerHTML = "";

//     let visible = crops.filter(crop =>
//       crop.name.toLowerCase().includes(term) &&
//       [...activeTags].every(tag => crop.tags?.includes(tag))
//     );

//     visible.sort((a, b) =>
//       sortBy === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
//     );

//     visible.forEach(crop => container.appendChild(renderCropCard(crop)));
//   }

//   function showTab(selectedId) {
//     Object.entries(tabs).forEach(([id, tabContent]) => {
//       tabContent.style.display = id === selectedId ? "block" : "none";
//     });

//     Array.from(tabButtons.children).forEach(btn => {
//       btn.classList.toggle("active", btn.textContent.toLowerCase().includes(selectedId));
//     });
//   }

//   function updateAllTabs() {
//     Object.keys(tabs).forEach(id => {
//       updateTab(id);
//       tabs[id].style.display = id === currentTab ? "block" : "none";
//     });
//   }

//   function renderCropCard(crop) {
//     const card = createElement("div", { class: "crop-card" });

//     const img = createElement("img", {
//       src: `${SRC_URL}/${crop.image}`,
//       alt: crop.name,
//       loading: "lazy"
//     });

//     const title = createElement("h4", {}, [crop.name]);

//     const info = createElement("p", { class: "crop-info" }, [
//       `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit}`,
//       ` • ${crop.availableCount} listing(s)`
//     ]);

//     const trend = createElement("div", { class: "price-chart-placeholder" }, [
//       "📈 Price Trend"
//     ]);

//     const seasonNote = createElement("p", {
//       class: `season-indicator ${isSeasonal(crop) ? "in-season" : "off-season"}`
//     }, [
//       isSeasonal(crop) ? "🟢 In Season" : "🔴 Off Season"
//     ]);

//     const tagWrap = createElement("div", { class: "tag-wrap" });
//     crop.tags.forEach(t => {
//       tagWrap.appendChild(createElement("span", { class: "tag-pill" }, [t]));
//     });

//     const btn = createElement("button", {}, ["View Farms"]);
//     btn.onclick = () => navigate(`/crop/${crop.name.toLowerCase()}`);

//     card.append(img, title, info, trend, seasonNote, tagWrap, btn);
//     return card;
//   }

//   function isSeasonal(crop) {
//     const nowMonth = new Date().getMonth() + 1;
//     return crop.seasonMonths.includes(nowMonth);
//   }

//   updateAllTabs();

//   aside.append(
//     createElement("h3", {}, ["🌟 Featured Crops"]),
//     createElement("div", { class: "featured-list" }),
//     createElement("h3", {}, ["💸 Deals"]),
//     createElement("div", { class: "promo-box" }, [
//       createPromoLink("🧃 Buy 2 kg Tomatoes, get 10% off!", "Tomato", data),
//       createPromoLink("🥭 Fresh Mangoes now ₹40/kg!", "Mango", data)
//     ]),
//     createElement("h3", {}, ["📅 Seasonal Picks"]),
//     createElement("div", { class: "promo-box" }, [
//       createElement("p", {}, ["🍉 Watermelons are ripe this week"]),
//       createElement("p", {}, ["🌽 Baby corn harvest starting soon"])
//     ])
//   );
// }

// // import { navigate } from "../../../routes";
// // import { createElement } from "../../../components/createElement";
// // import { SRC_URL, apiFetch } from "../../../api/api";

// // export async function displayCrops(contentContainer, isLoggedIn) {
// //   const categories = ['fruits', 'vegetables', 'legumes', 'millets', 'flowers'];
// //   const tagFilters = ['Organic', 'Imported', 'Local', 'Bestseller'];

// //   let data = {};
// //   let activeTags = new Set();

// //   try {
// //     const response = await apiFetch("/crops/types");
// //     const cropsArray = response.cropTypes || [];
// //     const categorized = {};

// //     cropsArray.forEach(crop => {
// //       const category = guessCategoryFromName(crop.name);
// //       if (!categorized[category]) {
// //         categorized[category] = [];
// //       }
// //       categorized[category].push({
// //         ...crop,
// //         image: crop.imageUrl || "placeholder.jpg",
// //         category,
// //         tags: crop.tags || [],
// //         seasonMonths: crop.seasonMonths || [] // e.g., [5,6,7] for May–July
// //       });
// //     });

// //     data = categorized;
// //   } catch (err) {
// //     contentContainer.innerHTML = "";
// //     const errorMsg = createElement("p", {}, [`Failed to load crops: ${err.message}`]);
// //     contentContainer.appendChild(errorMsg);
// //     return;
// //   }

// //   // Base layout
// //   contentContainer.innerHTML = "";
// //   const layout = createElement("div", { class: "catalogue-layout" });
// //   const main = createElement("main", { class: "catalogue-main" });
// //   const aside = createElement("aside", { class: "catalogue-aside" });
// //   layout.append(main, aside);
// //   contentContainer.appendChild(layout);

// //   // Controls
// //   const searchBox = createElement("input", {
// //     type: "text",
// //     placeholder: "Search crops...",
// //     class: "search-box"
// //   });
// //   const sortSelect = createElement("select", { class: "sort-box" }, [
// //     createElement("option", { value: "az" }, ["A → Z"]),
// //     createElement("option", { value: "za" }, ["Z → A"])
// //   ]);

// //   const controls = createElement("div", { class: "top-controls" }, [searchBox, sortSelect]);
// //   const tagChips = createElement("div", { class: "tag-filters" });
// //   tagFilters.forEach(tag => {
// //     const chip = createElement("button", { class: "tag-chip" }, [tag]);
// //     chip.onclick = () => {
// //       if (activeTags.has(tag)) activeTags.delete(tag);
// //       else activeTags.add(tag);
// //       updateAllTabs();
// //       updateChipsUI();
// //     };
// //     tagChips.appendChild(chip);
// //   });

// //   const updateChipsUI = () => {
// //     Array.from(tagChips.children).forEach(btn =>
// //       btn.classList.toggle("active", activeTags.has(btn.textContent))
// //     );
// //   };

// //   main.append(controls, tagChips);

// //   // Tabs
// //   const tabButtons = createElement("div", { class: "tabs" });
// //   const tabsWrapper = createElement("div", { id: "catalogue-container" });
// //   main.append(tabButtons, tabsWrapper);

// //   const tabs = {};
// //   let currentTab = categories.find(cat => data[cat]?.length) || categories[0];

// //   categories.forEach((category, index) => {
// //     const tabBtn = createElement("button", {}, [
// //       `${category.charAt(0).toUpperCase() + category.slice(1)} (${data[category]?.length || 0})`
// //     ]);
// //     tabBtn.onclick = () => {
// //       currentTab = category;
// //       showTab(category);
// //       updateTab(category);
// //     };
// //     tabButtons.appendChild(tabBtn);

// //     const tabContent = createElement("div", {
// //       class: "tab-content",
// //       id: category,
// //       style: `display: ${index === 0 ? "block" : "none"}`
// //     });
// //     tabs[category] = tabContent;
// //     tabsWrapper.appendChild(tabContent);
// //   });

// //   // Tab filtering logic
// //   function updateTab(category) {
// //     const crops = data[category];
// //     if (!crops) return;

// //     const term = searchBox.value.toLowerCase();
// //     const sortBy = sortSelect.value;
// //     const container = tabs[category];
// //     container.innerHTML = "";

// //     let visible = crops.filter(crop =>
// //       crop.name.toLowerCase().includes(term) &&
// //       [...activeTags].every(tag => crop.tags?.includes(tag))
// //     );

// //     visible.sort((a, b) =>
// //       sortBy === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
// //     );

// //     visible.forEach(crop => container.appendChild(renderCropCard(crop)));
// //   }

// //   function showTab(selectedId) {
// //     Object.entries(tabs).forEach(([id, tabContent]) => {
// //       tabContent.style.display = id === selectedId ? "block" : "none";
// //     });
  
// //     Array.from(tabButtons.children).forEach(btn => {
// //       btn.classList.toggle("active", btn.textContent.toLowerCase().includes(selectedId));
// //     });
// //   }
  
// //   function updateAllTabs() {
// //     Object.keys(tabs).forEach(id => {
// //       updateTab(id);
// //       tabs[id].style.display = id === currentTab ? "block" : "none";
// //     });
// //   }
  

// //   // Render card
// //   function renderCropCard(crop) {
// //     const card = createElement("div", { class: "crop-card" });

// //     const img = createElement("img", {
// //       src: `${SRC_URL}/${crop.image}`,
// //       alt: crop.name,
// //       loading: "lazy"
// //     });

// //     const title = createElement("h4", {}, [crop.name]);

// //     const info = createElement("p", { class: "crop-info" }, [
// //       `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit}`,
// //       ` • ${crop.availableCount} listing(s)`
// //     ]);

// //     const trend = createElement("div", { class: "price-chart-placeholder" }, [
// //       "📈 Price Trend"
// //     ]);

// //     const seasonNote = createElement("p", {
// //       class: `season-indicator ${isSeasonal(crop) ? "in-season" : "off-season"}`
// //     }, [
// //       isSeasonal(crop) ? "🟢 In Season" : "🔴 Off Season"
// //     ]);

// //     const tagWrap = createElement("div", { class: "tag-wrap" });
// //     crop.tags.forEach(t => {
// //       tagWrap.appendChild(createElement("span", { class: "tag-pill" }, [t]));
// //     });

// //     const btn = createElement("button", {}, ["View Farms"]);
// //     btn.onclick = () => navigate(`/crop/${crop.name.toLowerCase()}`);

// //     card.append(img, title, info, trend, seasonNote, tagWrap, btn);
// //     return card;
// //   }

// //   // Helpers
// //   function isSeasonal(crop) {
// //     const nowMonth = new Date().getMonth() + 1;
// //     return crop.seasonMonths.includes(nowMonth);
// //   }

// //   updateAllTabs();

// //   // Aside: Can remain unchanged or repurposed
// //   aside.append(
// //     createElement("h3", {}, ["🌟 Featured Crops"]),
// //     createElement("div", { class: "featured-list" }),
// //     createElement("h3", {}, ["💸 Deals"]),
// //     createElement("div", { class: "promo-box" }, [
// //       createPromoLink("🧃 Buy 2 kg Tomatoes, get 10% off!", "Tomato"),
// //       createPromoLink("🥭 Fresh Mangoes now ₹40/kg!", "Mango")
// //     ]),
// //     createElement("h3", {}, ["📅 Seasonal Picks"]),
// //     createElement("div", { class: "promo-box" }, [
// //       createElement("p", {}, ["🍉 Watermelons are ripe this week"]),
// //       createElement("p", {}, ["🌽 Baby corn harvest starting soon"])
// //     ])
// //   );

// //   function createPromoLink(text, cropName) {
// //     const link = createElement("a", { href: "#", class: "promo-link" }, [text]);
// //     link.onclick = e => {
// //       e.preventDefault();
// //       const found = Object.values(data).flat().find(c =>
// //         c.name.toLowerCase() === cropName.toLowerCase()
// //       );
// //       found ? navigate(`/crop/${cropName.toLowerCase()}`) : alert(`Sorry, ${cropName} not found.`);
// //     };
// //     return link;
// //   }
// // }

// // function guessCategoryFromName(name) {
// //   const lower = name.toLowerCase();
// //   if (/mango|banana|apple|guava/.test(lower)) return "fruits";
// //   if (/tomato|onion|potato|spinach/.test(lower)) return "vegetables";
// //   if (/chickpea|lentil|pea/.test(lower)) return "legumes";
// //   if (/sorghum|millet|bajra/.test(lower)) return "millets";
// //   if (/rose|lily|marigold/.test(lower)) return "flowers";
// //   return "others";
// // }
