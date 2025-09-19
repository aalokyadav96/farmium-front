import { createElement } from "./createElement.js";
import { notifSVG, cartSVG, chatSVG, homeSVG, searchSVG } from "./svgs.js";
import { navigate } from "../routes/index.js";
import { getState, subscribeDeep } from "../state/state.js";
import { openNotificationsModal } from "../services/notifications/notifModal.js";
import { createIconButton } from "../utils/svgIconButton.js";
// import { openCartModal } from "../services/cart/cartModal.js";

// --- Update container children based on login state
function updateNav(container) {
  const isLoggedIn = !!getState("token"); // use token for reactive auth

  container.innerHTML = "";

  container.appendChild(createIconButton({
    classSuffix: "pause",
    svgMarkup: homeSVG,
    onClick: () => navigate("/home"),
    label: "" // ✅ no text
  }));

  container.appendChild(createIconButton({
    classSuffix: "dld",
    svgMarkup: searchSVG,
    onClick: () => navigate("/search"),
    label: "" // ✅ no text
  }));

  if (isLoggedIn) {
    container.appendChild(createIconButton({
      classSuffix: "play",
      svgMarkup: chatSVG,
      onClick: () => navigate("/merechats"),
      // onClick: () => navigate("/discord"),
      label: ""
    }));

    container.appendChild(createIconButton({
      classSuffix: "stop",
      svgMarkup: notifSVG,
      onClick: openNotificationsModal,
      label: ""
    }));

    // container.appendChild(createIconButton({classSuffix:"edit", svgMarkup: cartSVG,onClick: openCartModal}));
    container.appendChild(createIconButton({
      classSuffix: "edit",
      svgMarkup: cartSVG,
      onClick: () => navigate("/cart"),
      label: ""
    }));
  }
}

// --- Sticky container (reactive)
export function Sticky() {
  const container = createElement("div", { class: "plypzstp" });

  updateNav(container);

  // Subscribe to token changes instead of user directly
  const unsub = subscribeDeep("token", () => updateNav(container));

  // Optional: cleanup if container is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      unsub?.();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return container;
}

export { Sticky as sticky };
