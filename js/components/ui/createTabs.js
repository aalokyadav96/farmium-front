import { createDivButton, createContainer } from "../eventHelper.js";
import { createElement } from "../../components/createElement.js";
import { getRouteState, setRouteState } from "../../state/state.js"; // optional: for tab memory

export function createTabs(tabs, routeKey = null) {
    const tabContainer = createContainer(["tabs-container"]);
    const tabButtons = createContainer(["tab-buttons"]);
    const tabContents = createContainer(["tab-contents"]);

    const tabContentMap = new Map(); // id → content container
    const buttonMap = new Map();     // id → button element

    // --- Create buttons and content containers ---
    tabs.forEach(({ id, title }, index) => {
        const contentContainer = createElement("article", {
            id,
            class: ["tab-content"]
        });

        const tabButton = createDivButton({
            text: title,
            classes: ["tab-button"],
            events: {
                click: () => activateTab(id)
            }
        });

        tabButtons.appendChild(tabButton);
        tabContents.appendChild(contentContainer);

        tabContentMap.set(id, contentContainer);
        buttonMap.set(id, tabButton);
    });

    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(tabContents);

    // --- Activate a tab by ID ---
    function activateTab(tabId) {
        tabs.forEach(({ id, render }) => {
            const btn = buttonMap.get(id);
            const content = tabContentMap.get(id);

            btn.classList.toggle("active", id === tabId);
            content.classList.toggle("active", id === tabId);

            if (id === tabId && !content.dataset.rendered) {
                render(content);
                content.dataset.rendered = "true";
            }
        });

        if (routeKey) {
            const tabState = getRouteState(routeKey);
            tabState.activeTab = tabId;
            setRouteState(routeKey, tabState);
        }
    }

    // --- Activate initial tab ---
    let initialTab = tabs[0]?.id;
    if (routeKey) {
        const saved = getRouteState(routeKey);
        if (saved?.activeTab && tabContentMap.has(saved.activeTab)) {
            initialTab = saved.activeTab;
        }
    }

    if (initialTab) activateTab(initialTab);

    return tabContainer;
}
