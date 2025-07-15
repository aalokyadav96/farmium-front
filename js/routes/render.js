import { createElement } from "../components/createElement.js";
import { trackEvent } from "../services/activity/metrics.js";
import {
    setRouteModule
} from "../state/state.js";


/**
 * Renders a basic error message.
 */
function renderError(container, message = "404 Not Found") {
    container.innerHTML = "";
    container.appendChild(createElement("h1", {}, [message]));
}

/**
 * Handles route logic, imports module, invokes render function, caches it.
 */
async function handleRoute({
    path,
    moduleImport,
    functionName,
    args = [],
    contentContainer,
    cache = true
}) {
    if (!contentContainer || typeof contentContainer.innerHTML === "undefined") {
        throw new Error("Invalid contentContainer: DOM element expected");
    }

    contentContainer.innerHTML = "";

    const mod = await moduleImport();
    const renderFn = mod[functionName];
    if (typeof renderFn !== "function") {
        throw new Error(`Exported function '${functionName}' not found in module`);
    }

    const finalArgs = args.includes(contentContainer) ? args : [...args, contentContainer];

    await renderFn(...finalArgs);

    if (cache) {
        setRouteModule(path, {
            render: (container) =>
                renderFn(...finalArgs.map(arg => arg === contentContainer ? container : arg))
        });
    }
}

/**
 * Loads a route and injects content, handling static and dynamic routes.
 */
async function renderPageContent(isLoggedIn, path, contentContainer) {
    if (!path || typeof path !== "string") {
        console.error("Invalid path:", path);
        return renderError(contentContainer);
    }

    trackEvent("page_view");

    const cleanPath = path.split(/[?#]/)[0];
    // const state = getRouteState(cleanPath); // optional, in case you use this


    const staticRoutes = {
        "/": { moduleImport: () => import("../pages/entry/entry.js"), functionName: "Entry" },
        "/home": { moduleImport: () => import("../pages/home.js"), functionName: "Home" },
        "/profile": { moduleImport: () => import("../pages/profile/userProfile.js"), functionName: "MyProfile" },
        "/dash": { moduleImport: () => import("../pages/dash/dash.js"), functionName: "Dash" },
        "/login": { moduleImport: () => import("../pages/auth/auth.js"), functionName: "Auth" },
        "/merechats": { moduleImport: () => import("../pages/merechats/merechats.js"), functionName: "Mechat" },
        "/recipes": { moduleImport: () => import("../pages/recipe/recipes.js"), functionName: "Recipes" },
        "/chats": { moduleImport: () => import("../pages/userchat/chats.js"), functionName: "Chats" },
        "/admin": { moduleImport: () => import("../pages/admin/admin.js"), functionName: "Admin" },
        "/cart": { moduleImport: () => import("../pages/cart/cart.js"), functionName: "Cart" },
        "/my-orders": { moduleImport: () => import("../pages/cart/myorders.js"), functionName: "MyOrders" },
        "/farms": { moduleImport: () => import("../pages/farm/farms.js"), functionName: "Farms" },
        "/tools": { moduleImport: () => import("../pages/farm/tools.js"), functionName: "Tools" },
        "/products": { moduleImport: () => import("../pages/farm/products.js"), functionName: "Products" },
        "/crops": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },
        "/create-farm": { moduleImport: () => import("../pages/farm/createNewFarm.js"), functionName: "Create" },
    };

    const dynamicRoutes = [
        {
            pattern: /^\/user\/([\w-]+)$/,
            moduleImport: () => import("../pages/profile/userProfile.js"),
            functionName: "UserProfile",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/chat\/([\w-]+)$/,
            moduleImport: () => import("../pages/userchat/chat.js"),
            functionName: "Chat",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/crop\/([\w-]+)$/,
            moduleImport: () => import("../pages/crop/cropPage.js"),
            functionName: "Crop",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/aboutcrop\/([\w-]+)$/,
            moduleImport: () => import("../pages/crop/aboutCropPage.js"),
            functionName: "AboutCrop",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/farm\/([\w-]+)$/,
            moduleImport: () => import("../pages/crop/displayFarm.js"),
            functionName: "Farm",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/recipe\/([\w-]+)$/,
            moduleImport: () => import("../pages/recipe/recipePage.js"),
            functionName: "Recipe",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/merechats\/([\w-]+)$/,
            moduleImport: () => import("../pages/merechats/merePage.js"),
            functionName: "OneChatPage",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
    ];

    // Static route match
    if (staticRoutes[cleanPath]) {
        try {
            const { moduleImport, functionName } = staticRoutes[cleanPath];
            await handleRoute({
                path: cleanPath,
                moduleImport,
                functionName,
                args: [isLoggedIn],
                contentContainer
            });
        } catch (err) {
            console.error("Error rendering static route:", cleanPath, err);
            renderError(contentContainer, "500 Internal Error");
        }
        return;
    }

    // Dynamic route match
    for (const { pattern, moduleImport, functionName, argBuilder } of dynamicRoutes) {
        const match = cleanPath.match(pattern);
        if (match) {
            try {
                await handleRoute({
                    path: cleanPath,
                    moduleImport,
                    functionName,
                    args: argBuilder(match),
                    contentContainer
                });
            } catch (err) {
                console.error("Error rendering dynamic route:", cleanPath, err);
                renderError(contentContainer, "500 Internal Error");
            }
            return;
        }
    }

    // Fallback: no match
    renderError(contentContainer);
}

export { renderPageContent };


/**
 *
 *
 * When to invalidate?

If a user updates their profile, you may want to invalidate the cached /profile view:

import { clearDomCache } from "../routes/render.js";

clearDomCache(); // or domCache.delete("/profile")
*/
