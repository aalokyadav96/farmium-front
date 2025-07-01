import { navigate } from "../routes/index.js";

function handleNavigation(event, href) {
    event.preventDefault();
    navigate(href);
}

function createMenuItem(href, label) {
    const li = document.createElement("li");
    li.className = "footlincon";

    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.textContent = label;
    anchor.className = "footlink";

    anchor.addEventListener("click", (e) => handleNavigation(e, href));

    li.appendChild(anchor);
    return li;
}

function createNavAndSidebar(container, isLoggedIn) {

    // Sidebar Items
    const sidebarItems = isLoggedIn
        ? [
              { href: '/chat', label: 'Chat' },
              { href: '/crowdfunding', label: 'Crowdfunding' },
              { href: '/donations', label: 'Donations' },
              { href: '/analytics', label: 'Analytics' },
              { href: '/streaming', label: 'Streaming' },
              { href: '/forums', label: 'Forums' },
          ]
        : [
              { href: '/gigs', label: 'Gigs' },
          ];

    // Create Sidebar
    const sidebarElement = document.createElement("div");
    sidebarElement.className = "sidebar";

    const sidebarTitle = document.createElement("h2");
    sidebarTitle.textContent = "Menu";
    sidebarElement.appendChild(sidebarTitle);

    const sidebarMenuList = document.createElement("ul");
    sidebarMenuList.className = "menu-list";

    // Add Sidebar Items
    sidebarItems.forEach((item) =>
        sidebarMenuList.appendChild(createMenuItem(item.href, item.label))
    );

    sidebarElement.appendChild(sidebarMenuList);

    // Clear the container and add both components
    // container.innerHTML = "";
    // container.appendChild(header);
    container.appendChild(sidebarElement);
}

export { createNavAndSidebar as sidebar };
