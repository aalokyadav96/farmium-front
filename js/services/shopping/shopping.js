import { createElement } from "../../components/createElement";
import { Button } from "../../components/base/Button.js";

const apiFetch = async (endpoint) => {
    await new Promise(r => setTimeout(r, 200));
    const data = {
        "/products/first-hand": [
            { id: 1, title: "New Laptop", price: 1200, pickup: true, bids: 0 },
            { id: 2, title: "Brand New Phone", price: 800, pickup: false, bids: 0 },
            { id: 3, title: "New Car", price: 500, pickup: false, bids: 4 }
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

    const nav = createElement("nav", { class: "shopping-nav" },
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

    const filters = createElement("div", { class: "shopping-filters" }, [
        createElement("label", {}, ["Min Price ", priceMinInput]),
        createElement("label", {}, ["Max Price ", priceMaxInput]),
        createElement("label", {}, [pickupCheckbox, " Local Pickup Only"])
    ]);

    const sortSelect = createElement("select", {}, [
        createElement("option", { value: "default" }, ["Sort By"]),
        createElement("option", { value: "price-asc" }, ["Price: Low to High"]),
        createElement("option", { value: "price-desc" }, ["Price: High to Low"])
    ]);

    const sortContainer = createElement("div", { class: "shopping-sort" }, [sortSelect]);

    const controls = createElement("div", { class: "shopping-controls" }, [
        filters, sortContainer
    ]);

    const itemContainer = createElement("div", { class: "shopping-items" });

    const emptyState = createElement("div", { class: "shopping-empty", style: "display:none;" }, [
        "No products match your filters."
    ]);

    const layout = createElement("div", { class: "shopping-page" }, [
        nav,
        controls,
        itemContainer,
        emptyState
    ]);

    while (content.firstChild) content.removeChild(content.firstChild);
    content.appendChild(layout);

    setupEventHandlers();
    loadCategory(currentCategory);

    async function loadCategory(categoryId) {
        currentCategory = categoryId;
        clearElement(itemContainer);
        allItems = await apiFetch(`/products/${categoryId}`);
        applyFilters();
        updateActiveTab();
    }

    function applyFilters() {
        clearElement(itemContainer);

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

        if (filtered.length === 0) {
            emptyState.style.display = "block";
            return;
        } else {
            emptyState.style.display = "none";
        }

        filtered.forEach(item => {
            const card = renderItemCard(item, currentCategory);
            itemContainer.appendChild(card);
        });
    }

    function updateActiveTab() {
        nav.querySelectorAll(".shopping-tab").forEach(btn => {
            btn.classList.remove("active");
        });
        const activeBtn = nav.querySelector(`#nav-${currentCategory}`);
        if (activeBtn) activeBtn.classList.add("active");
    }

    function renderItemCard(item, categoryId) {
        const image = createElement("div", { class: "shopping-card-image" }, [
            createElement("img", { src: `/images/${item.id}.jpg`, alt: item.title })
        ]);

        const details = createElement("div", { class: "shopping-card-details" }, [
            createElement("h3", {}, [item.title]),
            createElement("span", { class: "shopping-card-price" }, [`$${item.price}`]),
            createElement("p", {}, ["Short product description goes here."]),
            createElement("div", {}, [`Category: ${categoryId.replace("-", " ")}`]),
            categoryId === "second-hand" ? createElement("div", {}, ["Condition: Good"]) : null,
            item.pickup ? createElement("div", {}, ["✔ Local Pickup Available"]) : null,
            categoryId === "auctions" ? createElement("div", {}, [`${item.bids} bid${item.bids === 1 ? "" : "s"}`]) : null,
            createElement("div", {}, ["Posted: 2 days ago"]),
            createElement("div", {}, ["Seller: John Doe ★★★★☆"]),
            createElement("div", { class: "shopping-card-actions" }, [
                ...(categoryId === "auctions" ? [Button("Bid", "", { click: () => handleBid(item) }, "buttonx")] : []),
                ...(isLoggedIn ? [Button("Message Seller", "", { click: () => openMessage(item.id) }, "buttonx")] : []),
                ...(isLoggedIn ? [Button("Add to Wishlist", "", { click: () => addToWishlist(item.id) }, "buttonx")] : [])
            ])
        ].filter(Boolean));

        return createElement("div", { class: "shopping-card" }, [image, details]);
    }

    function addToWishlist(itemId) {
        console.log(`Added item ${itemId} to wishlist`);
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

        const debounce = (fn, delay) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        };

        priceMinInput.addEventListener("input", debounce(e => {
            filterState.priceMin = parseInt(e.target.value) || 0;
            applyFilters();
        }, 300));

        priceMaxInput.addEventListener("input", debounce(e => {
            filterState.priceMax = parseInt(e.target.value) || 9999;
            applyFilters();
        }, 300));

        pickupCheckbox.addEventListener("change", e => {
            filterState.pickupOnly = e.target.checked;
            applyFilters();
        });

        sortSelect.addEventListener("change", e => {
            filterState.sortBy = e.target.value;
            applyFilters();
        });
    }

    function clearElement(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }
}
