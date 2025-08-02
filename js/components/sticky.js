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

// // Utility: create single icon button
// function createIconButton(classSuffix, svgMarkup, onClick) {
//   const iconWrapper = createElement("span", {}, []);
//   iconWrapper.insertAdjacentHTML("beforeend", svgMarkup);

//   const button = createElement("div", {
//     class: `logoicon ${classSuffix}`,
//   }, [iconWrapper]);

//   button.addEventListener("click", (e) => {
//     e.preventDefault();
//     onClick?.();
//   });

//   return button;
// }

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

// import { createElement } from "./createElement.js";
// import {
//   notifSVG,
//   cartSVG,
//   chatSVG,
//   arrowLeftSVG,
//   searchSVG
// } from "./svgs.js";
// import { navigate } from "../routes/index.js";
// import { getState, subscribe } from "../state/state.js";
// import { openNotificationsModal } from "../services/notifications/notifModal.js";
// import { openCartModal } from "../services/cart/cartModal.js"; // Assumes you have this

// let stickyContainer = null;

// function createIconButton(classSuffix, svgMarkup, onClick) {
//   const iconWrapper = createElement("span", {}, []);
//   iconWrapper.insertAdjacentHTML("beforeend", svgMarkup);

//   const button = createElement("div", {
//     class: `logoicon ${classSuffix}`,
//   }, [iconWrapper]);

//   button.addEventListener("click", (e) => {
//     e.preventDefault();
//     onClick?.();
//   });

//   return button;
// }

// // const stickyStyle = createElement("style", {}, [``]);

// function renderNav(isLoggedIn) {
//   const nav = createElement("div", { class: "plypzstp" }, [
//     createIconButton("pause", arrowLeftSVG, () => history.back()),
//     createIconButton("dld", searchSVG, () => navigate("/search")),
//   ]);

//   if (isLoggedIn) {
//     nav.appendChild(createIconButton("play", chatSVG, () => navigate("/chats")));
//     nav.appendChild(createIconButton("stop", notifSVG, openNotificationsModal));
//     nav.appendChild(createIconButton("edit", cartSVG, openCartModal));
//   }

//   return nav;
// }

// export function Sticky() {
//   if (stickyContainer) return stickyContainer;

//   stickyContainer = createElement("div", {"class":"hflexcen"}, []);
//   stickyContainer.appendChild(renderNav(!!getState("user")));
// //   stickyContainer.appendChild(stickyStyle);

//   subscribe("user", (val) => {
//     const updatedNav = renderNav(!!val);
//     stickyContainer.replaceChild(updatedNav, stickyContainer.firstChild);
//   });

//   return stickyContainer;
// }

// export { Sticky as sticky };

// // import { createElement } from "./createElement.js";
// // import { plusCircleSVG, notifSVG, cartSVG, chatSVG, arrowLeftSVG, homeSVG, searchSVG } from "./svgs.js";
// // import { navigate } from "../routes/index.js";
// // import { getState, subscribe } from "../state/state.js";

// // let stickyContainer = null;

// // function createIconButton(classSuffix, svgMarkup, onClick) {
// //     const iconWrapper = createElement("span", {}, []);
// //     iconWrapper.insertAdjacentHTML("beforeend", svgMarkup);

// //     const button = createElement("button", {
// //         class: `logoicon ${classSuffix}`,
// //     }, [iconWrapper]);

// //     button.addEventListener("click", (e) => {
// //         e.preventDefault();
// //         onClick?.();
// //     });

// //     return button;
// // }

// // const stickyStyle = createElement("style", {}, [`
// // .plypzstp {
// //     border-top: 1px solid #ddd;
// //     bottom: 0;
// //     position: fixed;
// //     z-index: 10;
// //     width: 100%;
// //     display: flex;
// //     background-color: var(--color-bg);
// //     justify-content: space-between;
// // }
// // .logoicon {
// //     margin: 0 0.2rem;
// //     align-items: center;
// //     background: none;
// // }
// // .play, .pause, .stop, .dld, .edit {
// //     border: none;
// //     cursor: pointer;
// //     height: 48px;
// //     outline: none;
// //     padding: 0;
// //     width: 48px;
// // }`]);

// // function renderNav(isLoggedIn) {
// //     const nav = createElement("div", { class: "plypzstp" }, [
// //         createIconButton("pause", arrowLeftSVG, () => history.back()),
// //         createIconButton("dld", searchSVG, () => navigate("/search")),
// //     ]);

// //     if (isLoggedIn) {
// //         nav.appendChild(createIconButton("play", chatSVG, () => navigate("/chats")));
// //         nav.appendChild(createIconButton("stop", notifSVG, () => navigate("/notifications")));
// //         nav.appendChild(createIconButton("edit", cartSVG, () => navigate("/cart")));
// //     }

// //     return nav;
// // }

// // export function Sticky() {
// //     if (stickyContainer) return stickyContainer;

// //     stickyContainer = createElement("div", {}, []);
// //     stickyContainer.appendChild(renderNav(!!getState("user")));
// //     stickyContainer.appendChild(stickyStyle);

// //     subscribe("user", (val) => {
// //         const updatedNav = renderNav(!!val);
// //         stickyContainer.replaceChild(updatedNav, stickyContainer.firstChild);
// //     });

// //     return stickyContainer;
// // }

// // export {Sticky as sticky};
