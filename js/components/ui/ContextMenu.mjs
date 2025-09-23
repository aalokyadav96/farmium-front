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
