import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { editCrop } from "../crop/editCrop.js";
import Button from "../../../components/base/Button.js";
import { navigate } from "../../../routes/index.js";
import { addToCart } from "../../cart/addToCart.js";

// ─────────── Render the farm’s top‐level detail block ───────────
export function renderFarmDetails(farm, isCreator) {
  const daysAgo = getAgeInDays(farm.updatedAt);
  const freshness = daysAgo < 2
    ? "🟢 Updated today"
    : `🕒 Updated ${daysAgo} days ago`;

  const actions = createElement("div", { class: "farm-actions" });
  if (isCreator) {
    actions.append(
      Button("✏️ Edit", `edit-${farm.id}`, {
        click: () =>
          editFarm(true, farm, document.getElementById("farm-detail"))
      }),
      Button("🗑️ Delete", `delete-${farm.id}`, {
        click: async () => {
          if (!confirm(`Delete farm "${farm.name}"?`)) return;
          const res = await apiFetch(`/farms/${farm.id}`, "DELETE");
          if (res.success) navigate("/farms");
          else alert("Failed to delete.");
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

// ─────────── Crop summary (counts, avg price) ───────────
export function renderCropSummary(crops) {
  const total = crops.length;
  const inStock = crops.filter(c => c.quantity > 0).length;
  const avgPrice = (crops.reduce((sum, c) => sum + (c.price || 0), 0) / (total || 1))
    .toFixed(2);

  return createElement("div", { class: "crop-summary" }, [
    createElement("p", {}, [`🌱 ${total} crops`]),
    createElement("p", {}, [`📦 ${inStock} in stock`]),
    createElement("p", {}, [`💸 Avg. price: ₹${avgPrice}`])
  ]);
}

// ─────────── Emoji map of how many of each crop ───────────
export function renderCropEmojiMap(crops) {
  const emoji = ["🥔", "🌾", "🍅", "🌽", "🥬", "🍆"];
  const counts = {};
  crops.forEach(c => counts[c.name] = (counts[c.name] || 0) + 1);

  const blocks = Object.entries(counts).map(([name, cnt], i) =>
    createElement("p", {}, [`${emoji[i % emoji.length]} ${name}: ${cnt}`])
  );

  return createElement("div", { class: "crop-distribution" }, [
    createElement("h4", {}, ["🗺️ Crop Distribution"]),
    ...blocks
  ]);
}

// ─────────── Simple sort dropdown builder ───────────
export function createSortDropdown(onChange) {
  const opts = [
    ["name", "Sort by Name"],
    ["price", "Sort by Price"],
    ["quantity", "Sort by Quantity"],
    ["age", "Sort by Age"]
  ];
  const sel = createElement("select", { class: "crop-sort-select" },
    opts.map(([val, label]) => createElement("option", { value: val }, [label]))
  );
  sel.addEventListener("change", () => onChange(sel.value));
  return sel;
}

// ─────────── Render all crop‐cards for this farm ───────────
export async function renderCrops(
  farm, cropsContainer, farmId, mainContainer,
  isLoggedIn, sortBy = "name", isCreator = false
) {
  cropsContainer.innerHTML = "";

  if (!farm.crops?.length) {
    cropsContainer.append(createElement("p", {}, ["No crops listed yet."]));
    return;
  }

  const sorted = sortCrops(farm.crops, sortBy);
  for (const crop of sorted) {
    const card = createCropCard(crop, farm.farmName, farmId, mainContainer, isLoggedIn, isCreator);
    cropsContainer.appendChild(card);
  }
}

// ─────────── Individual crop card ───────────
// function createCropCard(crop, farm, farmId, mainContainer, isLoggedIn, isCreator) {
//   const card = createElement("div", { class: "crop-card" });

//   if (crop.imageUrl) {
//     card.appendChild(createElement("img", {
//       src: `${SRC_URL}${crop.imageUrl}`,
//       alt: crop.name
//     }));
//   }

//   const ageDesc       = crop.createdAt ? `${getAgeInDays(crop.createdAt)} days old` : "Unknown age";
//   const perishable    = crop.expiryDate ? `🧊 Expires: ${crop.expiryDate}` : "Stable";
//   const stockStatus   = crop.quantity <= 0 ? "❌ Out of Stock" : "✅ Available";

//   card.append(
//     createElement("h4", {}, [crop.name]),
//     createElement("p", {}, [`💰 ${crop.price} per ${crop.unit}`]),
//     createElement("p", {}, [`📦 Stock: ${crop.quantity}`]),
//     createElement("p", {}, [`📅 Harvested: ${crop.harvestDate || "Unknown"}`]),
//     createElement("p", {}, [`📆 ${perishable}`]),
//     createElement("p", {}, [`🕓 ${ageDesc}`]),
//     createElement("p", {}, [`📌 ${stockStatus}`])
//   );

//   if (crop.history?.length > 1) {
//     card.append(...createPriceHistoryToggle(crop.history));
//   }

//   if (isCreator) {
//     card.append(...createCreatorControls(crop, farmId, mainContainer));
//   } else {
//     card.append(...createUserControls(crop, farm.name, isLoggedIn));
//   }

//   return card;
// }
function createCropCard(crop, farmName, farmId, mainContainer, isLoggedIn, isCreator) {
  const card = createElement("div", { class: "crop-card" });

  if (crop.imageUrl) {
    card.appendChild(createElement("img", {
      src: `${SRC_URL}${crop.imageUrl}`,
      alt: crop.name
    }));
  }

  const formatDate = (isoStr) =>
    isoStr ? new Date(isoStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }) : "Unknown";

  const harvestDate = formatDate(crop.harvestDate);
  const expiryDate = formatDate(crop.expiryDate);
  const ageDesc = crop.createdAt ? `${getAgeInDays(crop.harvestDate)} days old` : "Unknown age";
  const perishable = crop.expiryDate ? `🧊 Expires: ${expiryDate}` : "Stable";
  const stockStatus = crop.quantity <= 0 ? "❌ Out of Stock" : "✅ Available";

  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(crop.price);

  card.append(
    createElement("h4", {}, [crop.name]),
    createElement("p", {}, [`💰 ${price} per ${crop.unit}`]),
    createElement("p", {}, [`📦 Stock: ${crop.quantity}`]),
    createElement("p", {}, [`📅 Harvested: ${harvestDate}`]),
    createElement("p", {}, [`📆 ${perishable}`]),
    createElement("p", {}, [`🕓 ${ageDesc}`]),
    createElement("p", {}, [`📌 ${stockStatus}`])
  );

  if (crop.history?.length > 1) {
    card.append(...createPriceHistoryToggle(crop.history));
  }

  if (isCreator) {
    card.append(...createCreatorControls(crop, farmId, mainContainer));
  } else {
    card.append(...createUserControls(crop, farmName, farmId, isLoggedIn));
  }

  return card;
}

// ─────────── Price history toggler ───────────
function createPriceHistoryToggle(history) {
  const toggle = createElement("button", {}, ["📈 Show Price History"]);
  const historyBlock = createElement("pre", { class: "price-history hidden" });
  historyBlock.textContent = history.map(p => `${p.date}: ₹${p.price}`).join("\n");
  toggle.addEventListener("click", () => historyBlock.classList.toggle("hidden"));
  return [toggle, historyBlock];
}

// ─────────── Creator controls (edit/delete) ───────────
function createCreatorControls(crop, farmId, mainContainer) {
  const editBtn = createElement("button", { class: "edit-btn" }, ["✏️ Edit"]);
  editBtn.onclick = () => {
    mainContainer.textContent = "";
    editCrop(farmId, crop, mainContainer);
  };

  const deleteBtn = createElement("button", { class: "btn btn-danger" }, ["🗑️ Delete"]);
  deleteBtn.onclick = async () => {
    if (!confirm(`Delete crop "${crop.name}"?`)) return;
    const res = await apiFetch(`/farms/${farmId}/crops/${crop.id}`, "DELETE");
    if (res.success) {
      const upd = await apiFetch(`/farms/${farmId}`);
      if (upd.success && upd.farm) {
        await renderCrops(upd.farm, document.querySelector(".crop-list"), farmId, mainContainer, true, "name", true);
      }
    } else {
      alert("❌ Failed to delete crop.");
    }
  };

  return [editBtn, deleteBtn];
}

// ─────────── User controls (quantity + add to cart) ───────────
export function createUserControls(crop, farmName, farmId, isLoggedIn) {
  let qty = 1;
  const qtyDisplay = createElement("span", { class: "quantity-value" }, [qty]);
  const inc = createElement("button", {}, ["+"]);
  const dec = createElement("button", {}, ["−"]);
  inc.onclick = () => { qty++; qtyDisplay.textContent = qty; };
  dec.onclick = () => { if (qty > 1) { qty--; qtyDisplay.textContent = qty; } };

  const qtyWrap = createElement("div", { class: "quantity-control" }, [dec, qtyDisplay, inc]);
  const addBtn = createElement("button", { class: "a2c-crop" }, ["🛒 Add to Cart"]);
  addBtn.onclick = () => addToCart({
    category: "crops",
    item: crop.name,
    unit: crop.unit,
    farm: farmName,
    farmid: farmId,
    quantity: qty,
    price: crop.price,
    isLoggedIn
  });

  return [
    createElement("label", {}, ["Quantity:"]),
    qtyWrap,
    addBtn
  ];
}

// ─────────── Sorting helper ───────────
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

// ─────────── Utility: days since a date ───────────
function getAgeInDays(dateStr) {
  const msPerDay = 1000 * 3600 * 24;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / msPerDay);
  return isNaN(days) ? 0 : days;
}
