import { createElement } from "./createElement.js";
import {
  notifSVG,
  cartSVG,
  chatSVG,
  arrowLeftSVG,
  searchSVG,
  homeSVG
} from "./svgs.js";
import { navigate } from "../routes/index.js";
import { getState, subscribe } from "../state/state.js";
import { openNotificationsModal } from "../services/notifications/notifModal.js";
import { openCartModal } from "../services/cart/cartModal.js";


// Utility: create single icon button
function createIconButton(classSuffix, svgMarkup, onClick) {
  const button = createElement("div", {
    class: `logoicon ${classSuffix}`,
  }, []);

  button.insertAdjacentHTML("beforeend", svgMarkup);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    onClick?.();
  });

  return button;
}

// Main render function that updates children of container directly
function updateNav(container, isLoggedIn) {
  container.innerHTML = ""; // keep container, wipe internals only

  // container.appendChild(
  //   createIconButton("pause", arrowLeftSVG, () => history.back())
  // );
  container.appendChild(
    createIconButton("pause", homeSVG, () => navigate("/home"))
  );
  container.appendChild(
    createIconButton("dld", searchSVG, () => navigate("/search"))
  );

  if (isLoggedIn) {
    container.appendChild(
      createIconButton("play", chatSVG, () => navigate("/chats"))
    );
    container.appendChild(
      createIconButton("stop", notifSVG, openNotificationsModal)
    );
    container.appendChild(
      createIconButton("edit", cartSVG, openCartModal)
    );
  }
}

// Sticky returns a persistent container, updates children on state change
export function Sticky() {
  const container = createElement("div", { class: "plypzstp" });

  updateNav(container, !!getState("user"));

  subscribe("user", (val) => {
    updateNav(container, !!val);
  });

  return container;
}

export { Sticky as sticky };
