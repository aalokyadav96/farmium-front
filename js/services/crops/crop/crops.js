import { navigate } from "../../../routes";
import { createElement } from "../../../components/createElement";
import { SRC_URL, apiFetch } from "../../../api/api";

export async function displayCrops(contentContainer, isLoggedIn) {
  const categories = ['fruits', 'vegetables', 'legumes', 'millets', 'flowers'];
  const tagFilters = ['Organic', 'Imported', 'Local', 'Bestseller'];

  let data = {};
  let activeTags = new Set();

  try {
    const response = await apiFetch("/crops/types");
    const cropsArray = response.cropTypes || [];
    const categorized = {};

    cropsArray.forEach(crop => {
      const category = guessCategoryFromName(crop.name);
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push({
        ...crop,
        image: crop.imageUrl || "placeholder.jpg",
        category,
        tags: crop.tags || [],
        seasonMonths: crop.seasonMonths || [] // e.g., [5,6,7] for May–July
      });
    });

    data = categorized;
  } catch (err) {
    contentContainer.innerHTML = "";
    const errorMsg = createElement("p", {}, [`Failed to load crops: ${err.message}`]);
    contentContainer.appendChild(errorMsg);
    return;
  }

  // Base layout
  contentContainer.innerHTML = "";
  const layout = createElement("div", { class: "catalogue-layout" });
  const main = createElement("main", { class: "catalogue-main" });
  const aside = createElement("aside", { class: "catalogue-aside" });
  layout.append(main, aside);
  contentContainer.appendChild(layout);

  // Controls
  const searchBox = createElement("input", {
    type: "text",
    placeholder: "Search crops...",
    class: "search-box"
  });
  const sortSelect = createElement("select", { class: "sort-box" }, [
    createElement("option", { value: "az" }, ["A → Z"]),
    createElement("option", { value: "za" }, ["Z → A"])
  ]);

  const controls = createElement("div", { class: "top-controls" }, [searchBox, sortSelect]);
  const tagChips = createElement("div", { class: "tag-filters" });
  tagFilters.forEach(tag => {
    const chip = createElement("button", { class: "tag-chip" }, [tag]);
    chip.onclick = () => {
      if (activeTags.has(tag)) activeTags.delete(tag);
      else activeTags.add(tag);
      updateAllTabs();
      updateChipsUI();
    };
    tagChips.appendChild(chip);
  });

  const updateChipsUI = () => {
    Array.from(tagChips.children).forEach(btn =>
      btn.classList.toggle("active", activeTags.has(btn.textContent))
    );
  };

  main.append(controls, tagChips);

  // Tabs
  const tabButtons = createElement("div", { class: "tabs" });
  const tabsWrapper = createElement("div", { id: "catalogue-container" });
  main.append(tabButtons, tabsWrapper);

  const tabs = {};
  let currentTab = categories.find(cat => data[cat]?.length) || categories[0];

  categories.forEach((category, index) => {
    const tabBtn = createElement("button", {}, [
      `${category.charAt(0).toUpperCase() + category.slice(1)} (${data[category]?.length || 0})`
    ]);
    tabBtn.onclick = () => {
      currentTab = category;
      showTab(category);
      updateTab(category);
    };
    tabButtons.appendChild(tabBtn);

    const tabContent = createElement("div", {
      class: "tab-content",
      id: category,
      style: `display: ${index === 0 ? "block" : "none"}`
    });
    tabs[category] = tabContent;
    tabsWrapper.appendChild(tabContent);
  });

  // Tab filtering logic
  function updateTab(category) {
    const crops = data[category];
    if (!crops) return;

    const term = searchBox.value.toLowerCase();
    const sortBy = sortSelect.value;
    const container = tabs[category];
    container.innerHTML = "";

    let visible = crops.filter(crop =>
      crop.name.toLowerCase().includes(term) &&
      [...activeTags].every(tag => crop.tags?.includes(tag))
    );

    visible.sort((a, b) =>
      sortBy === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

    visible.forEach(crop => container.appendChild(renderCropCard(crop)));
  }

  function showTab(selectedId) {
    Object.entries(tabs).forEach(([id, tabContent]) => {
      tabContent.style.display = id === selectedId ? "block" : "none";
    });
  
    Array.from(tabButtons.children).forEach(btn => {
      btn.classList.toggle("active", btn.textContent.toLowerCase().includes(selectedId));
    });
  }
  
  function updateAllTabs() {
    Object.keys(tabs).forEach(id => {
      updateTab(id);
      tabs[id].style.display = id === currentTab ? "block" : "none";
    });
  }
  

  // Render card
  function renderCropCard(crop) {
    const card = createElement("div", { class: "crop-card" });

    const img = createElement("img", {
      src: `${SRC_URL}/${crop.image}`,
      alt: crop.name,
      loading: "lazy"
    });

    const title = createElement("h4", {}, [crop.name]);

    const info = createElement("p", { class: "crop-info" }, [
      `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit}`,
      ` • ${crop.availableCount} listing(s)`
    ]);

    const trend = createElement("div", { class: "price-chart-placeholder" }, [
      "📈 Price Trend"
    ]);

    const seasonNote = createElement("p", {
      class: `season-indicator ${isSeasonal(crop) ? "in-season" : "off-season"}`
    }, [
      isSeasonal(crop) ? "🟢 In Season" : "🔴 Off Season"
    ]);

    const tagWrap = createElement("div", { class: "tag-wrap" });
    crop.tags.forEach(t => {
      tagWrap.appendChild(createElement("span", { class: "tag-pill" }, [t]));
    });

    const btn = createElement("button", {}, ["View Farms"]);
    btn.onclick = () => navigate(`/crop/${crop.name.toLowerCase()}`);

    card.append(img, title, info, trend, seasonNote, tagWrap, btn);
    return card;
  }

  // Helpers
  function isSeasonal(crop) {
    const nowMonth = new Date().getMonth() + 1;
    return crop.seasonMonths.includes(nowMonth);
  }

  updateAllTabs();

  // Aside: Can remain unchanged or repurposed
  aside.append(
    createElement("h3", {}, ["🌟 Featured Crops"]),
    createElement("div", { class: "featured-list" }),
    createElement("h3", {}, ["💸 Deals"]),
    createElement("div", { class: "promo-box" }, [
      createPromoLink("🧃 Buy 2 kg Tomatoes, get 10% off!", "Tomato"),
      createPromoLink("🥭 Fresh Mangoes now ₹40/kg!", "Mango")
    ]),
    createElement("h3", {}, ["📅 Seasonal Picks"]),
    createElement("div", { class: "promo-box" }, [
      createElement("p", {}, ["🍉 Watermelons are ripe this week"]),
      createElement("p", {}, ["🌽 Baby corn harvest starting soon"])
    ])
  );

  function createPromoLink(text, cropName) {
    const link = createElement("a", { href: "#", class: "promo-link" }, [text]);
    link.onclick = e => {
      e.preventDefault();
      const found = Object.values(data).flat().find(c =>
        c.name.toLowerCase() === cropName.toLowerCase()
      );
      found ? navigate(`/crop/${cropName.toLowerCase()}`) : alert(`Sorry, ${cropName} not found.`);
    };
    return link;
  }
}

function guessCategoryFromName(name) {
  const lower = name.toLowerCase();
  if (/mango|banana|apple|guava/.test(lower)) return "fruits";
  if (/tomato|onion|potato|spinach/.test(lower)) return "vegetables";
  if (/chickpea|lentil|pea/.test(lower)) return "legumes";
  if (/sorghum|millet|bajra/.test(lower)) return "millets";
  if (/rose|lily|marigold/.test(lower)) return "flowers";
  return "others";
}

// import { navigate } from "../../../routes";
// import { createElement } from "../../../components/createElement";
// import { SRC_URL, apiFetch } from "../../../api/api";

// export async function displayCrops(contentContainer, isLoggedIn) {
//   const categories = ['fruits', 'vegetables', 'legumes', 'millets', 'flowers'];

//   let data = {};
//   try {
//     const response = await apiFetch("/crops/types");
//     const cropsArray = response.cropTypes || [];
//     const categorized = {};

//     cropsArray.forEach(crop => {
//       const category = guessCategoryFromName(crop.name);
//       if (!categorized[category]) {
//         categorized[category] = [];
//       }
//       categorized[category].push({
//         ...crop,
//         image: crop.imageUrl || "placeholder.jpg", // fallback image
//         category
//       });
//     });

//     data = categorized;
//   } catch (err) {
//     contentContainer.innerHTML = "";
//     const errorMsg = createElement("p", {}, [`Failed to load crops: ${err.message}`]);
//     contentContainer.appendChild(errorMsg);
//     return;
//   }

//   contentContainer.innerHTML = "";

//   const layout = createElement("div", { class: "catalogue-layout" });
//   const main = createElement("main", { class: "catalogue-main" });
//   const aside = createElement("aside", { class: "catalogue-aside" });
//   layout.append(main, aside);
//   contentContainer.appendChild(layout);

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
//   main.appendChild(controls);

//   const tabButtons = createElement("div", { class: "tabs" });
//   const tabsWrapper = createElement("div", { id: "catalogue-container" });
//   main.append(tabButtons, tabsWrapper);

//   const tabs = {};
//   let currentTab = categories.find(cat => data[cat]?.length) || categories[0];

//   categories.forEach((category, index) => {
//     const tabBtn = createElement("button", {}, [
//       category.charAt(0).toUpperCase() + category.slice(1)
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

//   searchBox.addEventListener("input", () => updateAllTabs());
//   sortSelect.addEventListener("change", () => updateAllTabs());

//   function updateAllTabs() {
//     categories.forEach(cat => updateTab(cat));
//   }

//   function updateTab(category) {
//     const crops = data[category];
//     if (!crops) return;

//     const term = searchBox.value.toLowerCase();
//     const sortBy = sortSelect.value;
//     const container = tabs[category];
//     container.innerHTML = "";

//     let visible = crops.filter(crop =>
//       crop.name.toLowerCase().includes(term)
//     );

//     visible.sort((a, b) => {
//       return sortBy === "az"
//         ? a.name.localeCompare(b.name)
//         : b.name.localeCompare(a.name);
//     });

//     visible.forEach(crop => {
//       const img = createElement("img", {
//         src: `${SRC_URL}/${crop.image}`,
//         alt: crop.name,
//         loading: "lazy"
//       });

//       const title = createElement("h4", {}, [crop.name]);
//       const info = createElement("p", { class: "crop-info" }, [
//         `₹${crop.minPrice} - ₹${crop.maxPrice} per ${crop.unit}`,
//         ` • ${crop.availableCount} listing(s)`
//       ]);

//       const btn = createElement("button", {}, ["View Farms"]);
//       btn.onclick = () => navigate(`/crop/${crop.name.toLowerCase()}`);

//       const card = createElement("div", { class: "crop-card" }, [img, title, info, btn]);
//       container.appendChild(card);
//     });
//   }

//   function showTab(selectedId) {
//     Object.keys(tabs).forEach(id => {
//       tabs[id].style.display = id === selectedId ? "block" : "none";
//     });
//     Array.from(tabButtons.children).forEach(btn =>
//       btn.classList.toggle("active", btn.textContent.toLowerCase() === selectedId)
//     );
//   }

//   updateAllTabs();

//   // ASIDE: Featured Crops – skip or repurpose if not in response
//   const featuredHeader = createElement("h3", {}, ["🌟 Featured Crops"]);
//   const featuredList = createElement("div", { class: "featured-list" });

//   aside.append(featuredHeader, featuredList);

//   // ASIDE: Promotions
//   const promoHeader = createElement("h3", {}, ["💸 Deals"]);
//   const promoBox = createElement("div", { class: "promo-box" });

//   const deals = [
//     { label: "🧃 Buy 2 kg Tomatoes, get 10% off!", cropName: "Tomato" },
//     { label: "🥭 Fresh Mangoes now ₹40/kg!", cropName: "Mango" }
//   ];

//   deals.forEach(deal => {
//     const dealLink = createElement("a", { href: "#", class: "promo-link" }, [deal.label]);
//     dealLink.onclick = e => {
//       e.preventDefault();
//       const crop = Object.values(data).flat().find(c =>
//         c.name.toLowerCase() === deal.cropName.toLowerCase()
//       );
//       if (crop) {
//         navigate(`/crop/${crop.name.toLowerCase()}`);
//       } else {
//         alert(`Sorry, ${deal.cropName} not found.`);
//       }
//     };
//     promoBox.appendChild(dealLink);
//   });

//   const seasonHeader = createElement("h3", {}, ["📅 Seasonal Picks"]);
//   const seasonBox = createElement("div", { class: "promo-box" }, [
//     createElement("p", {}, ["🍉 Watermelons are ripe this week"]),
//     createElement("p", {}, ["🌽 Baby corn harvest starting soon"])
//   ]);

//   aside.append(promoHeader, promoBox, seasonHeader, seasonBox);
// }

// // crude category guesser by name
// function guessCategoryFromName(name) {
//   const lower = name.toLowerCase();
//   if (/mango|banana|apple|guava/.test(lower)) return "fruits";
//   if (/tomato|onion|potato|spinach/.test(lower)) return "vegetables";
//   if (/chickpea|lentil|pea/.test(lower)) return "legumes";
//   if (/sorghum|millet|bajra/.test(lower)) return "millets";
//   if (/egg|chicken|duck/.test(lower)) return "poultry";
//   if (/fish|prawn/.test(lower)) return "fishery";
//   if (/rose|lily|marigold/.test(lower)) return "flowers";
//   return "others";
// }
