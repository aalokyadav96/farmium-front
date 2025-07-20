import { createElement } from "../components/createElement.js";
import { trackEvent } from "../services/activity/metrics.js";
import {
    setRouteModule,
    getRouteState, setState
} from "../state/state.js";


// const MAX_DOM_CACHE = 10;
// const domCache = new Map(); // key: path, value: HTMLElement or DocumentFragment

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

    // await renderFn(...finalArgs);

    // // Clone content to store in cache
    // if (cache) {
    //     const clone = contentContainer.cloneNode(true); // shallow clone
    //     const fragment = document.createDocumentFragment();
    //     while (clone.firstChild) {
    //         fragment.appendChild(clone.firstChild);
    //     }

    //     domCache.set(path, fragment);

    //     // LRU eviction
    //     if (domCache.size > MAX_DOM_CACHE) {
    //         const firstKey = domCache.keys().next().value;
    //         domCache.delete(firstKey);
    //     }

    //     setRouteModule(path, {
    //         render: (container) => {
    //             container.innerHTML = "";
    //             container.appendChild(domCache.get(path).cloneNode(true));
    //         }
    //     });
    // }

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
        "/dash": { moduleImport: () => import("../pages/dash/dash.js"), functionName: "Dash" },
        "/login": { moduleImport: () => import("../pages/auth/auth.js"), functionName: "Auth" },
        "/merechats": { moduleImport: () => import("../pages/merechats/merechats.js"), functionName: "Mechat" },
        "/recipes": { moduleImport: () => import("../pages/recipe/recipes.js"), functionName: "Recipes" },
        "/chats": { moduleImport: () => import("../pages/userchat/chats.js"), functionName: "Chats" },
        "/admin": { moduleImport: () => import("../pages/admin/admin.js"), functionName: "Admin" },
        "/livechat": { moduleImport: () => import("../pages/livechat/chats.js"), functionName: "LiveChats" },
        "/posts": { moduleImport: () => import("../pages/posts/posts.js"), functionName: "Posts" },
        "/baitos": { moduleImport: () => import("../pages/baitos/baitos.js"), functionName: "Baitos" },
        "/baitos/dash": { moduleImport: () => import("../pages/baitos/baitoDash.js"), functionName: "BaitoDash" },
        "/create-event": { moduleImport: () => import("../pages/events/createEvent.js"), functionName: "Create" },
        "/create-place": { moduleImport: () => import("../pages/places/createPlace.js"), functionName: "CreatePlace" },
        "/profile": { moduleImport: () => import("../pages/profile/userProfile.js"), functionName: "MyProfile" },
        "/events": { moduleImport: () => import("../pages/events/events.js"), functionName: "Events" },
        "/artists": { moduleImport: () => import("../pages/artist/artists.js"), functionName: "Artists" },
        "/places": { moduleImport: () => import("../pages/places/places.js"), functionName: "Places" },
        "/search": { moduleImport: () => import("../pages/search/search.js"), functionName: "Search" },
        "/settings": { moduleImport: () => import("../pages/profile/settings.js"), functionName: "Settings" },
        "/feed": { moduleImport: () => import("../pages/weed/weed.js"), functionName: "Weed" },
        // "/feed": { moduleImport: () => import("../pages/feed/feed.js"), functionName: "Feed" },
        "/create-post": { moduleImport: () => import("../pages/posts/createNewPost.js"), functionName: "Create" },
        "/create-baito": { moduleImport: () => import("../pages/baitos/createNewBaito.js"), functionName: "Create" },
        "/create-artist": { moduleImport: () => import("../pages/artist/createArtist.js"), functionName: "Create" },
        "/create-itinerary": { moduleImport: () => import("../pages/itinerary/createItinerary.js"), functionName: "CreateItinerary" },
        "/edit-itinerary": { moduleImport: () => import("../pages/itinerary/editItinerary.js"), functionName: "EditItinerary" },
        "/itinerary": { moduleImport: () => import("../pages/itinerary/itinerary.js"), functionName: "Itinerary" },
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
            pattern: /^\/event\/([\w-]+)$/,
            moduleImport: () => import("../pages/events/eventPage.js"),
            functionName: "Event",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/event\/([\w-]+)\/tickets$/,
            moduleImport: () => import("../pages/events/eventTicketsPage.js"),
            functionName: "EventTickets",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/artist\/([\w-]+)$/,
            moduleImport: () => import("../pages/artist/artistPage.js"),
            functionName: "Artist",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/merch\/([\w-]+)$/,
            moduleImport: () => import("../pages/merch/merch.js"),
            functionName: "Merch",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/chat\/([\w-]+)$/,
            moduleImport: () => import("../pages/userchat/chat.js"),
            functionName: "Chat",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/livechat\/([\w-]+)$/,
            moduleImport: () => import("../pages/livechat/chat.js"),
            functionName: "LiveChat",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/place\/([\w-]+)$/,
            moduleImport: () => import("../pages/places/placePage.js"),
            functionName: "Place",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/post\/([\w-]+)$/,
            moduleImport: () => import("../pages/posts/displayPost.js"),
            functionName: "Post",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/baito\/([\w-]+)$/,
            moduleImport: () => import("../pages/baitos/displayBaito.js"),
            functionName: "Baito",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/feedpost\/([\w-]+)$/,
            moduleImport: () => import("../pages/feed/postDisplay.js"),
            functionName: "Post",
            argBuilder: ([, id]) => [isLoggedIn, id],
        },
        {
            pattern: /^\/itinerary\/([\w-]+)$/,
            moduleImport: () => import("../pages/itinerary/itineraryDisplay.js"),
            functionName: "Itinerary",
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
            pattern: /^\/hashtag\/([\w-]+)$/,
            moduleImport: () => import("../pages/hashtag/hashtagPage.js"),
            functionName: "Hashtag",
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

// // export { renderPageContent };
// function clearDomCache() {
//     domCache.clear();
// }
// export { renderPageContent, clearDomCache };

export { renderPageContent };


/**
 *
 *
 * When to invalidate?

If a user updates their profile, you may want to invalidate the cached /profile view:

import { clearDomCache } from "../routes/render.js";

clearDomCache(); // or domCache.delete("/profile")
*/

// import { createElement } from "../components/createElement.js";
// import {
//     setRouteModule,
//     getRouteState
// } from "../state/state.js";

// /**
//  * Renders a basic error message.
//  */
// function renderError(container, message = "404 Not Found") {
//     container.innerHTML = "";
//     container.appendChild(createElement("h1", {}, [message]));
// }

// /**
//  * Helper to wrap route logic and cache the module render function.
//  */
// // async function handleRoute({
// //     path,
// //     moduleImport,
// //     functionName,
// //     args = [],
// //     contentContainer,
// //     cache = true
// // }) {
// //     contentContainer.innerHTML = "";

// //     const mod = await moduleImport();
// //     const renderFn = mod[functionName];
// //     if (typeof renderFn !== "function") {
// //         throw new Error(`Exported function '${functionName}' not found in module`);
// //     }

// //     renderFn(...args);

// //     if (cache) {
// //         setRouteModule(path, {
// //             render: (container) => renderFn(...args.map(arg => arg === contentContainer ? container : arg))
// //         });
// //     }
// // }
// async function handleRoute({
//     path,
//     moduleImport,
//     functionName,
//     args = [],
//     contentContainer,
//     cache = true
// }) {
//     if (!contentContainer || typeof contentContainer.innerHTML === "undefined") {
//         throw new Error("Invalid contentContainer: DOM element expected");
//     }

//     contentContainer.innerHTML = "";

//     const mod = await moduleImport();
//     const renderFn = mod[functionName];
//     if (typeof renderFn !== "function") {
//         throw new Error(`Exported function '${functionName}' not found in module`);
//     }

//     renderFn(...args);

//     if (cache) {
//         setRouteModule(path, {
//             render: (container) => renderFn(...args.map(arg => arg === contentContainer ? container : arg))
//         });
//     }
// }

// /**
//  * Loads a route and injects content, with optional state per route.
//  */
// async function renderPageContent(isLoggedIn, path, contentContainer) {
//     if (!path || typeof path !== "string") {
//         console.error("Invalid path:", path);
//         return renderError(contentContainer);
//     }

//     const cleanPath = path.split(/[?#]/)[0];
//     const state = getRouteState(cleanPath); // for tab/scroll state, etc.

//     const staticRoutes = {
//         "/": {
//             moduleImport: () => import("../pages/entry/entry.js"),
//             functionName: "Entry",
//         },
//         "/home": {
//             moduleImport: () => import("../pages/home.js"),
//             functionName: "Home",
//         },
//         "/dash": {
//             moduleImport: () => import("../pages/dash/dash.js"),
//             functionName: "Dash",
//         },
//         "/qna": {
//             moduleImport: () => import("../pages/qna/questions.js"),
//             functionName: "Questions",
//         },
//         "/login": {
//             moduleImport: () => import("../pages/auth/auth.js"),
//             functionName: "Auth",
//         },
//         "/merechats": {
//             moduleImport: () => import("../pages/merechats/merechats.js"),
//             functionName: "Mechat",
//         },
//         "/recipes": {
//             moduleImport: () => import("../pages/recipe/recipes.js"),
//             functionName: "Recipes",
//         },
//         "/chats": {
//             moduleImport: () => import("../pages/userchat/chats.js"),
//             functionName: "Chats",
//         },
//         "/admin": {
//             moduleImport: () => import("../pages/admin/admin.js"),
//             functionName: "Admin",
//         },
//         "/livechat": {
//             moduleImport: () => import("../pages/livechat/chats.js"),
//             functionName: "LiveChats",
//         },
//         "/posts": {
//             moduleImport: () => import("../pages/posts/posts.js"),
//             functionName: "Posts",
//         },
//         "/baitos": {
//             moduleImport: () => import("../pages/baitos/baitos.js"),
//             functionName: "Baitos",
//         },
//         "/baitos/dash": {
//             moduleImport: () => import("../pages/baitos/baitoDash.js"),
//             functionName: "BaitoDash",
//         },
//         "/create-event": {
//             moduleImport: () => import("../pages/events/createEvent.js"),
//             functionName: "Create",
//         },
//         "/create-place": {
//             moduleImport: () => import("../pages/places/createPlace.js"),
//             functionName: "CreatePlace",
//         },
//         "/profile": {
//             moduleImport: () => import("../pages/profile/userProfile.js"),
//             functionName: "MyProfile",
//         },
//         "/events": {
//             moduleImport: () => import("../pages/events/events.js"),
//             functionName: "Events",
//         },
//         "/artists": {
//             moduleImport: () => import("../pages/artist/artists.js"),
//             functionName: "Artists",
//         },
//         "/places": {
//             moduleImport: () => import("../pages/places/places.js"),
//             functionName: "Places",
//         },
//         "/search": {
//             moduleImport: () => import("../pages/search/search.js"),
//             functionName: "Search",
//         },
//         "/settings": {
//             moduleImport: () => import("../pages/profile/settings.js"),
//             functionName: "Settings",
//         },
//         "/feed": {
//             moduleImport: () => import("../pages/weed/weed.js"),
//             functionName: "Weed",
//         },
//         "/create-post": {
//             moduleImport: () => import("../pages/posts/createNewPost.js"),
//             functionName: "Create",
//         },
//         "/create-baito": {
//             moduleImport: () => import("../pages/baitos/createNewBaito.js"),
//             functionName: "Create",
//         },
//         "/create-artist": {
//             moduleImport: () => import("../pages/artist/createArtist.js"),
//             functionName: "Create",
//         },
//         "/create-itinerary": {
//             moduleImport: () => import("../pages/itinerary/createItinerary.js"),
//             functionName: "CreateItinerary",
//         },
//         "/edit-itinerary": {
//             moduleImport: () => import("../pages/itinerary/editItinerary.js"),
//             functionName: "EditItinerary",
//         },
//         "/itinerary": {
//             moduleImport: () => import("../pages/itinerary/itinerary.js"),
//             functionName: "Itinerary",
//         },
//         "/cart": {
//             moduleImport: () => import("../pages/cart/cart.js"),
//             functionName: "Cart",
//         },
//         "/farms": {
//             moduleImport: () => import("../pages/farm/farms.js"),
//             functionName: "Farms",
//         },
//         "/tools": {
//             moduleImport: () => import("../pages/farm/tools.js"),
//             functionName: "Tools",
//         },
//         "/products": {
//             moduleImport: () => import("../pages/farm/products.js"),
//             functionName: "Products",
//         },
//         "/crops": {
//             moduleImport: () => import("../pages/crop/crops.js"),
//             functionName: "Crops",
//         },
//         "/create-farm": {
//             moduleImport: () => import("../pages/farm/createNewFarm.js"),
//             functionName: "Create",
//         },
//     };

//     const dynamicRoutes = [
//         {
//             pattern: /^\/user\/([\w-]+)$/,
//             moduleImport: () => import("../pages/profile/userProfile.js"),
//             functionName: "UserProfile",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/event\/([\w-]+)$/,
//             moduleImport: () => import("../pages/events/eventPage.js"),
//             functionName: "Event",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/event\/([\w-]+)\/tickets$/,
//             moduleImport: () => import("../pages/events/eventTicketsPage.js"),
//             functionName: "EventTickets",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/artist\/([\w-]+)$/,
//             moduleImport: () => import("../pages/artist/artistPage.js"),
//             functionName: "Artist",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/merch\/([\w-]+)$/,
//             moduleImport: () => import("../pages/merch/merch.js"),
//             functionName: "Merch",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/chat\/([\w-]+)$/,
//             moduleImport: () => import("../pages/userchat/chat.js"),
//             functionName: "Chat",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/livechat\/([\w-]+)$/,
//             moduleImport: () => import("../pages/livechat/chat.js"),
//             functionName: "LiveChat",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/place\/([\w-]+)$/,
//             moduleImport: () => import("../pages/places/placePage.js"),
//             functionName: "Place",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/post\/([\w-]+)$/,
//             moduleImport: () => import("../pages/posts/displayPost.js"),
//             functionName: "Post",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/baito\/([\w-]+)$/,
//             moduleImport: () => import("../pages/baitos/displayBaito.js"),
//             functionName: "Baito",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/feedpost\/([\w-]+)$/,
//             moduleImport: () => import("../pages/feed/postDisplay.js"),
//             functionName: "Post",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/itinerary\/([\w-]+)$/,
//             moduleImport: () => import("../pages/itinerary/itineraryDisplay.js"),
//             functionName: "Itinerary",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/crop\/([\w-]+)$/,
//             moduleImport: () => import("../pages/crop/cropPage.js"),
//             functionName: "Crop",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/farm\/([\w-]+)$/,
//             moduleImport: () => import("../pages/crop/displayFarm.js"),
//             functionName: "Farm",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/recipe\/([\w-]+)$/,
//             moduleImport: () => import("../pages/recipe/recipePage.js"),
//             functionName: "Recipe",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/qna\/([\w-]+)$/,
//             moduleImport: () => import("../pages/qna/questionPage.js"),
//             functionName: "Question",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//         {
//             pattern: /^\/hashtag\/([\w-]+)$/,
//             moduleImport: () => import("../pages/hashtag/hashtagPage.js"),
//             functionName: "Hashtag",
//             argBuilder: ([, id]) => [isLoggedIn, id, contentContainer],
//         },
//     ];

//     // Static route handling
//     if (staticRoutes[cleanPath]) {
//         try {
//             const { moduleImport, functionName, args } = staticRoutes[cleanPath];
//             await handleRoute({
//                 path: cleanPath,
//                 moduleImport,
//                 functionName,
//                 args,
//                 contentContainer
//             });
//         } catch (err) {
//             console.error("Error rendering route:", cleanPath, err);
//             renderError(contentContainer, "500 Internal Error");
//         }
//         return;
//     }

//     // Dynamic route handling
//     for (const { pattern, moduleImport, functionName, argBuilder } of dynamicRoutes) {
//         const match = cleanPath.match(pattern);
//         if (match) {
//             try {
//                 await handleRoute({
//                     path: cleanPath,
//                     moduleImport,
//                     functionName,
//                     args: argBuilder(match),
//                     contentContainer
//                 });
//             } catch (err) {
//                 console.error("Error rendering dynamic route:", cleanPath, err);
//                 renderError(contentContainer, "500 Internal Error");
//             }
//             return;
//         }
//     }

//     // No route matched
//     renderError(contentContainer);
// }

// export { renderPageContent };

// // import { createElement } from "../components/createElement.js";

// // function renderError(container, message = "404 Not Found") {
// //     container.innerHTML = "";
// //     container.appendChild(
// //         createElement("h1", {}, [message])
// //     );
// // }

// // async function renderPageContent(isLoggedIn, path, contentContainer) {
// //     if (!path || typeof path !== "string") {
// //         console.error("Invalid path:", path);
// //         return renderError(contentContainer);
// //     }

// //     const cleanPath = path.split(/[?#]/)[0];

// // const routeHandlers = {
// //     "/": async () => {
// //         const { Entry } = await import("../pages/entry/entry.js");
// //         contentContainer.innerHTML = "";
// //         Entry(isLoggedIn, contentContainer);
// //     },
// //     "/home": async () => {
// //         const { Home } = await import("../pages/home.js");
// //         contentContainer.innerHTML = "";
// //         Home(isLoggedIn, contentContainer);
// //     },
// //     "/dash": async () => {
// //         const { Dash } = await import("../pages/dash/dash.js");
// //         contentContainer.innerHTML = "";
// //         Dash(isLoggedIn, contentContainer);
// //     },
// //     "/qna": async () => {
// //         const { Questions } = await import("../pages/qna/questions.js");
// //         contentContainer.innerHTML = "";
// //         Questions(isLoggedIn, contentContainer);
// //     },
// //     "/login": async () => {
// //         const { Auth } = await import("../pages/auth/auth.js");
// //         contentContainer.innerHTML = "";
// //         Auth(isLoggedIn, contentContainer);
// //     },
// //     "/merechats": async () => {
// //         const { Mechat } = await import("../pages/merechats/merechats.js");
// //         contentContainer.innerHTML = "";
// //         Mechat(isLoggedIn, contentContainer);
// //     },
// //     "/recipes": async () => {
// //         const { Recipes } = await import("../pages/recipe/recipes.js");
// //         contentContainer.innerHTML = "";
// //         Recipes(isLoggedIn, contentContainer);
// //     },
// //     "/chats": async () => {
// //         const { Chats } = await import("../pages/userchat/chats.js");
// //         contentContainer.innerHTML = "";
// //         Chats(isLoggedIn, contentContainer);
// //     },
// //     "/admin": async () => {
// //         const { Admin } = await import("../pages/admin/admin.js");
// //         contentContainer.innerHTML = "";
// //         Admin(isLoggedIn, contentContainer);
// //     },
// //     "/livechat": async () => {
// //         const { LiveChats } = await import("../pages/livechat/chats.js");
// //         contentContainer.innerHTML = "";
// //         LiveChats(isLoggedIn, contentContainer);
// //     },
// //     "/posts": async () => {
// //         const { Posts } = await import("../pages/posts/posts.js");
// //         contentContainer.innerHTML = "";
// //         Posts(isLoggedIn, contentContainer);
// //     },
// //     "/baitos": async () => {
// //         const { Baitos } = await import("../pages/baitos/baitos.js");
// //         contentContainer.innerHTML = "";
// //         Baitos(isLoggedIn, contentContainer);
// //     },
// //     "/baitos/dash": async () => {
// //         const { BaitoDash } = await import("../pages/baitos/baitoDash.js");
// //         contentContainer.innerHTML = "";
// //         BaitoDash(isLoggedIn, contentContainer);
// //     },
// //     "/create-event": async () => {
// //         const { Create } = await import("../pages/events/createEvent.js");
// //         contentContainer.innerHTML = "";
// //         Create(isLoggedIn, contentContainer);
// //     },
// //     "/create-place": async () => {
// //         const { CreatePlace } = await import("../pages/places/createPlace.js");
// //         contentContainer.innerHTML = "";
// //         CreatePlace(isLoggedIn, contentContainer);
// //     },
// //     "/profile": async () => {
// //         const { MyProfile } = await import("../pages/profile/userProfile.js");
// //         contentContainer.innerHTML = "";
// //         MyProfile(isLoggedIn, contentContainer);
// //     },
// //     "/events": async () => {
// //         const { Events } = await import("../pages/events/events.js");
// //         contentContainer.innerHTML = "";
// //         Events(isLoggedIn, contentContainer);
// //     },
// //     "/artists": async () => {
// //         const { Artists } = await import("../pages/artist/artists.js");
// //         contentContainer.innerHTML = "";
// //         Artists(isLoggedIn, contentContainer);
// //     },
// //     "/places": async () => {
// //         const { Places } = await import("../pages/places/places.js");
// //         contentContainer.innerHTML = "";
// //         Places(isLoggedIn, contentContainer);
// //     },
// //     "/search": async () => {
// //         const { Search } = await import("../pages/search/search.js");
// //         contentContainer.innerHTML = "";
// //         Search(isLoggedIn, contentContainer);
// //     },
// //     "/settings": async () => {
// //         const { Settings } = await import("../pages/profile/settings.js");
// //         contentContainer.innerHTML = "";
// //         Settings(isLoggedIn, contentContainer);
// //     },
// //     "/feed": async () => {
// //         const { Weed } = await import("../pages/weed/weed.js");
// //         contentContainer.innerHTML = "";
// //         Weed(isLoggedIn, contentContainer);
// //     },
// //     "/create-post": async () => {
// //         const { Create } = await import("../pages/posts/createNewPost.js");
// //         contentContainer.innerHTML = "";
// //         Create(isLoggedIn, contentContainer);
// //     },
// //     "/create-baito": async () => {
// //         const { Create } = await import("../pages/baitos/createNewBaito.js");
// //         contentContainer.innerHTML = "";
// //         Create(isLoggedIn, contentContainer);
// //     },
// //     "/create-artist": async () => {
// //         const { Create } = await import("../pages/artist/createArtist.js");
// //         contentContainer.innerHTML = "";
// //         Create(isLoggedIn, contentContainer);
// //     },
// //     "/create-itinerary": async () => {
// //         const { CreateItinerary } = await import("../pages/itinerary/createItinerary.js");
// //         contentContainer.innerHTML = "";
// //         CreateItinerary(isLoggedIn, contentContainer);
// //     },
// //     "/edit-itinerary": async () => {
// //         const { EditItinerary } = await import("../pages/itinerary/editItinerary.js");
// //         contentContainer.innerHTML = "";
// //         EditItinerary(isLoggedIn, contentContainer);
// //     },
// //     "/itinerary": async () => {
// //         const { Itinerary } = await import("../pages/itinerary/itinerary.js");
// //         contentContainer.innerHTML = "";
// //         Itinerary(isLoggedIn, contentContainer);
// //     },
// //     "/cart": async () => {
// //         const { Cart } = await import("../pages/cart/cart.js");
// //         contentContainer.innerHTML = "";
// //         Cart(isLoggedIn, contentContainer);
// //     },
// //     "/farms": async () => {
// //         const { Farms } = await import("../pages/farm/farms.js");
// //         contentContainer.innerHTML = "";
// //         Farms(isLoggedIn, contentContainer);
// //     },
// //     "/tools": async () => {
// //         const { Tools } = await import("../pages/farm/tools.js");
// //         contentContainer.innerHTML = "";
// //         Tools(isLoggedIn, contentContainer);
// //     },
// //     "/products": async () => {
// //         const { Products } = await import("../pages/farm/products.js");
// //         contentContainer.innerHTML = "";
// //         Products(isLoggedIn, contentContainer);
// //     },
// //     "/crops": async () => {
// //         const { Crops } = await import("../pages/crop/crops.js");
// //         contentContainer.innerHTML = "";
// //         Crops(isLoggedIn, contentContainer);
// //     },
// //     "/create-farm": async () => {
// //         const { Create } = await import("../pages/farm/createNewFarm.js");
// //         contentContainer.innerHTML = "";
// //         Create(isLoggedIn, contentContainer);
// //     },
// //     };

// //     const dynamicRoutes = [
// //         {
// //             pattern: /^\/user\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { UserProfile } = await import("../pages/profile/userProfile.js");
// //                 UserProfile(isLoggedIn, contentContainer, id);
// //             },
// //         },
// //         {
// //             pattern: /^\/event\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Event } = await import("../pages/events/eventPage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Event(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Event Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/event\/([\w-]+)\/tickets$/,
// //             handler: async ([, id]) => {
// //                 const { EventTickets } = await import("../pages/events/eventTicketsPage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     EventTickets(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Tickets Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/artist\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Artist } = await import("../pages/artist/artistPage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Artist(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Artist Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/merch\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Merch } = await import("../pages/merch/merch.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Merch(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Merch Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/chat\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Chat } = await import("../pages/userchat/chat.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Chat(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Chat Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/livechat\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { LiveChat } = await import("../pages/livechat/chat.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     LiveChat(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Chat Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/place\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Place } = await import("../pages/places/placePage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Place(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Place Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/post\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Post } = await import("../pages/posts/displayPost.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Post(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Post Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/baito\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Baito } = await import("../pages/baitos/displayBaito.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Baito(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Baito Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/feedpost\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Post } = await import("../pages/feed/postDisplay.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Post(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Feed Post Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/itinerary\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Itinerary } = await import("../pages/itinerary/itineraryDisplay.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Itinerary(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Itinerary Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/crop\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Crop } = await import("../pages/crop/cropPage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Crop(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Crop Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/farm\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Farm } = await import("../pages/crop/displayFarm.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Farm(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Farm Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/recipe\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Recipe } = await import("../pages/recipe/recipePage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Recipe(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Recipe Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/qna\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Question } = await import("../pages/qna/questionPage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Question(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Question Not Found</h1>`;
// //                 }
// //             },
// //         },
// //         {
// //             pattern: /^\/hashtag\/([\w-]+)$/,
// //             handler: async ([, id]) => {
// //                 const { Hashtag } = await import("../pages/hashtag/hashtagPage.js");
// //                 try {
// //                     contentContainer.innerHTML = "";
// //                     Hashtag(isLoggedIn, id, contentContainer);
// //                 } catch {
// //                     contentContainer.innerHTML = `<h1>Hashtag Not Found</h1>`;
// //                 }
// //             },
// //         },
// //     ];

// //     if (routeHandlers[cleanPath]) {
// //         try {
// //             await routeHandlers[cleanPath]();
// //         } catch (err) {
// //             console.error("Error rendering route:", cleanPath, err);
// //             renderError(contentContainer, "500 Internal Error");
// //         }
// //         return;
// //     }

// //     for (const route of dynamicRoutes) {
// //         const matches = cleanPath.match(route.pattern);
// //         if (matches) {
// //             try {
// //                 await route.handler(matches);
// //             } catch (err) {
// //                 console.error("Error in dynamic route:", cleanPath, err);
// //                 renderError(contentContainer, "500 Internal Error");
// //             }
// //             return;
// //         }
// //     }

// //     console.warn("No matching route for:", cleanPath);
// //     renderError(contentContainer);
// // }


// // export { renderPageContent };


// // // async function renderPageContent(isLoggedIn, path, contentContainer) {
// // //     if (!path || typeof path !== "string") {
// // //         console.error("Invalid path:", path);
// // //         contentContainer.innerHTML = `<h1>404 Not Found</h1>`;
// // //         return;
// // //     }

// // //     const routeHandlers = {
// // //         "/": async () => {
// // //             const { Entry } = await import("../pages/entry/entry.js");
// // //             contentContainer.innerHTML = "";
// // //             Entry(isLoggedIn, contentContainer);
// // //         },
// // //         "/home": async () => {
// // //             const { Home } = await import("../pages/home.js");
// // //             contentContainer.innerHTML = "";
// // //             Home(isLoggedIn, contentContainer);
// // //         },
// // //         "/dash": async () => {
// // //             const { Dash } = await import("../pages/dash/dash.js");
// // //             contentContainer.innerHTML = "";
// // //             Dash(isLoggedIn, contentContainer);
// // //         },
// // //         "/qna": async () => {
// // //             const { Questions } = await import("../pages/qna/questions.js");
// // //             contentContainer.innerHTML = "";
// // //             Questions(isLoggedIn, contentContainer);
// // //         },
// // //         "/login": async () => {
// // //             const { Auth } = await import("../pages/auth/auth.js");
// // //             contentContainer.innerHTML = "";
// // //             Auth(isLoggedIn, contentContainer);
// // //         },
// // //         "/merechats": async () => {
// // //             const { Mechat } = await import("../pages/merechats/merechats.js");
// // //             contentContainer.innerHTML = "";
// // //             Mechat(isLoggedIn, contentContainer);
// // //         },
// // //         "/recipes": async () => {
// // //             const { Recipes } = await import("../pages/recipe/recipes.js");
// // //             contentContainer.innerHTML = "";
// // //             Recipes(isLoggedIn, contentContainer);
// // //         },
// // //         "/chats": async () => {
// // //             const { Chats } = await import("../pages/userchat/chats.js");
// // //             contentContainer.innerHTML = "";
// // //             Chats(isLoggedIn, contentContainer);
// // //         },
// // //         "/admin": async () => {
// // //             const { Admin } = await import("../pages/admin/admin.js");
// // //             contentContainer.innerHTML = "";
// // //             Admin(isLoggedIn, contentContainer);
// // //         },
// // //         "/livechat": async () => {
// // //             const { LiveChats } = await import("../pages/livechat/chats.js");
// // //             contentContainer.innerHTML = "";
// // //             LiveChats(isLoggedIn, contentContainer);
// // //         },
// // //         "/posts": async () => {
// // //             const { Posts } = await import("../pages/posts/posts.js");
// // //             contentContainer.innerHTML = "";
// // //             Posts(isLoggedIn, contentContainer);
// // //         },
// // //         "/baitos": async () => {
// // //             const { Baitos } = await import("../pages/baitos/baitos.js");
// // //             contentContainer.innerHTML = "";
// // //             Baitos(isLoggedIn, contentContainer);
// // //         },
// // //         "/baitos/dash": async () => {
// // //             const { BaitoDash } = await import("../pages/baitos/baitoDash.js");
// // //             contentContainer.innerHTML = "";
// // //             BaitoDash(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-event": async () => {
// // //             const { Create } = await import("../pages/events/createEvent.js");
// // //             contentContainer.innerHTML = "";
// // //             Create(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-place": async () => {
// // //             const { CreatePlace } = await import("../pages/places/createPlace.js");
// // //             contentContainer.innerHTML = "";
// // //             CreatePlace(isLoggedIn, contentContainer);
// // //         },
// // //         "/profile": async () => {
// // //             const { MyProfile } = await import("../pages/profile/userProfile.js");
// // //             contentContainer.innerHTML = "";
// // //             MyProfile(isLoggedIn, contentContainer);
// // //         },
// // //         "/events": async () => {
// // //             const { Events } = await import("../pages/events/events.js");
// // //             contentContainer.innerHTML = "";
// // //             Events(isLoggedIn, contentContainer);
// // //         },
// // //         "/artists": async () => {
// // //             const { Artists } = await import("../pages/artist/artists.js");
// // //             contentContainer.innerHTML = "";
// // //             Artists(isLoggedIn, contentContainer);
// // //         },
// // //         "/places": async () => {
// // //             const { Places } = await import("../pages/places/places.js");
// // //             contentContainer.innerHTML = "";
// // //             Places(isLoggedIn, contentContainer);
// // //         },
// // //         "/search": async () => {
// // //             const { Search } = await import("../pages/search/search.js");
// // //             contentContainer.innerHTML = "";
// // //             Search(isLoggedIn, contentContainer);
// // //         },
// // //         "/settings": async () => {
// // //             const { Settings } = await import("../pages/profile/settings.js");
// // //             contentContainer.innerHTML = "";
// // //             Settings(isLoggedIn, contentContainer);
// // //         },
// // //         "/feed": async () => {
// // //             const { Weed } = await import("../pages/weed/weed.js");
// // //             contentContainer.innerHTML = "";
// // //             Weed(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-post": async () => {
// // //             const { Create } = await import("../pages/posts/createNewPost.js");
// // //             contentContainer.innerHTML = "";
// // //             Create(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-baito": async () => {
// // //             const { Create } = await import("../pages/baitos/createNewBaito.js");
// // //             contentContainer.innerHTML = "";
// // //             Create(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-artist": async () => {
// // //             const { Create } = await import("../pages/artist/createArtist.js");
// // //             contentContainer.innerHTML = "";
// // //             Create(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-itinerary": async () => {
// // //             const { CreateItinerary } = await import("../pages/itinerary/createItinerary.js");
// // //             contentContainer.innerHTML = "";
// // //             CreateItinerary(isLoggedIn, contentContainer);
// // //         },
// // //         "/edit-itinerary": async () => {
// // //             const { EditItinerary } = await import("../pages/itinerary/editItinerary.js");
// // //             contentContainer.innerHTML = "";
// // //             EditItinerary(isLoggedIn, contentContainer);
// // //         },
// // //         "/itinerary": async () => {
// // //             const { Itinerary } = await import("../pages/itinerary/itinerary.js");
// // //             contentContainer.innerHTML = "";
// // //             Itinerary(isLoggedIn, contentContainer);
// // //         },
// // //         "/cart": async () => {
// // //             const { Cart } = await import("../pages/cart/cart.js");
// // //             contentContainer.innerHTML = "";
// // //             Cart(isLoggedIn, contentContainer);
// // //         },
// // //         "/farms": async () => {
// // //             const { Farms } = await import("../pages/farm/farms.js");
// // //             contentContainer.innerHTML = "";
// // //             Farms(isLoggedIn, contentContainer);
// // //         },
// // //         "/tools": async () => {
// // //             const { Tools } = await import("../pages/farm/tools.js");
// // //             contentContainer.innerHTML = "";
// // //             Tools(isLoggedIn, contentContainer);
// // //         },
// // //         "/products": async () => {
// // //             const { Products } = await import("../pages/farm/products.js");
// // //             contentContainer.innerHTML = "";
// // //             Products(isLoggedIn, contentContainer);
// // //         },
// // //         "/crops": async () => {
// // //             const { Crops } = await import("../pages/crop/crops.js");
// // //             contentContainer.innerHTML = "";
// // //             Crops(isLoggedIn, contentContainer);
// // //         },
// // //         "/create-farm": async () => {
// // //             const { Create } = await import("../pages/farm/createNewFarm.js");
// // //             contentContainer.innerHTML = "";
// // //             Create(isLoggedIn, contentContainer);
// // //         },
// // //     };

// // //     const dynamicRoutes = [
// // //         {
// // //             pattern: /^\/user\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { UserProfile } = await import("../pages/profile/userProfile.js");
// // //                 UserProfile(isLoggedIn, contentContainer, id);
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/event\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Event } = await import("../pages/events/eventPage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Event(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Event Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/event\/([\w-]+)\/tickets$/,
// // //             handler: async ([, id]) => {
// // //                 const { EventTickets } = await import("../pages/events/eventTicketsPage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     EventTickets(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Tickets Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/artist\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Artist } = await import("../pages/artist/artistPage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Artist(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Artist Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/merch\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Merch } = await import("../pages/merch/merch.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Merch(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Merch Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/chat\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Chat } = await import("../pages/userchat/chat.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Chat(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Chat Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/livechat\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { LiveChat } = await import("../pages/livechat/chat.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     LiveChat(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Chat Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/place\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Place } = await import("../pages/places/placePage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Place(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Place Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/post\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Post } = await import("../pages/posts/displayPost.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Post(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Post Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/baito\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Baito } = await import("../pages/baitos/displayBaito.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Baito(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Baito Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/feedpost\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Post } = await import("../pages/feed/postDisplay.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Post(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Feed Post Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/itinerary\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Itinerary } = await import("../pages/itinerary/itineraryDisplay.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Itinerary(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Itinerary Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/crop\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Crop } = await import("../pages/crop/cropPage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Crop(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Crop Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/farm\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Farm } = await import("../pages/crop/displayFarm.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Farm(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Farm Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/recipe\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Recipe } = await import("../pages/recipe/recipePage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Recipe(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Recipe Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/qna\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Question } = await import("../pages/qna/questionPage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Question(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Question Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //         {
// // //             pattern: /^\/hashtag\/([\w-]+)$/,
// // //             handler: async ([, id]) => {
// // //                 const { Hashtag } = await import("../pages/hashtag/hashtagPage.js");
// // //                 try {
// // //                     contentContainer.innerHTML = "";
// // //                     Hashtag(isLoggedIn, id, contentContainer);
// // //                 } catch {
// // //                     contentContainer.innerHTML = `<h1>Hashtag Not Found</h1>`;
// // //                 }
// // //             },
// // //         },
// // //     ];

// // //     if (routeHandlers[path]) {
// // //         await routeHandlers[path]();
// // //     } else {
// // //         for (const route of dynamicRoutes) {
// // //             const matches = path.match(route.pattern);
// // //             if (matches) {
// // //                 await route.handler(matches);
// // //                 return;
// // //             }
// // //         }
// // //         contentContainer.innerHTML = `<h1>404 Not Found</h1>`;
// // //     }
// // // }

// // // export { renderPageContent };
