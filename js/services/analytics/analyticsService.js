import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import Notify from "../../components/ui/Notify.mjs";

/**
 * Renders the analytics page for any entity type
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to render analytics into
 * @param {boolean} options.isLoggedIn - Whether the user is logged in
 * @param {string} options.entityType - "events", "places", "blog", "product", etc.
 * @param {string|null} options.entityId - Specific entity ID, or null for overall analytics
 */
export async function renderAnalyticsPage({ container, isLoggedIn, entityType = "events", entityId = null }) {
    if (!container) return;
    container.innerHTML = ""; // Clear previous content

    if (!isLoggedIn) {
        Notify("Please log in to view analytics.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    try {
        const endpoint = entityId
            ? `/antics/${entityType}/${entityId}`
            : `/antics/${entityType}/all`;

        const data = await apiFetch(endpoint);

        if (!data || !data.metrics) {
            Notify("Analytics data is empty.", { type: "warning", dismissible: true });
            return;
        }

        container.appendChild(renderAnalytics(data));
    } catch (err) {
        Notify("Failed to load analytics data.", { type: "error", dismissible: true });
        console.error(err);
    }

    function renderAnalytics(data) {
        // Safely extract metrics
        const metrics = data.metrics || {};

        // Summary cards
        const summaryCards = createElement(
            "div",
            { class: "analytics-summary-cards" },
            Object.keys(metrics).map(k =>
                createElement("div", { class: "analytics-card" }, [
                    createElement("h4", {}, [k]),
                    createElement("p", {}, [String(metrics[k])])
                ])
            )
        );

        // Trend placeholder
        const trend = createElement(
            "div",
            { class: "analytics-trend" },
            createElement("p", {}, ["[Trend chart placeholder: last 7 days]"])
        );

        return createElement("div", { class: "analytics-page" }, [summaryCards, trend]);
    }
}
