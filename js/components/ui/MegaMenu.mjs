import "../../../css/ui/MegaMenu.css";
import { createElement } from "../../components/createElement.js";

const MegaMenu = () => {
  const nav = createElement("nav", { class: "mega-menu" },[]);

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

  const list = createElement("ul", { class: "menu-root" });

  for (const item of menuItems) {
    const category = createElement("li", { class: "menu-category" }, [
      createElement("span", { class: "menu-title" }, [item.title]),
      createElement(
        "ul",
        { class: "submenu" },
        item.links.map(link =>
          createElement("li", {}, [
            createElement("a", { href: link.href }, [link.label])
          ])
        )
      )
    ]);

    list.appendChild(category);
  }

  nav.appendChild(list);
  return nav;
};

export default MegaMenu;
