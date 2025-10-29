import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { editCrop } from "../crop/editCrop.js";
import Button from "../../../components/base/Button.js";
import { navigate } from "../../../routes/index.js";
import { addToCart } from "../../cart/addToCart.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { editFarm } from "./editFarm.js";
import Bannerx from "../../../components/base/Bannerx.js";
// import { renderListingCard } from "../crop/renderListingCard.js";

// ─────────── Render the farm’s top‐level detail block ───────────
export function renderFarmDetails(farm, isCreator) {
  const daysAgo = getAgeInDays(farm.updatedAt);
  let freshness;
  if (daysAgo < 2) freshness = "🟢 Updated today";
  else if (daysAgo < 7) freshness = "🟡 Updated this week";
  else freshness = `🔴 Updated ${daysAgo} days ago`;

  const actions = createElement("div", { class: "farm-actions" });
  if (isCreator) {
    actions.append(
      Button("✏️ Edit", `edit-${farm.farmid}`, {
        click: () => editFarm(true, farm, document.getElementById("farm-detail"))
      }, "buttonx"),
      Button("🗑️ Delete", `delete-${farm.farmid}`, {
        click: async () => {
          if (!confirm(`Delete farm "${farm.name}"?`)) return;
          const res = await apiFetch(`/farms/${farm.farmid}`, "DELETE");
          if (res.success) navigate("/farms");
          else alert("Failed to delete.");
        }
      }, "buttonx")
    );
  }

  return createElement("div", { id: "farm-detail", class: "farm-detail" }, [
    createElement("h2", {}, [farm.name]),
    createElement("p", {}, [`📍 Location: ${farm.location}`]),
    createElement("p", {}, [`📃 Description: ${farm.description}`]),
    createElement("p", {}, [`👤 Owner: ${farm.owner}`]),
    createElement("p", {}, [`📞 Contact: ${farm.contact}`]),
    farm.practice ? createElement("p", {}, [`🌱 Practice: ${farm.practice}`]) : null,
    farm.social ? createElement("p", {}, [
      "🔗 ",
      createElement("a", { href: farm.social, target: "_blank", rel: "noopener" }, ["Visit farm page"])
    ]) : null,
    createElement("p", {}, [`🕒 Availability: ${farm.availabilityTiming}`]),
    createElement("p", {}, [freshness]),
    actions
  ].filter(Boolean));
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
  farm, cropsContainer, farmId, mainCon, editcon,
  isLoggedIn, sortBy = "name", isCreator = false
) {
  cropsContainer.replaceChildren();

  if (!farm.crops?.length) {
    cropsContainer.append(createElement("p", {}, ["No crops listed yet."]));
    return;
  }

  const sorted = sortCrops(farm.crops, sortBy);
  for (const crop of sorted) {
    const card = createCropCard(crop, farm.farmName, farmId, mainCon, editcon, isLoggedIn, isCreator);
    // const card = renderListingCard(crop, crop.name, isLoggedIn);
    cropsContainer.appendChild(card);
  }
}


function createCropBannerSection(crop, isCreator) {
  return Bannerx({
    isCreator : isCreator,
    bannerkey : crop.banner,
    banneraltkey : `Banner for ${crop.name || "Crop"}`,
    bannerentitytype : EntityType.CROP,
    stateentitykey : "crop",
    bannerentityid : crop.cropid
  });
}

// ─────────── Individual crop card ───────────
function createCropCard(crop, farmName, farmId, mainCon, editcon, isLoggedIn, isCreator) {
  const card = createElement("div", { class: "crop-card" });

const banner = createCropBannerSection(crop, isCreator); 
  // const img = Imagex({
  //   src: resolveImagePath(EntityType.CROP, PictureType.THUMB, crop.imageUrl),
  //   alt: crop.name,
  //   class: "crop__image"
  // });

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
    banner,
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
    card.append(...createCreatorControls(crop, farmId, mainCon, editcon));
  } else {
    card.append(...createUserControls(crop, farmName, farmId, isLoggedIn));
  }

  return card;
}

// ─────────── Price history toggler ───────────
function createPriceHistoryToggle(history) {
  const toggle = createElement("button", {}, ["📈 Show Price History"]);
  const historyBlock = createElement("pre", { class: "price-history hidden" }, [
    history.map(p => `${p.date}: ₹${p.price}`).join("\n")
  ]);
  toggle.addEventListener("click", () => historyBlock.classList.toggle("hidden"));
  return [toggle, historyBlock];
}

// ─────────── Creator controls (edit/delete) ───────────
function createCreatorControls(crop, farmId, mainCon, editcon) {
  const editBtn = Button("✏️ Edit", "", {
    click: () => {
      editcon.replaceChildren();
      editCrop(farmId, crop, editcon);
    }
  }, "edit-btn buttonx");

  const deleteBtn = Button("🗑️ Delete", "", {
    click: async () => {
      if (!confirm(`Delete crop "${crop.name}"?`)) return;
      const res = await apiFetch(`/farms/${farmId}/crops/${crop.id}`, "DELETE");
      if (res.success) {
        const upd = await apiFetch(`/farms/${farmId}`);
        if (upd.success && upd.farm) {
          await renderCrops(upd.farm, document.querySelector(".crop-list"), farmId, mainCon, editcon, true, "name", true);
        }
      } else {
        alert("❌ Failed to delete crop.");
      }
    }
  }, "btn-danger buttonx");

  return [editBtn, deleteBtn];
}

// ─────────── User controls (quantity + add to cart) ───────────
export function createUserControls(crop, farmName, farmId, isLoggedIn) {
  let quantity = 1;
  const qtyDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);
  const inc = createElement("button", {}, ["+"]);
  const dec = createElement("button", {}, ["−"]);
  inc.onclick = () => { quantity++; qtyDisplay.replaceChildren(String(quantity)); };
  dec.onclick = () => { if (quantity > 1) { quantity--; qtyDisplay.replaceChildren(String(quantity)); } };

  const qtyWrap = createElement("div", { class: "quantity-control" }, [dec, qtyDisplay, inc]);

  const handleAddToCart = () => {
    addToCart({
      category: "crops",
      itemName: crop.name,
      itemId: crop.cropid,
      itemType: crop.breed,
      entityName: farmName,
      entityId: farmId,
      entityType: "farm",
      quantity,
      price: crop.pricePerKg,
      unit: "kg",
      isLoggedIn
    });
  };

  return [
    createElement("label", {}, ["Quantity:"]),
    qtyWrap,
    Button("Add-To-Cart", "a2c-crop-crd", { click: handleAddToCart }, "buttonx")
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
