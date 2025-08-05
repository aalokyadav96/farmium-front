import { createElement } from "../../components/createElement";
import { Button } from "../../components/base/Button.js";

const apiFetch = async (endpoint) => {
    await new Promise(r => setTimeout(r, 200));
    const data = {
        "/products/first-hand": [
            { id: 1, title: "New Laptop", price: 1200, pickup: true, bids: 0 },
            { id: 2, title: "Brand New Phone", price: 800, pickup: false, bids: 0 }
        ],
        "/products/second-hand": [
            { id: 3, title: "Used Monitor", price: 100, pickup: true, bids: 0 },
            { id: 4, title: "Old Chair", price: 25, pickup: true, bids: 0 }
        ],
        "/products/on-demand": [
            { id: 5, title: "Custom Shirt", price: 45, pickup: false, bids: 0 },
            { id: 6, title: "3D Printed Figure", price: 30, pickup: false, bids: 0 }
        ],
        "/products/rentals": [
            { id: 7, title: "Camera Rental", price: 50, pickup: true, bids: 0 },
            { id: 8, title: "Bike Rental", price: 20, pickup: true, bids: 0 }
        ],
        "/products/auctions": [
            { id: 9, title: "Antique Vase", price: 200, pickup: true, bids: 2 },
            { id: 10, title: "Rare Comic", price: 500, pickup: false, bids: 5 }
        ],
        "/products/exchange": [
            { id: 11, title: "Book for Trade", price: 0, pickup: true, bids: 0 },
            { id: 12, title: "Guitar Swap", price: 0, pickup: false, bids: 0 }
        ]
    };
    return data[endpoint] || [];
};

export async function displayShopping(content, isLoggedIn) {
    const categories = [
        { id: "first-hand", label: "First-hand Products" },
        { id: "second-hand", label: "Second-hand Products" },
        { id: "on-demand", label: "On-demand Products" },
        { id: "rentals", label: "Rental Products" },
        { id: "auctions", label: "Auctions" },
        { id: "exchange", label: "Exchange Listings" }
    ];

    let currentCategory = "first-hand";
    let allItems = [];

    const filterState = {
        priceMin: 0,
        priceMax: 9999,
        pickupOnly: false,
        sortBy: "default"
    };

    const nav = createElement("nav", { id: "shopping-nav" },
        categories.map(cat =>
            Button(cat.label, `nav-${cat.id}`, {}, "shopping-tab buttonx")
        )
    );

    const priceMinInput = createElement("input", {
        type: "number",
        value: filterState.priceMin
    });

    const priceMaxInput = createElement("input", {
        type: "number",
        value: filterState.priceMax
    });

    const pickupCheckbox = createElement("input", {
        type: "checkbox",
        checked: filterState.pickupOnly
    });

    const filters = createElement("div", { id: "filters" }, [
        createElement("label", {}, ["Min Price ", priceMinInput]),
        createElement("label", {}, ["Max Price ", priceMaxInput]),
        createElement("label", {}, [pickupCheckbox, " Local Pickup Only"])
    ]);

    const sortSelect = createElement("select", {}, [
        createElement("option", { value: "default" }, ["Sort By"]),
        createElement("option", { value: "price-asc" }, ["Price: Low to High"]),
        createElement("option", { value: "price-desc" }, ["Price: High to Low"])
    ]);

    const sortContainer = createElement("div", { id: "sort-options" }, [sortSelect]);
    const itemContainer = createElement("div", { id: "items" });

    const layout = createElement("div", { id: "shopping-page" }, [
        nav,
        createElement("div", { id: "controls" }, [filters, sortContainer]),
        itemContainer
    ]);

    content.innerHTML = "";
    content.appendChild(layout);

    setupEventHandlers();

    async function loadCategory(categoryId) {
        currentCategory = categoryId;
        itemContainer.innerHTML = "";
        allItems = await apiFetch(`/products/${categoryId}`);
        applyFilters();
        updateActiveTab();
    }

    function applyFilters() {
        itemContainer.innerHTML = "";

        let filtered = allItems.filter(item => {
            return (
                item.price >= filterState.priceMin &&
                item.price <= filterState.priceMax &&
                (!filterState.pickupOnly || item.pickup)
            );
        });

        switch (filterState.sortBy) {
            case "price-asc":
                filtered.sort((a, b) => a.price - b.price); break;
            case "price-desc":
                filtered.sort((a, b) => b.price - a.price); break;
        }

        filtered.forEach(item => {
            itemContainer.appendChild(renderItemCard(item, currentCategory));
        });
    }

    function updateActiveTab() {
        document.querySelectorAll(".shopping-tab").forEach(btn => {
            btn.classList.remove("active");
        });
        const activeBtn = document.getElementById(`nav-${currentCategory}`);
        if (activeBtn) activeBtn.classList.add("active");
    }

    function renderItemCard(item, categoryId) {
        const image = createElement("div", {}, ["Image"]);

        const title = createElement("h3", {}, [item.title]);
        const price = createElement("span", {}, [`$${item.price}`]);
        const description = createElement("p", {}, ["Short product description goes here."]);

        const condition = categoryId === "second-hand"
            ? createElement("div", {}, ["Condition: Good"])
            : null;

        const pickup = item.pickup
            ? createElement("div", {}, ["✔ Local Pickup Available"])
            : null;

        const bids = categoryId === "auctions"
            ? createElement("div", {}, [`${item.bids} bid${item.bids === 1 ? "" : "s"}`])
            : null;

        const actions = createElement("div", {}, [
            ...(categoryId === "auctions" ? [Button("Bid", "", { click: () => handleBid(item) })] : []),
            Button("Message Seller", "", { click: () => openMessage(item.id) })
        ]);

        return createElement("div", { class: "item-card" }, [
            image, title, price, description,
            condition, pickup, bids, actions
        ].filter(Boolean));
    }

    function handleBid(item) {
        console.log(`Placing bid on item ${item.id}`);
    }

    function openMessage(itemId) {
        console.log(`Opening message for item ${itemId}`);
    }

    function setupEventHandlers() {
        categories.forEach(cat => {
            const btn = document.getElementById(`nav-${cat.id}`);
            if (btn) {
                btn.addEventListener("click", () => loadCategory(cat.id));
            }
        });

        priceMinInput.addEventListener("input", e => {
            filterState.priceMin = parseInt(e.target.value) || 0;
            applyFilters();
        });

        priceMaxInput.addEventListener("input", e => {
            filterState.priceMax = parseInt(e.target.value) || 9999;
            applyFilters();
        });

        pickupCheckbox.addEventListener("change", e => {
            filterState.pickupOnly = e.target.checked;
            applyFilters();
        });

        sortSelect.addEventListener("change", e => {
            filterState.sortBy = e.target.value;
            applyFilters();
        });
    }

    loadCategory(currentCategory);
}

// import { createElement } from "../../components/createElement";
// import { Button } from "../../components/base/Button.js";

// // Dummy backend simulation
// const apiFetch = async (endpoint, method = "GET", body = null, options = {}) => {
//     await new Promise(r => setTimeout(r, 200));

//     const data = {
//         "/products/first-hand": [
//             { id: 1, title: "New Laptop", price: 1200, pickup: true, bids: 0 },
//             { id: 2, title: "Brand New Phone", price: 800, pickup: false, bids: 0 }
//         ],
//         "/products/second-hand": [
//             { id: 3, title: "Used Monitor", price: 100, pickup: true, bids: 0 },
//             { id: 4, title: "Old Chair", price: 25, pickup: true, bids: 0 }
//         ],
//         "/products/on-demand": [
//             { id: 5, title: "Custom Shirt", price: 45, pickup: false, bids: 0 },
//             { id: 6, title: "3D Printed Figure", price: 30, pickup: false, bids: 0 }
//         ],
//         "/products/rentals": [
//             { id: 7, title: "Camera Rental", price: 50, pickup: true, bids: 0 },
//             { id: 8, title: "Bike Rental", price: 20, pickup: true, bids: 0 }
//         ],
//         "/products/auctions": [
//             { id: 9, title: "Antique Vase", price: 200, pickup: true, bids: 2 },
//             { id: 10, title: "Rare Comic", price: 500, pickup: false, bids: 5 }
//         ],
//         "/products/exchange": [
//             { id: 11, title: "Book for Trade", price: 0, pickup: true, bids: 0 },
//             { id: 12, title: "Guitar Swap", price: 0, pickup: false, bids: 0 }
//         ]
//     };

//     return data[endpoint] || [];
// };

// export async function displayShopping(content, isLoggedIn) {
//     const categories = [
//         { id: "first-hand", label: "First-hand Products" },
//         { id: "second-hand", label: "Second-hand Products" },
//         { id: "on-demand", label: "On-demand Products" },
//         { id: "rentals", label: "Rental Products" },
//         { id: "auctions", label: "Auctions" },
//         { id: "exchange", label: "Exchange Listings" }
//     ];

//     let currentCategory = "first-hand";
//     let allItems = [];

//     const filterState = {
//         priceMin: 0,
//         priceMax: 9999,
//         pickupOnly: false,
//         sortBy: "default"
//     };

//     const nav = createElement("nav", { id: "shopping-nav" },
//         categories.map(cat =>
//             Button(cat.label, `nav-${cat.id}`, {
//                 click: () => loadCategory(cat.id)
//             }, "shopping-tab buttonx")
//         )
//     );

//     const filters = createElement("div", { id: "filters" }, [
//         createElement("label", {}, [
//             "Min Price ",
//             createElement("input", {
//                 type: "number",
//                 value: filterState.priceMin,
//                 input: e => {
//                     filterState.priceMin = parseInt(e.target.value) || 0;
//                     applyFilters();
//                 }
//             })
//         ]),
//         createElement("label", {}, [
//             "Max Price ",
//             createElement("input", {
//                 type: "number",
//                 value: filterState.priceMax,
//                 input: e => {
//                     filterState.priceMax = parseInt(e.target.value) || 9999;
//                     applyFilters();
//                 }
//             })
//         ]),
//         createElement("label", {}, [
//             createElement("input", {
//                 type: "checkbox",
//                 checked: filterState.pickupOnly,
//                 change: e => {
//                     filterState.pickupOnly = e.target.checked;
//                     applyFilters();
//                 }
//             }),
//             " Local Pickup Only"
//         ])
//     ]);

//     const sortOptions = createElement("select", {
//         change: e => {
//             filterState.sortBy = e.target.value;
//             applyFilters();
//         }
//     }, [
//         createElement("option", { value: "default" }, ["Sort By"]),
//         createElement("option", { value: "price-asc" }, ["Price: Low to High"]),
//         createElement("option", { value: "price-desc" }, ["Price: High to Low"])
//     ]);

//     const sortContainer = createElement("div", { id: "sort-options" }, [sortOptions]);
//     const itemContainer = createElement("div", { id: "items" });

//     const layout = createElement("div", { id: "shopping-page" }, [
//         nav,
//         createElement("div", { id: "controls" }, [filters, sortContainer]),
//         itemContainer
//     ]);

//     content.innerHTML = "";
//     content.appendChild(layout);

//     async function loadCategory(categoryId) {
//         currentCategory = categoryId;
//         itemContainer.innerHTML = "";
//         allItems = await apiFetch(`/products/${categoryId}`);
//         applyFilters();
//     }

//     function applyFilters() {
//         itemContainer.innerHTML = "";

//         let filtered = allItems.filter(item => {
//             const withinPrice = item.price >= filterState.priceMin && item.price <= filterState.priceMax;
//             const pickupMatch = !filterState.pickupOnly || item.pickup;
//             return withinPrice && pickupMatch;
//         });

//         switch (filterState.sortBy) {
//             case "price-asc":
//                 filtered.sort((a, b) => a.price - b.price);
//                 break;
//             case "price-desc":
//                 filtered.sort((a, b) => b.price - a.price);
//                 break;
//         }

//         filtered.forEach(item => {
//             itemContainer.appendChild(renderItemCard(item, currentCategory));
//         });
//     }

//     function renderItemCard(item, categoryId) {
//         const image = createElement("div", {
//             style: {
//                 width: "100%",
//                 height: "150px",
//                 background: "#eee",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 color: "#999",
//                 fontSize: "0.9rem"
//             }
//         }, ["Image"]);

//         const title = createElement("h3", {}, [item.title]);
//         const price = createElement("span", {}, [`$${item.price}`]);

//         const description = createElement("p", {
//             style: {
//                 fontSize: "0.85rem",
//                 margin: "0.25rem 0",
//                 color: "#444"
//             }
//         }, ["Short product description goes here."]);

//         const condition = (categoryId === "second-hand")
//             ? createElement("div", {
//                 style: { fontSize: "0.8rem", color: "#777" }
//             }, ["Condition: Good"])
//             : null;

//         const pickup = item.pickup
//             ? createElement("div", {
//                 style: { fontSize: "0.8rem", color: "#007700" }
//             }, ["✔ Local Pickup Available"])
//             : null;

//         const bids = (categoryId === "auctions")
//             ? createElement("div", {
//                 style: { fontSize: "0.8rem", color: "#555" }
//             }, [`${item.bids} bid${item.bids === 1 ? "" : "s"}`])
//             : null;

//         const buttons = [
//             (categoryId === "auctions") && Button("Bid", "", { click: () => handleBid(item) }),
//             Button("Message Seller", "", { click: () => openMessage(item.id) })
//         ].filter(Boolean);

//         const actions = createElement("div", {
//             style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }
//         }, buttons);

//         return createElement("div", { class: "item-card" }, [
//             image,
//             title,
//             price,
//             description,
//             condition,
//             pickup,
//             bids,
//             actions
//         ].filter(Boolean));
//     }

//     function handleBid(item) {
//         console.log(`Placing bid on item ${item.id}`);
//     }

//     function openMessage(itemId) {
//         console.log(`Opening message for item ${itemId}`);
//     }

//     loadCategory(currentCategory);
// }

// import { createElement } from "../../components/createElement";
// import { Button } from "../../components/base/Button.js";

// // Dummy backend simulation
// const apiFetch = async (endpoint, method = "GET", body = null, options = {}) => {
//     await new Promise(r => setTimeout(r, 200)); // simulate latency

//     const data = {
//         "/products/first-hand": [
//             { id: 1, title: "New Laptop", price: 1200, pickup: true, bids: 0 },
//             { id: 2, title: "Brand New Phone", price: 800, pickup: false, bids: 0 }
//         ],
//         "/products/second-hand": [
//             { id: 3, title: "Used Monitor", price: 100, pickup: true, bids: 0 },
//             { id: 4, title: "Old Chair", price: 25, pickup: true, bids: 0 }
//         ],
//         "/products/on-demand": [
//             { id: 5, title: "Custom Shirt", price: 45, pickup: false, bids: 0 },
//             { id: 6, title: "3D Printed Figure", price: 30, pickup: false, bids: 0 }
//         ],
//         "/products/rentals": [
//             { id: 7, title: "Camera Rental", price: 50, pickup: true, bids: 0 },
//             { id: 8, title: "Bike Rental", price: 20, pickup: true, bids: 0 }
//         ],
//         "/products/auctions": [
//             { id: 9, title: "Antique Vase", price: 200, pickup: true, bids: 2 },
//             { id: 10, title: "Rare Comic", price: 500, pickup: false, bids: 5 }
//         ],
//         "/products/exchange": [
//             { id: 11, title: "Book for Trade", price: 0, pickup: true, bids: 0 },
//             { id: 12, title: "Guitar Swap", price: 0, pickup: false, bids: 0 }
//         ]
//     };

//     return data[endpoint] || [];
// };

// export async function displayShopping(content, isLoggedIn) {
//     const categories = [
//         { id: "first-hand", label: "First-hand Products" },
//         { id: "second-hand", label: "Second-hand Products" },
//         { id: "on-demand", label: "On-demand Products" },
//         { id: "rentals", label: "Rental Products" },
//         { id: "auctions", label: "Auctions" },
//         { id: "exchange", label: "Exchange Listings" }
//     ];

//     let currentCategory = "first-hand";
//     let allItems = [];

//     const filterState = {
//         priceMin: 0,
//         priceMax: 9999,
//         pickupOnly: false,
//         sortBy: "default"
//     };

//     const nav = createElement("nav", { id: "shopping-nav" },
//         categories.map(cat =>
//             Button(cat.label, `nav-${cat.id}`, {
//                 click: () => loadCategory(cat.id)
//             }, "shopping-tab")
//         )
//     );

//     const filters = createElement("div", { id: "filters" }, [
//         createElement("label", {}, [
//             "Min Price ",
//             createElement("input", {
//                 type: "number",
//                 value: filterState.priceMin,
//                 input: e => {
//                     filterState.priceMin = parseInt(e.target.value) || 0;
//                     applyFilters();
//                 }
//             })
//         ]),
//         createElement("label", {}, [
//             "Max Price ",
//             createElement("input", {
//                 type: "number",
//                 value: filterState.priceMax,
//                 input: e => {
//                     filterState.priceMax = parseInt(e.target.value) || 9999;
//                     applyFilters();
//                 }
//             })
//         ]),
//         createElement("label", {}, [
//             createElement("input", {
//                 type: "checkbox",
//                 checked: filterState.pickupOnly,
//                 change: e => {
//                     filterState.pickupOnly = e.target.checked;
//                     applyFilters();
//                 }
//             }),
//             " Local Pickup Only"
//         ])
//     ]);

//     const sortOptions = createElement("select", {
//         change: e => {
//             filterState.sortBy = e.target.value;
//             applyFilters();
//         }
//     }, [
//         createElement("option", { value: "default" }, ["Sort By"]),
//         createElement("option", { value: "price-asc" }, ["Price: Low to High"]),
//         createElement("option", { value: "price-desc" }, ["Price: High to Low"])
//     ]);

//     const sortContainer = createElement("div", { id: "sort-options" }, [sortOptions]);
//     const itemContainer = createElement("div", { id: "items" });

//     const layout = createElement("div", { id: "shopping-page" }, [
//         nav,
//         filters,
//         sortContainer,
//         itemContainer
//     ]);

//     content.innerHTML = "";
//     content.appendChild(layout);

//     async function loadCategory(categoryId) {
//         currentCategory = categoryId;
//         itemContainer.innerHTML = "";
//         allItems = await apiFetch(`/products/${categoryId}`);
//         applyFilters();
//     }

//     function applyFilters() {
//         itemContainer.innerHTML = "";

//         let filtered = allItems.filter(item => {
//             const withinPrice = item.price >= filterState.priceMin && item.price <= filterState.priceMax;
//             const pickupMatch = !filterState.pickupOnly || item.pickup;
//             return withinPrice && pickupMatch;
//         });

//         switch (filterState.sortBy) {
//             case "price-asc":
//                 filtered.sort((a, b) => a.price - b.price);
//                 break;
//             case "price-desc":
//                 filtered.sort((a, b) => b.price - a.price);
//                 break;
//         }

//         filtered.forEach(item => {
//             itemContainer.appendChild(renderItemCard(item, currentCategory));
//         });
//     }

//     function renderItemCard(item, categoryId) {
//         const info = createElement("div", {}, [
//             createElement("h3", {}, [item.title]),
//             createElement("span", {}, [`$${item.price}`])
//         ]);

//         const actions = [];

//         if (categoryId === "auctions") {
//             actions.push(Button("Bid", "", {
//                 click: () => handleBid(item)
//             }));
//         }

//         if (item.pickup) {
//             actions.push(createElement("div", {}, ["Local Pickup Available"]));
//         }

//         actions.push(Button("Message Seller", "", {
//             click: () => openMessage(item.id)
//         }));

//         return createElement("div", { class: "item-card" }, [
//             info,
//             ...actions
//         ]);
//     }

//     function handleBid(item) {
//         console.log(`Placing bid on item ${item.id}`);
//     }

//     function openMessage(itemId) {
//         console.log(`Opening message for item ${itemId}`);
//     }

//     // Initial load
//     loadCategory(currentCategory);
// }


// // // This captures microphone input
// // navigator.mediaDevices.getUserMedia({ audio: true })
// //   .then(stream => {
// //     const audioCtx = new AudioContext();
// //     const analyser = audioCtx.createAnalyser();
// //     const source = audioCtx.createMediaStreamSource(stream);
// //     source.connect(analyser);

// //     const dataArray = new Uint8Array(analyser.frequencyBinCount);

// //     function animate() {
// //       analyser.getByteFrequencyData(dataArray);
// //       const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;

// //       document.body.style.backgroundColor = `rgba(${avg}, 100, ${255 - avg}, 0.6)`;
// //       requestAnimationFrame(animate);
// //     }
// //     animate();
// //   })
// //   .catch(e => console.error('Mic access denied:', e));
