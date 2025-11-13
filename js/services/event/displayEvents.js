import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import Imagex from "../../components/base/Imagex.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { displayListingPage } from "../../utils/displayListingPage.js"; // generic listing page
import Datex from "../../components/base/Datex.js";

export function displayEvents(isLoggedIn, container) {
  container.replaceChildren();

  displayListingPage(container, {
    title: "All Events",
    apiEndpoint: "/events/events?page=1&limit=1000",
    cardBuilder: createEventCard,
    type: "events",
    pageSize: 10,
    sidebarActions: aside => {
      aside.appendChild(createElement("h3", {}, ["Actions"]));
      aside.append(
        Button("Create Event", "crt-evnt", { click: () => navigate("/create-event") }, "buttonx primary"),
        Button("Browse Artists", "artsts-brws", { click: () => navigate("/artists") }, "buttonx primary"),
        Button("My Events", "btn-my-events", { click: () => navigate("/my-events") }, "buttonx secondary"),
        Button("Event Calendar", "btn-event-calendar", { click: () => navigate("/event-calendar") }, "buttonx secondary")
      );
    }
  });
}

function createEventCard(ev) {
  const minPrice = Array.isArray(ev.prices) ? Math.min(...ev.prices) : 0;
  const currency = ev.currency || "USD";
  const priceDisplay = minPrice > 0 ? `${currency} ${minPrice}` : "Free";

  const isPast = new Date(ev.date).getTime() < Date.now();
  const savedEvents = getSavedEvents();
  let isSaved = savedEvents.includes(ev.eventid);

  const saveToggle = createElement("span", {
    title: "Save Event",
    style: `cursor:pointer;font-size:18px;color:${isSaved ? "gold" : "gray"};margin-left:auto;`,
    onclick: e => {
      e.preventDefault();
      e.stopPropagation();
      toggleSaveEvent(ev.eventid);
      isSaved = !isSaved;
      saveToggle.textContent = isSaved ? "★" : "☆";
      saveToggle.style.color = isSaved ? "gold" : "gray";
    }
  }, [isSaved ? "★" : "☆"]);

  const shareBtn = createElement("button", {
    type: "button",
    style: "font-size:12px;margin-top:4px;",
    onclick: e => {
      e.preventDefault();
      navigator.clipboard.writeText(`${location.origin}/event/${ev.eventid}`);
      shareBtn.textContent = "Link Copied";
      setTimeout(() => shareBtn.textContent = "Share", 1500);
    }
  }, ["Share"]);

  const statusLabel = createElement("span", {
    style: `font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${isPast ? "#888" : "#28a745"};color:white;margin-left:8px;`
  }, [isPast ? "Past" : "Upcoming"]);

  const bannerUrl = resolveImagePath(EntityType.EVENT, PictureType.THUMB, ev.banner);
  const bannerImg = Imagex({ src: bannerUrl, alt: `${ev.title || "Event"} Banner`, loading: "lazy", style: "width:100%;aspect-ratio:16/9;object-fit:cover;" });

  const bannerLink = createElement("a", { class: "event-link", events: {
    click: () => {navigate(`/event/${ev.eventid}`)}
  } }, [bannerImg]);

  const eventInfo = createElement("div", { class: "event-info" }, [
    createElement("div", { style: "display:flex;align-items:center;gap:8px;" }, [
      createElement("h2", {}, [ev.title || "Untitled"]),
      statusLabel,
      saveToggle
    ]),
    // createElement("p", {}, [
    //   createElement("strong", {}, ["Date: "]),
    //   new Date(ev.date).toLocaleString("en-GB", {
    //     day: "2-digit",
    //     month: "2-digit",
    //     year: "numeric",
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     second: "2-digit",
    //     hour12: true
    //   })
    // ]),    
    // // createElement("p", {}, [createElement("strong", {}, ["Date: "]), new Date(ev.date).toLocaleString()]),
    createElement("p", {}, [createElement("strong", {}, ["Date: "]), Datex(ev.date)]),
    createElement("p", {}, [createElement("strong", {}, ["Place: "]), ev.placename || "-"]),
    createElement("p", {}, [createElement("strong", {}, ["Category: "]), ev.category || "-"]),
    createElement("p", {}, [createElement("strong", {}, ["Price: "]), priceDisplay]),
    shareBtn
  ]);

  return createElement("div", { class: "event-card" }, [bannerLink, eventInfo]);
}

function getSavedEvents() {
  try { return JSON.parse(localStorage.getItem("saved_events") || "[]"); }
  catch { return []; }
}

function toggleSaveEvent(id) {
  let saved = getSavedEvents();
  saved = saved.includes(id) ? saved.filter(eid => eid !== id) : [...saved, id];
  localStorage.setItem("saved_events", JSON.stringify(saved));
}
