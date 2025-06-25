import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { createCrop } from "../crop/createCrop.js";
import { editCrop } from "../crop/editCrop.js";
import Button from "../../../components/base/Button.js";
import { navigate } from "../../../routes/index.js";
import { editFarm } from "./editFarm.js";
import { getState } from "../../../state/state.js";
import { addToCart } from "../../cart/addToCart.js";

export async function displayFarm(isLoggedIn, farmId, container) {
    container.innerHTML = "";

    if (!isLoggedIn) {
        container.textContent = "Please log in to view this farm.";
        return;
    }

    const res = await apiFetch(`/farms/${farmId}`);
    const farm = res?.farm;

    let isCreator = false;
    if (getState("user") == farm.createdBy) {
        isCreator = true;
    }

    if (!res?.success || !farm) {
        container.textContent = "Farm not found.";
        return;
    }

    const header = createElement("div", { class: "farm-header" }, [
        Button("← Back", "back-btn", {
            click: () => navigate("/farms")
        }, "buttonx"),
        createElement("div", { class: "breadcrumbs" }, ["🏠 Home / 🌾 Farms / ", farm.name])
    ]);

    const banner = createElement("div", { class: "farm-banner" }, [
        createElement("img", {
            src: farm.photo ? SRC_URL + farm.photo : "/default-farm.jpg",
            alt: farm.name
        })
    ]);

    const farmDetails = renderFarmDetails(farm, isCreator);
    const summaryStats = renderCropSummary(farm.crops || []);
    const cropDistribution = renderCropEmojiMap(farm.crops || []);

    const reviewPlaceholder = createElement("div", { class: "review-block" }, [
        createElement("p", {}, ["⭐️⭐️⭐️⭐️☆ (4.2 avg based on 17 reviews)"]),
        Button("💬 Write a Review", "review-btn", {
            click: () => alert("Review feature coming soon!")
        }, "buttonx"),
        Button("📨 Contact Farm", "contact-btn", {
            click: () => alert(`You can reach ${farm.owner} at ${farm.contact || "N/A"}`)
        }, "buttonx")
    ]);

    const asideColumn = createElement("aside", { class: "farm-aside" }, [
        summaryStats,
        cropDistribution,
        reviewPlaceholder
    ]);

    const cropsContainer = createElement("div", { class: "crop-list" });
    const cropHeader = createElement("h3", {}, ["🌾 Available Crops"]);
    const sortSelect = createSortDropdown(async (sortBy) => {
        const updatedRes = await apiFetch(`/farms/${farmId}`);
        const updatedFarm = updatedRes?.farm;
        if (updatedRes?.success && updatedFarm) {
            await renderCrops(updatedFarm, cropsContainer, farmId, container, isLoggedIn, sortBy, isCreator);
        }
    });

    const addCropButton = createElement("button", { class: "add-crop-btn" }, ["➕ Add Crop"]);
    if (isCreator) {
        addCropButton.addEventListener("click", () => {
            container.textContent = "";
            createCrop(farmId, container);
        });
    } else {
        addCropButton.addEventListener("click", () => {
            alert("are you logged in?");
        });
    }

    const mainColumn = createElement("main", { class: "farm-main" }, [
        farmDetails,
        cropHeader,
        sortSelect,
        cropsContainer,
        addCropButton
    ]);

    const layoutWrapper = createElement("div", { class: "farm-layout" }, [
        mainColumn,
        asideColumn
    ]);

    container.append(header, banner, layoutWrapper);

    await renderCrops(farm, cropsContainer, farmId, container, isLoggedIn, "name");
}

function renderFarmDetails(farm, isCreator) {
    const daysAgo = getAgeInDays(farm.updatedAt);
    const freshness = daysAgo < 2 ? "🟢 Updated today" : `🕒 Updated ${daysAgo} days ago`;

    let actions = createElement("div", { class: "farm-actions" });
    if (isCreator) {
        actions.append(
            Button("✏️ Edit", `edit-${farm.id}`, {
                click: () => editFarm(true, farm, document.getElementById('farm-detail'))
            }),
            Button("🗑️ Delete", `delete-${farm.id}`, {
                click: async () => {
                    if (!confirm(`Delete farm "${farm.name}"?`)) return;
                    const res = await apiFetch(`/farms/${farm.id}`, "DELETE");
                    if (res.success) {
                        navigate("/farms");
                    } else {
                        alert("Failed to delete.");
                    }
                }
            })
        );
    }

    return createElement("div", { id: "farm-detail", class: "farm-detail" }, [
        createElement("h2", {}, [farm.name]),
        createElement("p", {}, [`📍 Location: ${farm.location}`]),
        createElement("p", {}, [`📃 Description: ${farm.description}`]),
        createElement("p", {}, [`👤 Owner: ${farm.owner}`]),
        createElement("p", {}, [`📞 Contact: ${farm.contact}`]),
        createElement("p", {}, [`🕒 Availability: ${farm.availabilityTiming}`]),
        createElement("p", {}, [freshness]),
        actions
    ]);
}

function renderCropSummary(crops) {
    const total = crops.length;
    const inStock = crops.filter(c => c.quantity > 0).length;
    const avgPrice = crops.reduce((sum, c) => sum + (c.price || 0), 0) / (total || 1);
    return createElement("div", { class: "crop-summary" }, [
        createElement("p", {}, [`🌱 ${total} crops`]),
        createElement("p", {}, [`📦 ${inStock} in stock`]),
        createElement("p", {}, [`💸 Avg. price: ₹${avgPrice.toFixed(2)}`])
    ]);
}

function renderCropEmojiMap(crops) {
    const emoji = ["🥔", "🌾", "🍅", "🌽", "🥬", "🍆"];
    const map = {};

    for (const crop of crops) {
        map[crop.name] = (map[crop.name] || 0) + 1;
    }

    const blocks = Object.entries(map).map(([name, count], i) =>
        createElement("p", {}, [`${emoji[i % emoji.length]} ${name}: ${count}`])
    );

    return createElement("div", { class: "crop-distribution" }, [
        createElement("h4", {}, ["🗺️ Crop Distribution"]),
        ...blocks
    ]);
}

function createSortDropdown(onChange) {
    const select = createElement("select", { class: "crop-sort-select" }, [
        createElement("option", { value: "name" }, ["Sort by Name"]),
        createElement("option", { value: "price" }, ["Sort by Price"]),
        createElement("option", { value: "quantity" }, ["Sort by Quantity"]),
        createElement("option", { value: "age" }, ["Sort by Age"])
    ]);
    select.addEventListener("change", () => onChange(select.value));
    return select;
}
export async function renderCrops(farm, cropsContainer, farmId, mainContainer, isLoggedIn, sortBy, isCreator) {
    cropsContainer.textContent = "";
  
    if (!farm.crops?.length) {
      cropsContainer.append(createElement("p", {}, ["No crops listed yet."]));
      return;
    }
  
    const sortedCrops = sortCrops(farm.crops, sortBy);
    for (const crop of sortedCrops) {
      const card = createCropCard(crop, farm, farmId, mainContainer, isLoggedIn, isCreator);
      cropsContainer.appendChild(card);
    }
  }
  function createCropCard(crop, farm, farmId, mainContainer, isLoggedIn, isCreator) {
    const card = createElement("div", { class: "crop-card" });
  
    if (crop.imageUrl) {
      card.appendChild(createElement("img", {
        src: `${SRC_URL}${crop.imageUrl}`,
        alt: crop.name
      }));
    }
  
    const age = crop.createdAt ? `${getAgeInDays(crop.createdAt)} days old` : "Unknown age";
    const perishable = crop.expiryDate ? `🧊 Expires: ${crop.expiryDate}` : "Stable";
    const stockStatus = crop.quantity <= 0 ? "❌ Out of Stock" : "✅ Available";
  
    card.append(
      createElement("h4", {}, [crop.name]),
      createElement("p", {}, [`💰 ${crop.price} per ${crop.unit}`]),
      createElement("p", {}, [`📦 Stock: ${crop.quantity}`]),
      createElement("p", {}, [`📅 Harvested: ${crop.harvestDate || "Unknown"}`]),
      createElement("p", {}, [`📆 ${perishable}`]),
      createElement("p", {}, [`🕓 ${age}`]),
      createElement("p", {}, [`📌 ${stockStatus}`])
    );
  
    if (crop.history?.length > 1) {
      card.append(...createPriceHistoryToggle(crop.history));
    }
  
    if (isCreator) {
      card.append(...createCreatorControls(crop, farmId, mainContainer));
    } else {
      card.append(...createUserControls(crop, farm.name, isLoggedIn));
    }
  
    return card;
  }
  function createPriceHistoryToggle(history) {
    const toggle = createElement("button", {}, ["📈 Show Price History"]);
    const historyBlock = createElement("pre", { class: "price-history hidden" });
    historyBlock.textContent = history.map(p => `${p.date}: ₹${p.price}`).join("\n");
  
    toggle.addEventListener("click", () => {
      historyBlock.classList.toggle("hidden");
    });
  
    return [toggle, historyBlock];
  }
  function createCreatorControls(crop, farmId, mainContainer) {
    const editBtn = createElement("button", { class: "edit-btn" }, ["✏️ Edit"]);
    editBtn.onclick = () => {
      mainContainer.textContent = "";
      editCrop(true, farmId, crop, mainContainer);
    };
  
    const deleteBtn = createElement("button", { class: "btn btn-danger" }, ["🗑️ Delete"]);
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete crop "${crop.name}"?`)) return;
      const res = await apiFetch(`/farms/${farmId}/crops/${crop.id}`, "DELETE");
      if (res.success) {
        const updated = await apiFetch(`/farms/${farmId}`);
        if (updated?.success && updated.farm) {
          await renderCrops(updated.farm, document.querySelector(".crops-container"), farmId, mainContainer, true, "latest", true);
        }
      } else {
        alert("❌ Failed to delete crop.");
      }
    };
  
    return [editBtn, deleteBtn];
  }
  function createUserControls(crop, farmName, isLoggedIn) {
    let quantity = 1;
  
    const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);
    const incrementBtn = createElement("button", {}, ["+"]);
    const decrementBtn = createElement("button", {}, ["−"]);
  
    incrementBtn.onclick = () => {
      quantity++;
      quantityDisplay.textContent = quantity;
    };
  
    decrementBtn.onclick = () => {
      if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = quantity;
      }
    };
  
    const quantityWrapper = createElement("div", { class: "quantity-control" }, [
      decrementBtn, quantityDisplay, incrementBtn
    ]);
  
    const addBtn = createElement("button", { class: "a2c-crop" }, ["🛒 Add to Cart"]);
    addBtn.onclick = () => {
      addToCart({
        category: "crops",
        item: crop.name,
        unit: crop.unit,
        farm: farmName,
        quantity,
        price: crop.price,
        isLoggedIn
      });
    };
  
    return [
      createElement("label", {}, ["Quantity:"]),
      quantityWrapper,
      addBtn
    ];
  }
          
// async function renderCrops(farm, cropsContainer, farmId, mainContainer, isLoggedIn, sortBy, isCreator) {
//     cropsContainer.textContent = "";

//     if (!farm.crops?.length) {
//         cropsContainer.append(createElement("p", {}, ["No crops listed yet."]));
//         return;
//     }

//     const sortedCrops = sortCrops(farm.crops, sortBy);

//     for (const crop of sortedCrops) {
//         const card = createElement("div", { class: "crop-card" });

//         if (crop.imageUrl) {
//             card.appendChild(createElement("img", {
//                 src: `${SRC_URL}${crop.imageUrl}`,
//                 alt: crop.name
//             }));
//         }

//         const age = crop.createdAt ? `${getAgeInDays(crop.createdAt)} days old` : "Unknown age";
//         const perishable = crop.expiryDate ? `🧊 Expires: ${crop.expiryDate}` : "Stable";
//         const stockStatus = crop.quantity <= 0 ? "❌ Out of Stock" : "✅ Available";

//         card.append(
//             createElement("h4", {}, [crop.name]),
//             createElement("p", {}, [`💰 ${crop.price} per ${crop.unit}`]),
//             createElement("p", {}, [`📦 Stock: ${crop.quantity}`]),
//             createElement("p", {}, [`📅 Harvested: ${crop.harvestDate || "Unknown"}`]),
//             createElement("p", {}, [`📆 ${perishable}`]),
//             createElement("p", {}, [`🕓 ${age}`]),
//             createElement("p", {}, [`📌 ${stockStatus}`])
//         );

//         if (crop.history?.length > 1) {
//             const toggle = createElement("button", {}, ["📈 Show Price History"]);
//             const historyBlock = createElement("pre", { class: "price-history hidden" });
//             historyBlock.textContent = crop.history.map(p => `${p.date}: ₹${p.price}`).join("\n");

//             toggle.addEventListener("click", () => {
//                 historyBlock.classList.toggle("hidden");
//             });

//             card.append(toggle, historyBlock);
//         }

//         if (isCreator) {
//             const editBtn = createElement("button", { class: "edit-btn" }, ["✏️ Edit"]);
//             editBtn.addEventListener("click", () => {
//                 mainContainer.textContent = "";
//                 editCrop(true, farmId, crop, mainContainer);
//             });

//             const deleteBtn = createElement("button", { class: "btn btn-danger" }, ["🗑️ Delete"]);
//             deleteBtn.addEventListener("click", async () => {
//                 if (!confirm(`Delete crop "${crop.name}"?`)) return;
//                 const res = await apiFetch(`/farms/${farmId}/crops/${crop.id}`, "DELETE");
//                 if (res.success) {
//                     const updated = await apiFetch(`/farms/${farmId}`);
//                     if (updated?.success && updated.farm) {
//                         await renderCrops(updated.farm, cropsContainer, farmId, mainContainer, isLoggedIn, sortBy);
//                     }
//                 } else {
//                     alert("❌ Failed to delete crop.");
//                 }
//             });

//             card.append(editBtn, deleteBtn);
//         } else {
//             let quantity = 1;
//             const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);
//             const incrementBtn = createElement("button", {}, ["+"]);
//             const decrementBtn = createElement("button", {}, ["−"]);

//             incrementBtn.onclick = () => {
//                 quantity++;
//                 quantityDisplay.textContent = quantity;
//             };

//             decrementBtn.onclick = () => {
//                 if (quantity > 1) {
//                     quantity--;
//                     quantityDisplay.textContent = quantity;
//                 }
//             };

//             const quantityWrapper = createElement("div", { class: "quantity-control" }, [
//                 decrementBtn, quantityDisplay, incrementBtn
//             ]);

//             const addBtn = createElement("button", { class: "a2c-crop" }, ["🛒 Add to Cart"]);
//             addBtn.addEventListener("click", () => {
//                 addToCart({
//                     category: "crops",
//                     item: crop.name,
//                     unit: crop.unit,
//                     farm: farm.name,
//                     quantity,
//                     price: crop.price,
//                     isLoggedIn
//                 });
//             });

//             card.append(
//                 createElement("label", {}, ["Quantity:"]),
//                 quantityWrapper,
//                 addBtn
//             );
//         }

//         cropsContainer.appendChild(card);
//     }
// }

function sortCrops(crops, sortBy) {
    return [...crops].sort((a, b) => {
        switch (sortBy) {
            case "price": return a.price - b.price;
            case "quantity": return b.quantity - a.quantity;
            case "age": return getAgeInDays(b.createdAt) - getAgeInDays(a.createdAt);
            case "name":
            default: return a.name.localeCompare(b.name);
        }
    });
}

function getAgeInDays(dateStr) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    return isNaN(days) ? 0 : days;
}

// import { SRC_URL, apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";
// import { createCrop } from "../crop/createCrop.js";
// import { editCrop } from "../crop/editCrop.js";
// import Button from "../../../components/base/Button.js";
// import { navigate } from "../../../routes/index.js";
// import { editFarm } from "./editFarm.js";
// import { getState } from "../../../state/state.js";
// import { addToCart } from "../../cart/addToCart.js";



// export async function displayFarm(isLoggedIn, farmId, container) {
//     container.innerHTML = "";

//     if (!isLoggedIn) {
//         container.textContent = "Please log in to view this farm.";
//         return;
//     }

//     const res = await apiFetch(`/farms/${farmId}`);
//     const farm = res?.farm;

//     let isCreator = false;
//     if (getState("user") == farm.createdBy) {
//         isCreator = true;
//     }

//     if (!res?.success || !farm) {
//         container.textContent = "Farm not found.";
//         return;
//     }

//     const header = createElement("div", { class: "farm-header" }, [
//         Button("← Back", "back-btn", {
//             click: () => navigate("/farms")
//         }, "buttonx"),
//         createElement("div", { class: "breadcrumbs" }, ["🏠 Home / 🌾 Farms / ", farm.name])
//     ]);

//     const banner = createElement("div", { class: "farm-banner" }, [
//         createElement("img", {
//             src: farm.photo ? SRC_URL + farm.photo : "/default-farm.jpg",
//             alt: farm.name
//         })
//     ]);

//     const farmDetails = renderFarmDetails(farm, isCreator);

//     const summaryStats = renderCropSummary(farm.crops || []);
//     const cropDistribution = renderCropEmojiMap(farm.crops || []);
//     const reviewPlaceholder = createElement("div", { class: "review-block" }, [
//         createElement("p", {}, ["⭐️⭐️⭐️⭐️☆ (4.2 avg based on 17 reviews)"]),
//         Button("💬 Write a Review", "review-btn", {
//             click: () => alert("Review feature coming soon!")
//         }, "buttonx"),
//         Button("📨 Contact Farm", "contact-btn", {
//             click: () => alert(`You can reach ${farm.owner} at ${farm.contact || "N/A"}`)
//         }, "buttonx")
//     ]);

//     const asideColumn = createElement("aside", { class: "farm-aside" }, [
//         summaryStats,
//         cropDistribution,
//         reviewPlaceholder
//     ]);

//     const cropsContainer = createElement("div", { class: "crop-list" });
//     const cropHeader = createElement("h3", {}, ["🌾 Available Crops"]);
//     const sortSelect = createSortDropdown(async (sortBy) => {
//         const updatedRes = await apiFetch(`/farms/${farmId}`);
//         const updatedFarm = updatedRes?.farm;
//         if (updatedRes?.success && updatedFarm) {
//             await renderCrops(updatedFarm, cropsContainer, farmId, container, isLoggedIn, sortBy, isCreator);
//         }
//     });

//     const addCropButton = createElement("button", { class: "add-crop-btn" }, ["➕ Add Crop"]);
//     if (isCreator) {
//         addCropButton.addEventListener("click", () => {
//             container.textContent = "";
//             // navigate(`/create-crop`);
//             // createCrop(isLoggedIn, farmId, container);
//             createCrop(farmId, container);
//         });
//     } else {
//         addCropButton.addEventListener("click", () => {
//             alert("are you logged in?");
//         });
//     }

//     const mainColumn = createElement("main", { class: "farm-main" }, [
//         farmDetails,
//         cropHeader,
//         sortSelect,
//         cropsContainer,
//         addCropButton
//     ]);

//     const layoutWrapper = createElement("div", { class: "farm-layout" }, [
//         mainColumn,
//         asideColumn
//     ]);

//     container.append(
//         header,
//         banner,
//         layoutWrapper
//     );

//     await renderCrops(farm, cropsContainer, farmId, container, isLoggedIn, "name");
// }

// function renderFarmDetails(farm, isCreator) {
//     const daysAgo = getAgeInDays(farm.updatedAt);
//     const freshness = daysAgo < 2 ? "🟢 Updated today" : `🕒 Updated ${daysAgo} days ago`;

//     let actions = createElement("div", { class: "farm-actions" });
//     if (isCreator) {
//     actions.append(
//         Button("✏️ Edit", `edit-${farm.id}`, {
//             click: () => editFarm(true, farm, document.getElementById('farm-detail'))
//         }),
//         Button("🗑️ Delete", `delete-${farm.id}`, {
//             click: async () => {
//                 if (!confirm(`Delete farm "${farm.name}"?`)) return;
//                 const res = await apiFetch(`/farms/${farm.id}`, "DELETE");
//                 if (res.success) {
//                     navigate("/farms");
//                 } else {
//                     alert("Failed to delete.");
//                 }
//             }
//         })
//     );
//     }

//     return createElement("div", { id: "farm-detail", class: "farm-detail" }, [
//         createElement("h2", {}, [farm.name]),
//         createElement("p", {}, [`📍 Location: ${farm.location}`]),
//         createElement("p", {}, [`📃 Description: ${farm.description}`]),
//         createElement("p", {}, [`👤 Owner: ${farm.owner}`]),
//         createElement("p", {}, [`📞 Contact: ${farm.contact}`]),
//         createElement("p", {}, [`🕒 Availability: ${farm.availabilityTiming}`]),
//         createElement("p", {}, [freshness]),
//         actions
//     ]);
// }

// function renderCropSummary(crops) {
//     const total = crops.length;
//     const inStock = crops.filter(c => c.quantity > 0).length;
//     const avgPrice = crops.reduce((sum, c) => sum + (c.price || 0), 0) / (total || 1);
//     return createElement("div", { class: "crop-summary" }, [
//         createElement("p", {}, [`🌱 ${total} crops`]),
//         createElement("p", {}, [`📦 ${inStock} in stock`]),
//         createElement("p", {}, [`💸 Avg. price: ₹${avgPrice.toFixed(2)}`])
//     ]);
// }

// function renderCropEmojiMap(crops) {
//     const emoji = ["🥔", "🌾", "🍅", "🌽", "🥬", "🍆"];
//     const map = {};

//     for (const crop of crops) {
//         map[crop.name] = (map[crop.name] || 0) + 1;
//     }

//     const blocks = Object.entries(map).map(([name, count], i) =>
//         createElement("p", {}, [`${emoji[i % emoji.length]} ${name}: ${count}`])
//     );

//     return createElement("div", { class: "crop-distribution" }, [
//         createElement("h4", {}, ["🗺️ Crop Distribution"]),
//         ...blocks
//     ]);
// }

// function createSortDropdown(onChange) {
//     const select = createElement("select", { class: "crop-sort-select" }, [
//         createElement("option", { value: "name" }, ["Sort by Name"]),
//         createElement("option", { value: "price" }, ["Sort by Price"]),
//         createElement("option", { value: "quantity" }, ["Sort by Quantity"]),
//         createElement("option", { value: "age" }, ["Sort by Age"])
//     ]);
//     select.addEventListener("change", () => onChange(select.value));
//     return select;
// }

// async function renderCrops(farm, cropsContainer, farmId, mainContainer, isLoggedIn, sortBy, isCreator) {
//     cropsContainer.textContent = "";

//     if (!farm.crops?.length) {
//         cropsContainer.append(createElement("p", {}, ["No crops listed yet."]));
//         return;
//     }

//     const sortedCrops = sortCrops(farm.crops, sortBy);

//     for (const crop of sortedCrops) {
//         const card = createElement("div", { class: "crop-card" });

//         if (crop.imageUrl) {
//             card.appendChild(createElement("img", {
//                 src: `${SRC_URL}${crop.imageUrl}`,
//                 alt: crop.name
//             }));
//         }

//         const age = crop.createdAt ? `${getAgeInDays(crop.createdAt)} days old` : "Unknown age";
//         const perishable = crop.expiryDate ? `🧊 Expires: ${crop.expiryDate}` : "Stable";
//         const stockStatus = crop.quantity <= 0 ? "❌ Out of Stock" : "✅ Available";

//         card.append(
//             createElement("h4", {}, [crop.name]),
//             createElement("p", {}, [`💰 ${crop.price} per ${crop.unit}`]),
//             createElement("p", {}, [`📦 Stock: ${crop.quantity}`]),
//             createElement("p", {}, [`📅 Harvested: ${crop.harvestDate || "Unknown"}`]),
//             createElement("p", {}, [`📆 ${perishable}`]),
//             createElement("p", {}, [`🕓 ${age}`]),
//             createElement("p", {}, [`📌 ${stockStatus}`])
//         );

//         if (crop.history?.length > 1) {
//             const toggle = createElement("button", {}, ["📈 Show Price History"]);
//             const historyBlock = createElement("pre", { class: "price-history hidden" });

//             historyBlock.textContent = crop.history.map(p => `${p.date}: ₹${p.price}`).join("\n");

//             toggle.addEventListener("click", () => {
//                 historyBlock.classList.toggle("hidden");
//             });

//             card.append(toggle, historyBlock);
//         }

//         if (isCreator) {
//         const editBtn = createElement("button", { class: "edit-btn" }, ["✏️ Edit"]);
//         editBtn.addEventListener("click", () => {
//             mainContainer.textContent = "";
//             editCrop(true, farmId, crop, mainContainer);
//         });

//         const deleteBtn = createElement("button", { class: "btn btn-danger" }, ["🗑️ Delete"]);
//         deleteBtn.addEventListener("click", async () => {
//             if (!confirm(`Delete crop "${crop.name}"?`)) return;
//             const res = await apiFetch(`/farms/${farmId}/crops/${crop.id}`, "DELETE");
//             if (res.success) {
//                 const updated = await apiFetch(`/farms/${farmId}`);
//                 if (updated?.success && updated.farm) {
//                     await renderCrops(updated.farm, cropsContainer, farmId, mainContainer, isLoggedIn, sortBy);
//                 }
//             } else {
//                 alert("❌ Failed to delete crop.");
//             }
//         });

//         card.append(editBtn, deleteBtn);
//     } else if (!isCreator) {
//         let quantity = 1;
    
//         const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);
//         const incrementBtn = createElement("button", {}, ["+"]);
//         const decrementBtn = createElement("button", {}, ["−"]);
    
//         incrementBtn.onclick = () => {
//             quantity++;
//             quantityDisplay.textContent = quantity;
//         };
    
//         decrementBtn.onclick = () => {
//             if (quantity > 1) {
//                 quantity--;
//                 quantityDisplay.textContent = quantity;
//             }
//         };
    
//         const quantityWrapper = createElement("div", { class: "quantity-control" }, [
//             decrementBtn, quantityDisplay, incrementBtn
//         ]);
    
//         const addToCart = () => {
//             if (!isLoggedIn) {
//                 alert("Please log in to add items to your cart.");
//                 return;
//             }
    
//             const stored = localStorage.getItem("multiCart");
//             const cart = stored ? JSON.parse(stored) : { crops: [], merchandise: [], tickets: [], menu: [] };
//             const key = `${crop.name}__${farm.name}`;
    
//             const existing = cart.crops.find(item => `${item.item}__${item.farm}` === key);
//             if (existing) {
//                 existing.quantity += quantity;
//             } else {
//                 cart.crops.push({
//                     item: crop.name,
//                     farm: farm.name,
//                     quantity,
//                     price: crop.price
//                 });
//             }
    
//             localStorage.setItem("multiCart", JSON.stringify(cart));
//             alert(`${quantity} ${crop.unit} of ${crop.name} from ${farm.name} added to cart`);
//             // If `showToast` is available, replace alert with it.
//         };
    
//         const addBtn = createElement("button", { class: "a2c-crop" }, ["🛒 Add to Cart"]);
//         addBtn.addEventListener("click", addToCart);
    
//         card.append(
//             createElement("label", {}, ["Quantity:"]),
//             quantityWrapper,
//             addBtn
//         );
//     }
    
//         cropsContainer.appendChild(card);
//     }
// }


// function sortCrops(crops, sortBy) {
//     return [...crops].sort((a, b) => {
//         switch (sortBy) {
//             case "price": return a.price - b.price;
//             case "quantity": return b.quantity - a.quantity;
//             case "age": return getAgeInDays(b.createdAt) - getAgeInDays(a.createdAt);
//             case "name":
//             default: return a.name.localeCompare(b.name);
//         }
//     });
// }

// function getAgeInDays(dateStr) {
//     const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
//     return isNaN(days) ? 0 : days;
// }


// /*

// Absolutely! Here's a simple helper function that can infer a farm's type based on the crops it has:

// ```js
// function inferFarmTypes(crops) {
//     const typeCategories = {
//         Fruits: ["Mango", "Banana", "Guava", "Papaya", "Apple", "Orange"],
//         Vegetables: ["Tomato", "Potato", "Spinach", "Brinjal", "Onion", "Cabbage"],
//         Grains: ["Wheat", "Rice", "Barley", "Corn", "Millet"],
//         Legumes: ["Chickpea", "Lentil", "Pea", "Kidney Bean"],
//         Dairy: ["Milk", "Cheese", "Curd", "Butter"],
//         Fishery: ["Fish", "Prawn", "Crab"],
//         Poultry: ["Eggs", "Chicken", "Duck"]
//     };

//     const typesFound = new Set();

//     for (const crop of crops) {
//         for (const [type, items] of Object.entries(typeCategories)) {
//             if (items.includes(crop.name)) {
//                 typesFound.add(type);
//                 break;
//             }
//         }
//     }

//     if (typesFound.size === 0) return ["Unknown"];
//     if (typesFound.size > 1) typesFound.add("Mixed");

//     return Array.from(typesFound);
// }
// ```

// You can call this wherever you have access to `farm.crops`, for example:

// ```js
// const farmTypes = inferFarmTypes(farm.crops || []);
// console.log("This farm is categorized as:", farmTypes.join(", "));
// ```

// This function is flexible and easy to expand—just update the `typeCategories` map as your inventory grows.

// Let me know if you want me to write a UI badge or icon renderer for those types too. Could be a nice little visual flair!

// */