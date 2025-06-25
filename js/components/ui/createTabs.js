import { createDivButton, createContainer } from "../eventHelper.js";
import { createElement } from "../../components/createElement.js";

export function createTabs(tabs) {
    const tabContainer = createContainer(["tabs-container"]);
    const tabButtons = createContainer(["tab-buttons"]);
    const tabContents = createContainer(["tab-contents"]);

    // Create containers for tab content
    const tabContentContainers = tabs.map(({ id }) =>
        createElement("article", { id, class: ["tab-content"] })
    );

    tabs.forEach(({ title, id, render }, index) => {
        const tabButton = createDivButton({
            text: title,
            classes: ["tab-button"],
            events: { click: () => activateTab(id, render, tabContentContainers[index]) },
        });

        // Mark the first tab as active
        if (index === 0) {
            tabButton.classList.add("active");
        }

        tabButtons.appendChild(tabButton);
        tabContents.appendChild(tabContentContainers[index]);
    });

    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(tabContents);

    function activateTab(tabId, renderContent, contentContainer) {
        // Update active button styles
        document.querySelectorAll(".tab-button").forEach((btn, index) => {
            btn.classList.toggle("active", tabs[index].id === tabId);
        });

        // Show/hide the correct tab content
        document.querySelectorAll(".tab-content").forEach((content) => {
            content.classList.toggle("active", content.id === tabId);
        });

        // Ensure the correct content container is updated
        const activeTabContent = document.querySelector(`#${tabId}`);
        if (activeTabContent && !activeTabContent.contains(contentContainer)) {
            activeTabContent.innerHTML = "";
            activeTabContent.appendChild(contentContainer);
        }

        // Render the content only if it's not already loaded
        if (contentContainer && !contentContainer.innerHTML.trim()) {
            renderContent(contentContainer);
        }
    }

    // Activate the first tab on load
    if (tabs.length > 0) {
        const firstTab = tabs[0];
        activateTab(firstTab.id, firstTab.render, tabContentContainers[0]);
        tabContentContainers[0].classList.add("active"); // Ensure first tab content is visible
    }

    return tabContainer;
}
