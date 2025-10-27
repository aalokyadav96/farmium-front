import "../../css/subpages/controlcenter.css";
import { createElement } from "../components/createElement.js";
import { navigate } from "../routes/index.js";

let controlCenter = null;
let isOpen = false;
let startY = 0;
let currentY = 0;

function buildControlCenter() {
  // --- Personal Hub ---
  const profileName = createElement("div", { class: "cc-profile-name" }, ["Guest User"]);
  const editProfile = createElement("button", { class: "cc-small-btn" }, ["Edit Profile"]);
  editProfile.addEventListener("click", () => navigate("/profile"));

  const logoutBtn = createElement("button", { class: "cc-small-btn" }, ["Logout"]);
  logoutBtn.addEventListener("click", () => alert("Logging out..."));

  const personalHub = createElement("div", { class: "cc-personal-hub" }, [
    createElement("div", { class: "cc-avatar" }),
    profileName,
    createElement("div", { class: "cc-btn-row" }, [editProfile, logoutBtn])
  ]);

  // --- Live Tiles Section ---
  const tilesData = [
    // { label: "Today’s Event", value: "No upcoming events" },
    // { label: "Now Playing", value: "Nothing playing" },
    { label: "Weather", value: "Clear, 22°C" },
    // { label: "Unread Posts", value: "3 new posts" },
  ];

  const tiles = tilesData.map(tile =>
    createElement("div", { class: "cc-live-tile" }, [
      createElement("div", { class: "cc-tile-label" }, [tile.label]),
      createElement("div", { class: "cc-tile-value" }, [tile.value])
    ])
  );

  const liveTiles = createElement("div", { class: "cc-tiles" }, tiles);

  // --- Navigation Links ---
  const links = [
    // { href: "/baitos", label: "Baito" },
    // { href: "/grocery", label: "Grocery" },
    // { href: "/baitos/hire", label: "Hire" },
    // { href: "/places", label: "Places" },
    // { href: "/events", label: "Events" },
    // { href: "/social", label: "Social" },
    // { href: "/posts", label: "Posts" },
    // { href: "/itinerary", label: "Itinerary" },
    { href: "/crops", label: "Crops" },
    { href: "/farms", label: "Farms" },
    { href: "/dash", label: "Dash" },
    { href: "/recipes", label: "Recipes" },
    { href: "/products", label: "Products" },
    { href: "/tools", label: "Tools" },
    { href: "/music", label: "Music" },
    // { href: "/artists", label: "Artists" },
  ];

  const linkEls = links.map(link => {
    const el = createElement("button", { class: "cc-nav-link" }, [link.label]);
    el.addEventListener("click", () => {
      navigate(link.href);
      closeControlCenter();
    });
    return el;
  });

  const navGrid = createElement("div", { class: "cc-nav-grid" }, linkEls);

  // --- Scrollable Content Wrapper ---
  const scrollArea = createElement("div", { class: "cc-scroll" }, [
    createElement("div", { class: "cc-handle" }),
    personalHub,
    liveTiles,
    navGrid,
  ]);

  // --- Close Button (fixed) ---
  const closeBtn = createElement("button", { class: "cc-close" }, ["✕"]);
  closeBtn.addEventListener("click", closeControlCenter);

  controlCenter = createElement("div", { class: "control-center hidden" }, [
    closeBtn,
    scrollArea,
  ]);

  document.getElementById('app').appendChild(controlCenter);

  // --- Touch Gesture for closing ---
  controlCenter.addEventListener("touchstart", e => (startY = e.touches[0].clientY));
  controlCenter.addEventListener("touchmove", e => {
    currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY);
    if (diff > 0) controlCenter.style.transform = `translateY(${diff}px)`;
  });
  controlCenter.addEventListener("touchend", () => {
    const diff = currentY - startY;
    if (diff > 100) closeControlCenter();
    else controlCenter.style.transform = "";
  });
}

export function toggleControlCenter() {
  if (!controlCenter) buildControlCenter();
  isOpen ? closeControlCenter() : openControlCenter();
}

function openControlCenter() {
  isOpen = true;
  controlCenter.classList.remove("hidden");
  requestAnimationFrame(() => controlCenter.classList.add("open"));
  document.body.style.overflow = "hidden";
}

function closeControlCenter() {
  isOpen = false;
  controlCenter.classList.remove("open");
  controlCenter.addEventListener(
    "transitionend",
    () => {
      controlCenter.classList.add("hidden");
      controlCenter.style.transform = "";
    },
    { once: true }
  );
  document.body.style.overflow = "";
}


export { toggleControlCenter as toggleSidebar };

