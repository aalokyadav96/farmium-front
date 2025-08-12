function safeArgBuilder(match) {
  return match && match[1] ? [true, ...match.slice(1)] : [true];
}

export const staticRoutes = {
  "/": { moduleImport: () => import("../pages/entry/entry.js"), functionName: "Entry" },
  "/home": { moduleImport: () => import("../pages/home.js"), functionName: "Home" },
  "/login": { moduleImport: () => import("../pages/auth/auth.js"), functionName: "Auth" },

  "/admin": { moduleImport: () => import("../pages/admin/admin.js"), functionName: "Admin", protected: true },
  "/dash": { moduleImport: () => import("../pages/dash/dash.js"), functionName: "Dash" },

  "/profile": { moduleImport: () => import("../pages/profile/userProfile.js"), functionName: "MyProfile", protected: true },
  "/settings": { moduleImport: () => import("../pages/profile/settings.js"), functionName: "Settings", protected: true },

  // "/posts": { moduleImport: () => import("../pages/posts/posts.js"), functionName: "Posts" },
  // "/create-post": { moduleImport: () => import("../pages/posts/createNewPost.js"), functionName: "CreatePost", protected: true },
  // "/create-artist": { moduleImport: () => import("../pages/artist/createArtist.js"), functionName: "CreateArtist", protected: true },
  // "/create-event": { moduleImport: () => import("../pages/events/createEvent.js"), functionName: "CreateEvent", protected: true },
  // "/events": { moduleImport: () => import("../pages/events/events.js"), functionName: "Events" },
  // "/artists": { moduleImport: () => import("../pages/artist/artists.js"), functionName: "Artists" },

  // "/places": { moduleImport: () => import("../pages/places/places.js"), functionName: "Places" },
  // "/create-place": { moduleImport: () => import("../pages/places/createPlace.js"), functionName: "CreatePlace", protected: true },

  // "/baitos": { moduleImport: () => import("../pages/baitos/baitos.js"), functionName: "Baitos" },
  // "/baitos/dash": { moduleImport: () => import("../pages/baitos/baitoDash.js"), functionName: "BaitoDash" },
  // "/baitos/hire": { moduleImport: () => import("../pages/baitos/hireWorkers.js"), functionName: "HireWorkers" },
  // "/baitos/create-profile": { moduleImport: () => import("../pages/baitos/createProfile.js"), functionName: "CreateBaitoProfile" },
  // "/create-baito": { moduleImport: () => import("../pages/baitos/createNewBaito.js"), functionName: "CreateBaito", protected: true },

  "/cart": { moduleImport: () => import("../pages/cart/cart.js"), functionName: "Cart", protected: true },
  "/my-orders": { moduleImport: () => import("../pages/cart/myorders.js"), functionName: "MyOrders", protected: true },

  // "/itinerary": { moduleImport: () => import("../pages/itinerary/itinerary.js"), functionName: "Itinerary" },
  // "/create-itinerary": { moduleImport: () => import("../pages/itinerary/createItinerary.js"), functionName: "CreateItinerary", protected: true },
  // "/edit-itinerary": { moduleImport: () => import("../pages/itinerary/editItinerary.js"), functionName: "EditItinerary", protected: true },

  // "/booking": { moduleImport: () => import("../pages/booking/booking.js"), functionName: "Booking" },
  "/search": { moduleImport: () => import("../pages/search/search.js"), functionName: "Search" },
  // "/feed": { moduleImport: () => import("../pages/feed/feed.js"), functionName: "Feed" },
  // "/social": { moduleImport: () => import("../pages/tumblr/tumblr.js"), functionName: "Tumblr" },
  "/merechats": { moduleImport: () => import("../pages/merechats/merechats.js"), functionName: "Mechat", protected: true },
  "/livechat": { moduleImport: () => import("../pages/livechat/chats.js"), functionName: "LiveChats", protected: true },
  "/chats": { moduleImport: () => import("../pages/userchat/chats.js"), functionName: "Chats" },

  "/farms": { moduleImport: () => import("../pages/farm/farms.js"), functionName: "Farms" },
  "/create-farm": { moduleImport: () => import("../pages/farm/createNewFarm.js"), functionName: "CreateFarm" },
  "/tools": { moduleImport: () => import("../pages/farm/tools.js"), functionName: "Tools" },
  "/products": { moduleImport: () => import("../pages/farm/products.js"), functionName: "Products" },
  "/crops": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },
  "/grocery": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },

  "/recipes": { moduleImport: () => import("../pages/recipe/recipes.js"), functionName: "Recipes" },
  // "/shop": { moduleImport: () => import("../pages/shop/shop.js"), functionName: "Shop", protected: true },
};

export const dynamicRoutes = [
  {
    pattern: /^\/user\/([\w-]+)$/,
    moduleImport: () => import("../pages/profile/userProfile.js"),
    functionName: "UserProfile",
    protected: false,
    argBuilder: safeArgBuilder
  },
  // {
  //   pattern: /^\/event\/([\w-]+)\/tickets$/,
  //   moduleImport: () => import("../pages/events/eventTicketsPage.js"),
  //   functionName: "EventTickets",
  //   protected: true,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/event\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/events/eventPage.js"),
  //   functionName: "Event",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/artist\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/artist/artistPage.js"),
  //   functionName: "Artist",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/place\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/places/placePage.js"),
  //   functionName: "Place",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/post\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/posts/displayPost.js"),
  //   functionName: "Post",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/feedpost\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/feed/postDisplay.js"),
  //   functionName: "Post",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/itinerary\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/itinerary/itineraryDisplay.js"),
  //   functionName: "Itinerary",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/hashtag\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/hashtag/hashtagPage.js"),
  //   functionName: "Hashtag",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  // {
  //   pattern: /^\/baito\/([\w-]+)$/,
  //   moduleImport: () => import("../pages/baitos/displayBaito.js"),
  //   functionName: "Baito",
  //   protected: false,
  //   argBuilder: safeArgBuilder
  // },
  {
    pattern: /^\/chat\/([\w-]+)$/,
    moduleImport: () => import("../pages/userchat/chat.js"),
    functionName: "Chat",
    protected: true,
    argBuilder: safeArgBuilder
  },
  {
    pattern: /^\/merechats\/([\w-]+)$/,
    moduleImport: () => import("../pages/merechats/merePage.js"),
    functionName: "OneChatPage",
    protected: true,
    argBuilder: safeArgBuilder
  },
  {
    pattern: /^\/livechat\/([\w-]+)$/,
    moduleImport: () => import("../pages/livechat/chat.js"),
    functionName: "LiveChat",
    protected: true,
    argBuilder: safeArgBuilder
  },
  {
    // pattern: /^\/products\/([\w-]+)\/([a-f\d]{24})$/,
    pattern: /^\/products\/(product|tool)\/([\w-]+)$/,
    moduleImport: () => import("../pages/product/product.js"),
    functionName: "Product",
    protected: false,
    argBuilder: safeArgBuilder
  },
  {
    pattern: /^\/crop\/([\w-]+)$/,
    moduleImport: () => import("../pages/crop/cropPage.js"),
    functionName: "Crop",
    protected: false,
    argBuilder: safeArgBuilder
  },
  {
    pattern: /^\/aboutcrop\/([\w-]+)$/,
    moduleImport: () => import("../pages/crop/aboutCropPage.js"),
    functionName: "AboutCrop",
    protected: false,
    argBuilder: safeArgBuilder
  },
  {
    pattern: /^\/farm\/([\w-]+)$/,
    moduleImport: () => import("../pages/crop/displayFarm.js"),
    functionName: "Farm",
    protected: false,
    argBuilder: safeArgBuilder
  },
  {
    pattern: /^\/recipe\/([\w-]+)$/,
    moduleImport: () => import("../pages/recipe/recipePage.js"),
    functionName: "Recipe",
    protected: false,
    argBuilder: safeArgBuilder
  }
];

// Fallback route (for 404 Not Found)
export const notFoundRoute = {
  moduleImport: () => import("../pages/errors/notFound.js"),
  functionName: "NotFound"
};

// // routes.js

// export const protectedRoutes = new Set([
//   "/admin", "/chats", "/cart", "/settings", "/profile", "/my-orders",
//   "/create-post", "/create-event", "/create-place", "/create-baito",
//   "/create-itinerary", "/create-artist", "/edit-itinerary"
// ]);

// export const staticRoutes = {
//   // Entry and Auth
//   "/": { moduleImport: () => import("../pages/entry/entry.js"), functionName: "Entry" },
//   "/home": { moduleImport: () => import("../pages/home.js"), functionName: "Home" },
//   "/login": { moduleImport: () => import("../pages/auth/auth.js"), functionName: "Auth" },

//   // Admin and Dash
//   "/admin": { moduleImport: () => import("../pages/admin/admin.js"), functionName: "Admin" },
//   "/dash": { moduleImport: () => import("../pages/dash/dash.js"), functionName: "Dash" },

//   // User and Profile
//   "/profile": { moduleImport: () => import("../pages/profile/userProfile.js"), functionName: "MyProfile" },
//   "/settings": { moduleImport: () => import("../pages/profile/settings.js"), functionName: "Settings" },

//   // Posts, Events, Artists
//   "/posts": { moduleImport: () => import("../pages/posts/posts.js"), functionName: "Posts" },
//   "/create-post": { moduleImport: () => import("../pages/posts/createNewPost.js"), functionName: "CreatePost" },
//   "/create-artist": { moduleImport: () => import("../pages/artist/createArtist.js"), functionName: "CreateArtist" },
//   "/create-event": { moduleImport: () => import("../pages/events/createEvent.js"), functionName: "CreateEvent" },
//   "/events": { moduleImport: () => import("../pages/events/events.js"), functionName: "Events" },
//   "/artists": { moduleImport: () => import("../pages/artist/artists.js"), functionName: "Artists" },

//   // Places
//   "/places": { moduleImport: () => import("../pages/places/places.js"), functionName: "Places" },
//   "/create-place": { moduleImport: () => import("../pages/places/createPlace.js"), functionName: "CreatePlace" },

//   // Baitos
//   "/baitos": { moduleImport: () => import("../pages/baitos/baitos.js"), functionName: "Baitos" },
//   "/baitos/dash": { moduleImport: () => import("../pages/baitos/baitoDash.js"), functionName: "BaitoDash" },
//   "/baitos/hire": { moduleImport: () => import("../pages/baitos/hireWorkers.js"), functionName: "HireWorkers" },
//   "/baitos/create-profile": { moduleImport: () => import("../pages/baitos/createProfile.js"), functionName: "CreateBaitoProfile" },
//   "/create-baito": { moduleImport: () => import("../pages/baitos/createNewBaito.js"), functionName: "CreateBaito" },

//   // Cart
//   "/cart": { moduleImport: () => import("../pages/cart/cart.js"), functionName: "Cart" },
//   "/my-orders": { moduleImport: () => import("../pages/cart/myorders.js"), functionName: "MyOrders" },

//   // Itinerary
//   "/itinerary": { moduleImport: () => import("../pages/itinerary/itinerary.js"), functionName: "Itinerary" },
//   "/create-itinerary": { moduleImport: () => import("../pages/itinerary/createItinerary.js"), functionName: "CreateItinerary" },
//   "/edit-itinerary": { moduleImport: () => import("../pages/itinerary/editItinerary.js"), functionName: "EditItinerary" },

//   // Misc Pages
//   "/booking": { moduleImport: () => import("../pages/booking/booking.js"), functionName: "Booking" },
//   "/search": { moduleImport: () => import("../pages/search/search.js"), functionName: "Search" },
//   "/feed": { moduleImport: () => import("../pages/weed/weed.js"), functionName: "Weed" },
//   "/social": { moduleImport: () => import("../pages/tumblr/tumblr.js"), functionName: "Tumblr" },
//   "/merechats": { moduleImport: () => import("../pages/merechats/merechats.js"), functionName: "Mechat" },
//   "/livechat": { moduleImport: () => import("../pages/livechat/chats.js"), functionName: "LiveChats" },

//   // Farms and Crops
//   "/farms": { moduleImport: () => import("../pages/farm/farms.js"), functionName: "Farms" },
//   "/create-farm": { moduleImport: () => import("../pages/farm/createNewFarm.js"), functionName: "CreateFarm" },
//   "/tools": { moduleImport: () => import("../pages/farm/tools.js"), functionName: "Tools" },
//   "/products": { moduleImport: () => import("../pages/farm/products.js"), functionName: "Products" },
//   "/crops": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },
//   "/grocery": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },

//   // Recipes
//   "/recipes": { moduleImport: () => import("../pages/recipe/recipes.js"), functionName: "Recipes" },
// };

// function safeArgBuilder(match) {
//   return match && match[1] ? [true, ...match.slice(1)] : [true];
// }

// export const dynamicRoutes = [
//   // 🛑 Most specific patterns first
//   {
//     pattern: /^\/event\/([\w-]+)\/tickets$/,
//     moduleImport: () => import("../pages/events/eventTicketsPage.js"),
//     functionName: "EventTickets",
//     protected: true,
//     argBuilder: safeArgBuilder
//   },

//   {
//     pattern: /^\/products\/([\w-]+)\/([a-f\d]{24})$/,
//     moduleImport: () => import("../pages/product/product.js"),
//     functionName: "Product",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },

//   // ✅ Standard detail routes
//   {
//     pattern: /^\/user\/([\w-]+)$/,
//     moduleImport: () => import("../pages/profile/userProfile.js"),
//     functionName: "UserProfile",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/event\/([\w-]+)$/,
//     moduleImport: () => import("../pages/events/eventPage.js"),
//     functionName: "Event",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/artist\/([\w-]+)$/,
//     moduleImport: () => import("../pages/artist/artistPage.js"),
//     functionName: "Artist",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/chat\/([\w-]+)$/,
//     moduleImport: () => import("../pages/userchat/chat.js"),
//     functionName: "Chat",
//     protected: true,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/livechat\/([\w-]+)$/,
//     moduleImport: () => import("../pages/livechat/chat.js"),
//     functionName: "LiveChat",
//     protected: true,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/place\/([\w-]+)$/,
//     moduleImport: () => import("../pages/places/placePage.js"),
//     functionName: "Place",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/post\/([\w-]+)$/,
//     moduleImport: () => import("../pages/posts/displayPost.js"),
//     functionName: "Post",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/feedpost\/([\w-]+)$/,
//     moduleImport: () => import("../pages/feed/postDisplay.js"),
//     functionName: "Post",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/itinerary\/([\w-]+)$/,
//     moduleImport: () => import("../pages/itinerary/itineraryDisplay.js"),
//     functionName: "Itinerary",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/hashtag\/([\w-]+)$/,
//     moduleImport: () => import("../pages/hashtag/hashtagPage.js"),
//     functionName: "Hashtag",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/merechats\/([\w-]+)$/,
//     moduleImport: () => import("../pages/merechats/merePage.js"),
//     functionName: "OneChatPage",
//     protected: true,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/baito\/([\w-]+)$/,
//     moduleImport: () => import("../pages/baitos/displayBaito.js"),
//     functionName: "Baito",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/crop\/([\w-]+)$/,
//     moduleImport: () => import("../pages/crop/cropPage.js"),
//     functionName: "Crop",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/aboutcrop\/([\w-]+)$/,
//     moduleImport: () => import("../pages/crop/aboutCropPage.js"),
//     functionName: "AboutCrop",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/farm\/([\w-]+)$/,
//     moduleImport: () => import("../pages/crop/displayFarm.js"),
//     functionName: "Farm",
//     protected: false,
//     argBuilder: safeArgBuilder
//   },
//   {
//     pattern: /^\/recipe\/([\w-]+)$/,
//     moduleImport: () => import("../pages/recipe/recipePage.js"),
//     functionName: "Recipe",
//     protected: false,
//     argBuilder: safeArgBuilder
//   }
// ];

// // // routes.js

// // export const protectedRoutes = new Set([
// //     "/admin",
// //     "/chats",
// //     "/cart",
// //     "/settings",
// //     "/profile",
// //     "/my-orders",
// //     "/create-post",
// //     "/create-event",
// //     "/create-place",
// //     "/create-baito",
// //     "/create-itinerary",
// //     "/create-artist",
// //     "/edit-itinerary"
// //   ]);
  
// //   export const staticRoutes = {
// //     "/": { moduleImport: () => import("../pages/entry/entry.js"), functionName: "Entry" },
// //     "/home": { moduleImport: () => import("../pages/home.js"), functionName: "Home" },
// //     "/login": { moduleImport: () => import("../pages/auth/auth.js"), functionName: "Auth" },
// //     "/booking": { moduleImport: () => import("../pages/booking/booking.js"), functionName: "Booking" },
// //     "/merechats": { moduleImport: () => import("../pages/merechats/merechats.js"), functionName: "Mechat" },
// //     "/chats": { moduleImport: () => import("../pages/userchat/chats.js"), functionName: "Chats" },
// //     "/admin": { moduleImport: () => import("../pages/admin/admin.js"), functionName: "Admin" },
// //     "/livechat": { moduleImport: () => import("../pages/livechat/chats.js"), functionName: "LiveChats" },
// //     "/posts": { moduleImport: () => import("../pages/posts/posts.js"), functionName: "Posts" },
// //     "/baitos": { moduleImport: () => import("../pages/baitos/baitos.js"), functionName: "Baitos" },
// //     "/baitos/dash": { moduleImport: () => import("../pages/baitos/baitoDash.js"), functionName: "BaitoDash" },
// //     "/baitos/hire": { moduleImport: () => import("../pages/baitos/hireWorkers.js"), functionName: "HireWorkers" },
// //     "/baitos/create-profile": { moduleImport: () => import("../pages/baitos/createProfile.js"), functionName: "CreateProfile" },
// //     "/create-event": { moduleImport: () => import("../pages/events/createEvent.js"), functionName: "Create" },
// //     "/create-place": { moduleImport: () => import("../pages/places/createPlace.js"), functionName: "CreatePlace" },
// //     "/profile": { moduleImport: () => import("../pages/profile/userProfile.js"), functionName: "MyProfile" },
// //     "/events": { moduleImport: () => import("../pages/events/events.js"), functionName: "Events" },
// //     "/artists": { moduleImport: () => import("../pages/artist/artists.js"), functionName: "Artists" },
// //     "/places": { moduleImport: () => import("../pages/places/places.js"), functionName: "Places" },
// //     "/search": { moduleImport: () => import("../pages/search/search.js"), functionName: "Search" },
// //     "/settings": { moduleImport: () => import("../pages/profile/settings.js"), functionName: "Settings" },
// //     "/feed": { moduleImport: () => import("../pages/weed/weed.js"), functionName: "Weed" },
// //     "/social": { moduleImport: () => import("../pages/tumblr/tumblr.js"), functionName: "Tumblr" },
// //     "/create-post": { moduleImport: () => import("../pages/posts/createNewPost.js"), functionName: "Create" },
// //     "/create-baito": { moduleImport: () => import("../pages/baitos/createNewBaito.js"), functionName: "Create" },
// //     "/create-artist": { moduleImport: () => import("../pages/artist/createArtist.js"), functionName: "Create" },
// //     "/create-itinerary": { moduleImport: () => import("../pages/itinerary/createItinerary.js"), functionName: "CreateItinerary" },
// //     "/edit-itinerary": { moduleImport: () => import("../pages/itinerary/editItinerary.js"), functionName: "EditItinerary" },
// //     "/itinerary": { moduleImport: () => import("../pages/itinerary/itinerary.js"), functionName: "Itinerary" },
// //     "/cart": { moduleImport: () => import("../pages/cart/cart.js"), functionName: "Cart" },
// //     "/my-orders": { moduleImport: () => import("../pages/cart/myorders.js"), functionName: "MyOrders" },
// //     "/dash": { moduleImport: () => import("../pages/dash/dash.js"), functionName: "Dash" },
// //     "/recipes": { moduleImport: () => import("../pages/recipe/recipes.js"), functionName: "Recipes" },
// //     "/farms": { moduleImport: () => import("../pages/farm/farms.js"), functionName: "Farms" },
// //     "/tools": { moduleImport: () => import("../pages/farm/tools.js"), functionName: "Tools" },
// //     "/products": { moduleImport: () => import("../pages/farm/products.js"), functionName: "Products" },
// //     "/crops": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },
// //     "/grocery": { moduleImport: () => import("../pages/crop/crops.js"), functionName: "Crops" },
// //     "/create-farm": { moduleImport: () => import("../pages/farm/createNewFarm.js"), functionName: "Create" }
// //   };
  
// //   function safeArgBuilder(match) {
// //     return match && match[1] ? [true, match[1]] : [true, null];
// //   }
  
// //   export const dynamicRoutes = [
// //     {
// //       pattern: /^\/user\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/profile/userProfile.js"),
// //       functionName: "UserProfile",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/event\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/events/eventPage.js"),
// //       functionName: "Event",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/event\/([\w-]+)\/tickets$/,
// //       moduleImport: () => import("../pages/events/eventTicketsPage.js"),
// //       functionName: "EventTickets",
// //       protected: true,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/artist\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/artist/artistPage.js"),
// //       functionName: "Artist",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/merch\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/merch/merch.js"),
// //       functionName: "Merch",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/chat\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/userchat/chat.js"),
// //       functionName: "Chat",
// //       protected: true,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/livechat\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/livechat/chat.js"),
// //       functionName: "LiveChat",
// //       protected: true,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/place\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/places/placePage.js"),
// //       functionName: "Place",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/post\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/posts/displayPost.js"),
// //       functionName: "Post",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/baito\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/baitos/displayBaito.js"),
// //       functionName: "Baito",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/feedpost\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/feed/postDisplay.js"),
// //       functionName: "Post",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/itinerary\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/itinerary/itineraryDisplay.js"),
// //       functionName: "Itinerary",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/products\/([\w-]+)\/([a-f\d]{24})$/,
// //       moduleImport: () => import("../pages/product/product.js"),
// //       functionName: "Product",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },    
// //     {
// //       pattern: /^\/hashtag\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/hashtag/hashtagPage.js"),
// //       functionName: "Hashtag",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/merechats\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/merechats/merePage.js"),
// //       functionName: "OneChatPage",
// //       protected: true,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/crop\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/crop/cropPage.js"),
// //       functionName: "Crop",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/aboutcrop\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/crop/aboutCropPage.js"),
// //       functionName: "AboutCrop",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/farm\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/crop/displayFarm.js"),
// //       functionName: "Farm",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //     {
// //       pattern: /^\/recipe\/([\w-]+)$/,
// //       moduleImport: () => import("../pages/recipe/recipePage.js"),
// //       functionName: "Recipe",
// //       protected: false,
// //       argBuilder: safeArgBuilder
// //     },
// //   ];
  