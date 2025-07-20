import "../../../css/ui/MegaMenuC.css";
import { createElement } from "../../components/createElement.js";

const MegaMenuC = () => {
  const menuWrapper = createElement("nav", { class: "mega-menu-c" });

  const menuItems = [
    {
      title: "Products",
      links: [
        { label: "All Products", href: "/products" },
        { label: "Categories", href: "/products/categories" },
        { label: "New Arrivals", href: "/products/new" }
      ]
    },
    {
      title: "Tools",
      links: [
        { label: "All Tools", href: "/tools" },
        { label: "Rent Tools", href: "/tools/rent" },
        { label: "Sell Tools", href: "/tools/sell" }
      ]
    },
    {
      title: "Crops",
      links: [
        { label: "Catalogue", href: "/catalogue" },
        { label: "Seasonal", href: "/crops/seasonal" },
        { label: "By Region", href: "/crops/region" }
      ]
    },
    {
      title: "Account",
      links: [
        { label: "Profile", href: "/account" },
        { label: "Orders", href: "/account/orders" },
        { label: "Logout", href: "/logout" }
      ]
    }
  ];

  menuItems.forEach(({ title, links }) => {
    const section = createElement("div", { class: "menu-section" });

    const header = createElement("div", { class: "menu-header" }, [
      title,
      createElement("span", { class: "toggle-icon" }, ["➤"])
    ]);

    const list = createElement(
      "ul",
      { class: "submenu hidden" },
      links.map(link =>
        createElement("li", {}, [
          createElement("a", { href: link.href }, [link.label])
        ])
      )
    );

    header.onclick = () => {
      list.classList.toggle("hidden");
      header.classList.toggle("open");
    };

    section.appendChild(header);
    section.appendChild(list);
    menuWrapper.appendChild(section);
  });

  return menuWrapper;
};

export default MegaMenuC;
