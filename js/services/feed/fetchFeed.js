import { apiFetch } from "../../api/api.js";
import { renderNewPost } from "./renderNewPost.js";
import { createTabs } from "../../components/ui/createTabs.js";
import { createElement } from "../../components/createElement.js";
import { persistTabs } from "../../utils/persistTabs.js";

/**
 * Preferred tab order
 */
const preferredOrder = ["text", "image", "video", "audio", "blog"];

/**
 * Fetch feed data and create tabs based on post types dynamically, ordered by preference
 */
export async function setupFeedTabs(container) {
    const response = await apiFetch("/feed/feed");

    if (!response.ok || !Array.isArray(response.data)) {
        container.appendChild(createElement("p", {}, ["Error loading posts."]));
        return;
    }

    const posts = response.data;

    // Group posts by normalized type
    const grouped = new Map();

    posts.forEach(post => {
        const type = normalizePostType(post.type);
        if (!grouped.has(type)) grouped.set(type, []);
        grouped.get(type).push(post);
    });

    // Sort by preferred order first, then append any unknown types
    const sortedTypes = [
        ...preferredOrder.filter(type => grouped.has(type)),
        ...[...grouped.keys()].filter(type => !preferredOrder.includes(type))
    ];

    const tabs = sortedTypes.map(type => {
        const postsOfType = grouped.get(type);

        return {
            id: `${type}-tab`,
            title: capitalize(type),
            render: tabContent => {
                if (!postsOfType.length) {
                    tabContent.appendChild(createElement("p", {}, [`No ${type} posts.`]));
                    return;
                }

                postsOfType
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .forEach((post, i) => renderNewPost(post, i, tabContent));
            }
        };
    });

    persistTabs(container, tabs, `feed-tabs`);
    // const tabsElement = createTabs(tabs, "feedTabs");
    // container.appendChild(tabsElement);
}

/**
 * Normalize post types into known logical buckets
 */
function normalizePostType(type) {
    switch (type) {
        case "blog":
        case "image":
        case "video":
        case "audio":
        case "text":
            return type;
        default:
            return "text"; // fallback bucket for unknowns
    }
}

/**
 * Capitalize a string (for tab titles)
 */
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

export {setupFeedTabs as fetchFeed};
