// components/cart/cartModal.js
import Modal from "../../components/ui/Modal.mjs";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";

export function openCartModal() {
    const wrapper = createElement("div", {
        style: "padding: 1rem; display: flex; flex-direction: column; gap: 1rem;"
    });

    // Placeholder cart items
    wrapper.appendChild(createElement("p", {}, ["🛒 Your cart is empty."]));
    wrapper.appendChild(createElement("p", {}, ["Add items to see them here."]));

    const goToCartButton = createElement("button", {
        style: `
            margin-top: 1rem;
            padding: 0.6rem 1.2rem;
            background-color: var(--color-accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `,
    }, ["Go to Cart"]);

    goToCartButton.addEventListener("click", () => {
        modal.remove();
        navigate("/cart");
    });

    wrapper.appendChild(goToCartButton);

    const modal = Modal({
        title: "Cart Preview",
        content: wrapper,
        onClose: () => modal.remove()
    });
}
