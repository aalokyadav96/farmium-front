// components/cart/cartModal.js
import Modal from "../../components/ui/Modal.mjs";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";

export async function openCartModal() {
    const wrapper = createElement("div", {
        style: "padding: 1rem; display: flex; flex-direction: column; gap: 1rem;"
    });

    let cart = [];
    try {
        cart = await apiFetch("/cart", "GET");
    } catch (e) {
        wrapper.appendChild(createElement("p", {}, ["Failed to load cart."]));
    }

    if (!cart.length) {
        wrapper.appendChild(createElement("p", {}, ["🛒 Your cart is empty."]));
        wrapper.appendChild(createElement("p", {}, ["Add items to see them here."]));
    } else {
        const grouped = groupCart(cart);
        const list = createElement("ul", { style: "list-style: none; padding: 0;" });

        grouped.forEach(item => {
            list.appendChild(createElement("li", {
                style: "display: flex; justify-content: space-between;"
            }, [
                `${item.item} (${item.quantity})`,
                `₹${item.quantity * item.price}`
            ]));
        });

        const total = grouped.reduce((sum, item) => sum + item.quantity * item.price, 0);

        wrapper.appendChild(createElement("h4", {}, ["🛒 Your Cart"]));
        wrapper.appendChild(list);
        wrapper.appendChild(createElement("p", {
            style: "font-weight: bold; text-align: right;"
        }, [`Total: ₹${total}`]));
    }

    const goToCartButton = createElement("button", {
        style: `
            margin-top: 1rem;
            padding: 0.6rem 1.2rem;
            background-color: var(--color-accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `
    }, ["Go to Cart"]);

    goToCartButton.addEventListener("click", () => {
        modal.remove();
        document.body.style.overflow = "";
        navigate("/cart");
    });

    wrapper.appendChild(goToCartButton);

    const modal = Modal({
        title: "Cart Preview",
        content: wrapper,
        onClose: () => modal.remove()
    });
}

function groupCart(items) {
    const map = {};
    items.forEach(it => {
        const key = it.category === "crops" ? `${it.item}__${it.farm}` : it.item;
        if (!map[key]) map[key] = { ...it };
        else map[key].quantity += it.quantity;
    });
    return Object.values(map);
}


// // components/cart/cartModal.js
// import Modal from "../../components/ui/Modal.mjs";
// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";

// export function openCartModal() {
//     const wrapper = createElement("div", {
//         style: "padding: 1rem; display: flex; flex-direction: column; gap: 1rem;"
//     });

//     // Placeholder cart items
//     wrapper.appendChild(createElement("p", {}, ["🛒 Your cart is empty."]));
//     wrapper.appendChild(createElement("p", {}, ["Add items to see them here."]));

//     const goToCartButton = createElement("button", {
//         style: `
//             margin-top: 1rem;
//             padding: 0.6rem 1.2rem;
//             background-color: var(--color-accent);
//             color: white;
//             border: none;
//             border-radius: 4px;
//             cursor: pointer;
//         `,
//     }, ["Go to Cart"]);

//     goToCartButton.addEventListener("click", () => {
//         modal.remove();
//         document.body.style.overflow = "";
//         navigate("/cart");
//     });

//     wrapper.appendChild(goToCartButton);

//     const modal = Modal({
//         title: "Cart Preview",
//         content: wrapper,
//         onClose: () => modal.remove()
//     });
// }
