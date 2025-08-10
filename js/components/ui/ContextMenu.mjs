import "../../../css/ui/ContextMenu.css";

const ContextMenu = (() => {
  let menu = null;

  const createMenu = (options, x, y) => {
    removeMenu();

    menu = document.createElement("div");
    menu.className = "context-menu";
    menu.setAttribute("role", "menu");

    options.forEach(({ label, action, disabled = false }) => {
      const item = document.createElement("div");
      item.className = "menu-item";
      item.textContent = label;

      if (disabled) {
        item.classList.add("disabled");
      } else {
        item.tabIndex = 0;
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          action();
          removeMenu();
        });
        item.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            action();
            removeMenu();
          }
        });
      }

      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    positionMenu(x, y);
    setupEventListeners();
  };

  const positionMenu = (x, y) => {
    const { offsetWidth, offsetHeight } = menu;
    const { innerWidth, innerHeight } = window;

    menu.style.top = `${Math.min(y, innerHeight - offsetHeight)}px`;
    menu.style.left = `${Math.min(x, innerWidth - offsetWidth)}px`;
  };

  const setupEventListeners = () => {
    document.addEventListener("mousedown", removeMenu, { once: true });
    window.addEventListener("scroll", removeMenu, { once: true });
    window.addEventListener("resize", removeMenu, { once: true });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") removeMenu();
    }, { once: true });
  };

  const removeMenu = () => {
    if (menu) {
      menu.remove();
      menu = null;
    }
  };

  return createMenu;
})();


export default ContextMenu;

// import "../../../css/ui/ContextMenu.css";

// const ContextMenu = (() => {
//   let menu = null;

//   const createMenu = (options, x, y) => {
//     // Remove the existing menu
//     if (menu) removeMenu();

//     // Create new menu
//     menu = document.createElement("div");
//     menu.className = "context-menu";

//     options.forEach(({ label, action }) => {
//       const menuItem = document.createElement("div");
//       menuItem.className = "menu-item";
//       menuItem.textContent = label;
//       menuItem.addEventListener("click", (event) => {
//         event.stopPropagation();
//         action();
//         removeMenu();
//       });
//       menu.appendChild(menuItem);
//     });

//     document.body.appendChild(menu);
//     positionMenu(x, y);
//     setupEventListeners();
//   };

//   const positionMenu = (x, y) => {
//     // Ensure the menu stays within viewport
//     const menuWidth = menu.offsetWidth;
//     const menuHeight = menu.offsetHeight;
//     const viewportWidth = window.innerWidth;
//     const viewportHeight = window.innerHeight;

//     if (x + menuWidth > viewportWidth) x = viewportWidth - menuWidth;
//     if (y + menuHeight > viewportHeight) y = viewportHeight - menuHeight;

//     menu.style.cssText = `top: ${y}px; left: ${x}px;`;
//   };

//   const setupEventListeners = () => {
//     // Close menu on click outside
//     document.body.addEventListener("mousedown", removeMenu, { once: true });

//     // Close menu on Escape key
//     document.addEventListener("keydown", (event) => {
//       if (event.key === "Escape") removeMenu();
//     }, { once: true });
//   };

//   const removeMenu = () => {
//     if (menu) {
//       menu.remove();
//       menu = null;
//     }
//   };

//   return createMenu;
// })();

// export default ContextMenu;
