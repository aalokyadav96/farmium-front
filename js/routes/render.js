async function renderPageContent(isLoggedIn, path, contentContainer) {
    if (!path || typeof path !== "string") {
        console.error("Invalid path:", path);
        contentContainer.innerHTML = `<h1>404 Not Found</h1>`;
        return;
    }

    const routeHandlers = {
        "/": async () => {
            const { Entry } = await import("../pages/entry/entry.js");
            contentContainer.innerHTML = "";
            Entry(isLoggedIn, contentContainer);
        },
        "/home": async () => {
            const { Home } = await import("../pages/home.js");
            contentContainer.innerHTML = "";
            Home(isLoggedIn, contentContainer);
        },
        "/login": async () => {
            const { Auth } = await import("../pages/auth/auth.js");
            contentContainer.innerHTML = "";
            Auth(isLoggedIn, contentContainer);
        },
        "/cart": async () => {
            const { Cart } = await import("../pages/cart/cart.js");
            contentContainer.innerHTML = "";
            Cart(isLoggedIn, contentContainer);
        },
        "/profile": async () => {
            const { MyProfile } = await import("../pages/profile/userProfile.js");
            contentContainer.innerHTML = "";
            MyProfile(isLoggedIn, contentContainer);
        },
        "/farms": async () => {
            const { Farms } = await import("../pages/farm/farms.js");
            contentContainer.innerHTML = "";
            Farms(isLoggedIn, contentContainer);
        },
        "/crops": async () => {
            const { Crops } = await import("../pages/crop/crops.js");
            contentContainer.innerHTML = "";
            Crops(isLoggedIn, contentContainer);
        },
        "/create-farm": async () => {
            const { Create } = await import("../pages/farm/createNewFarm.js");
            contentContainer.innerHTML = "";
            Create(isLoggedIn, contentContainer);
        },
        "/create-crop": async () => {
            const { Create } = await import("../pages/crop/createCrop.js");
            contentContainer.innerHTML = "";
            Create(isLoggedIn, contentContainer);
        },
    };

    const dynamicRoutes = [
        {
            pattern: /^\/user\/([\w-]+)$/,
            handler: async ([, id]) => {
                const { UserProfile } = await import("../pages/profile/userProfile.js");
                UserProfile(isLoggedIn, contentContainer, id);
            },
        },
        {
            pattern: /^\/crop\/([\w-]+)$/,
            handler: async ([, id]) => {
                const { Crop } = await import("../pages/crop/cropPage.js");
                try {
                    contentContainer.innerHTML = "";
                    Crop(isLoggedIn, id, contentContainer);
                } catch {
                    contentContainer.innerHTML = `<h1>Crop Not Found</h1>`;
                }
            },
        },
        {
            pattern: /^\/farm\/([\w-]+)$/,
            handler: async ([, id]) => {
                const { Farm } = await import("../pages/crop/displayFarm.js");
                try {
                    contentContainer.innerHTML = "";
                    Farm(isLoggedIn, id, contentContainer);
                } catch {
                    contentContainer.innerHTML = `<h1>Farm Not Found</h1>`;
                }
            },
        },
    ];

    if (routeHandlers[path]) {
        await routeHandlers[path]();
    } else {
        for (const route of dynamicRoutes) {
            const matches = path.match(route.pattern);
            if (matches) {
                await route.handler(matches);
                return;
            }
        }
        contentContainer.innerHTML = `<h1>404 Not Found</h1>`;
    }
}

export { renderPageContent };
