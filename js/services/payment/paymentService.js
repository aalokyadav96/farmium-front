import { apiFetch } from "../../api/api.js";
import { Button } from "../../components/base/Button.js";
import Modal from "../../components/ui/Modal.mjs";
import { logActivity } from "../activity/activity_x.js";

// Purchase entry point
async function handlePurchase(entityType, itemType = "merch", itemId, eventId, maxQuantity) {
    if (!["merch", "menu"].includes(itemType)) {
        alert("Unsupported item type.");
        return;
    }

    // const modal = createQuantityModal(entityType, itemType, maxQuantity, async (quantity) => {
    createQuantityModal(entityType, itemType, maxQuantity, async (quantity) => {
        try {
            const paymentSession = await createPaymentSession(entityType, itemType, itemId, eventId, quantity);
            if (paymentSession) {
                showPaymentModal(entityType, itemType, paymentSession, eventId, itemId);
            }
        } catch (error) {
            console.error("Error creating payment session:", error);
            alert("Failed to initiate payment.");
        }
        // modal.remove();
    });

    // document.body.appendChild(modal);
}

// Modal for quantity input
function createQuantityModal(entityType, itemType, maxQuantity, onConfirm) {
    const content = document.createElement("div");

    const label = createElement("label", {
        for: "quantity-input",
        textContent: "Enter Quantity:"
    });

    const input = createElement("input", {
        id: "quantity-input",
        type: "number",
        min: "1",
        max: String(maxQuantity),
        value: "1",
        "aria-label": `${entityType} quantity`
    });

    const confirmBtn = Button("Proceed to Payment", "confirm-purchase-btn", {
        click: () => {
            const quantity = parseInt(input.value);
            if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
                alert(`Enter a valid quantity between 1 and ${maxQuantity}.`);
                return;
            }
            confirmBtn.disabled = true;
            onConfirm(quantity);
        }
    });

    content.append(label, input, confirmBtn);

    var modal = Modal({
        title: `Purchase ${itemType === "merch" ? "Merchandise" : "Menu Item"}`,
        content,
        onClose: () => modal.remove()
    })

    return modal;
}

// // Modal for payment input
// function showPaymentModal(entityType, itemType, paymentSession, eventId, itemId) {
//     const content = document.createElement("div");

//     const cardNumber = createInputField("card-number", "text", "Card Number");
//     const expiry = createInputField("expiry-date", "text", "MM/YY Expiry");
//     const cvv = createInputField("cvv", "text", "CVV");

//     const message = createElement("p", { id: "payment-message", textContent: "Enter your card details." });

//     const confirmBtn = Button("Pay Now", "confirm-payment-btn", {
//         click: () => submitPayment(entityType, itemType, paymentSession, message, eventId, itemId)
//     });

//     content.append(cardNumber, expiry, cvv, message, confirmBtn);

//     const modal = Modal({
//         title: "Payment Information",
//         content,
//         onClose: () => modal.remove()
//     });

//     document.body.appendChild(modal);
// }

// // Input field factory
// function createInputField(id, type, placeholder) {
//     return createElement("input", { id, type, placeholder });
// }

// // Element factory
// function createElement(tag, attrs = {}) {
//     const el = document.createElement(tag);
//     Object.assign(el, attrs);
//     return el;
// }
// Modal for payment input
function showPaymentModal(entityType, itemType, paymentSession, eventId, itemId) {
    const content = document.createElement("div");

    const cardNumber = createInputField("card-number", "text", "Card Number", {
        maxLength: 16,
        pattern: "\\d{16}",
        inputmode: "numeric"
    });

    const expiry = createInputField("expiry-date", "text", "MM/YY Expiry", {
        maxLength: 5,
        pattern: "\\d{2}/\\d{2}",
        placeholder: "MM/YY"
    });

    const cvv = createInputField("cvv", "text", "CVV", {
        maxLength: 3,
        pattern: "\\d{3}",
        inputmode: "numeric"
    });

    const message = createElement("p", {
        id: "payment-message",
        textContent: "Enter your card details."
    });

    const confirmBtn = Button("Pay Now", "confirm-payment-btn", {
        click: () => submitPayment(entityType, itemType, paymentSession, message, eventId, itemId)
    });

    content.append(cardNumber, expiry, cvv, message, confirmBtn);

    const modal = Modal({
        title: "Payment Information",
        content,
        onClose: () => modal.remove()
    });

    document.body.appendChild(modal);
}

// Input field factory with optional attribute overrides
function createInputField(id, type, placeholder, extraAttrs = {}) {
    return createElement("input", {
        id,
        type,
        placeholder,
        ...extraAttrs
    });
}

// Element factory
function createElement(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    return el;
}

// Payment session creation
async function createPaymentSession(entityType, itemType, itemId, eventId, quantity) {
    const config = ENTITY_CONFIG[itemType];
    if (!config) throw new Error(`Unsupported item type: ${itemType}`);

    const url = config.apiPath(eventId, itemId);
    const payload = JSON.stringify(config.payload(itemId, eventId, quantity));

    const response = await apiFetch(url, "POST", payload);
    if (response?.success && response.data) return response.data;

    throw new Error(response?.message || "Failed to create payment session.");
}

// Payment submission with card validation
async function submitPayment(entityType, itemType, paymentSession, messageEl, eventId, itemId) {
    const card = document.getElementById("card-number")?.value.trim();
    const expiry = document.getElementById("expiry-date")?.value.trim();
    const cvv = document.getElementById("cvv")?.value.trim();

    const btn = document.getElementById("confirm-payment-btn");
    btn.disabled = true;

    const validation = validateCardDetails(card, expiry, cvv);
    if (!validation.valid) {
        messageEl.textContent = validation.message;
        btn.disabled = false;
        return;
    }

    messageEl.textContent = "Processing payment...";

    setTimeout(async () => {
        try {
            const config = CONFIRM_PURCHASE_CONFIG[itemType];
            const url = config.apiPath(eventId, itemId);
            const payload = JSON.stringify(config.payload(paymentSession));

            const response = await apiFetch(url, "POST", payload);
            if (response?.message?.includes("Payment successfully processed")) {
                logActivity("purchase_made", { itemId, eventId });
                alert(`${itemType} purchased successfully.`);
                window.location.href = `/${entityType}/${eventId}`;
            } else {
                throw new Error("Unexpected response from server.");
            }
        } catch (err) {
            console.error("Payment error:", err);
            alert("Payment failed.");
            messageEl.textContent = "Payment failed. Please try again.";
            btn.disabled = false;
        }
    }, 1500);
}

// Card validation
function validateCardDetails(cardNumber, expiry, cvv) {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    // if (!/^\d{13,19}$/.test(cleanNumber) || !luhnCheck(cleanNumber)) {
    //     return { valid: false, message: "Invalid card number." };
    // }
    if (!/^\d{13,19}$/.test(cleanNumber)) {
        return { valid: false, message: "Invalid card number." };
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return { valid: false, message: "Invalid expiry format. Use MM/YY." };
    }

    if (!/^\d{3,4}$/.test(cvv)) {
        return { valid: false, message: "Invalid CVV." };
    }

    return { valid: true };
}

// Luhn algorithm for card number
function luhnCheck(num) {
    let sum = 0;
    let shouldDouble = false;

    for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num[i], 10);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

// Configuration
const ENTITY_CONFIG = {
    merch: {
        apiPath: (eventId, itemId) => `/merch/event/${eventId}/${itemId}/payment-session`,
        payload: (itemId, eventId, qty) => ({ merchId: itemId, eventId, stock: qty })
    },
    menu: {
        apiPath: (eventId, itemId) => `/places/menu/${eventId}/${itemId}/payment-session`,
        payload: (itemId, eventId, qty) => ({ menuId: itemId, eventId, stock: qty })
    }
};

const CONFIRM_PURCHASE_CONFIG = {
    merch: {
        apiPath: (eventId, itemId) => `/merch/event/${eventId}/${itemId}/confirm-purchase`,
        payload: (session) => ({ merchId: session.merchId, eventId: session.eventId, stock: session.stock })
    },
    menu: {
        apiPath: (eventId, itemId) => `/places/menu/${eventId}/${itemId}/confirm-purchase`,
        payload: (session) => ({ menuId: session.menuId, eventId: session.placeId, stock: session.stock })
    }
};

export { handlePurchase };

// // import { state } from "../../state/state.js";
// import { apiFetch } from "../../api/api.js";
// import { Button } from "../../components/base/Button.js";
// import Modal from "../../components/ui/Modal.mjs";
// import { logActivity } from "../activity/activity.js";

// // Unified function for merchandise or ticket purchase
// async function handlePurchase(entityType, type = "merch", itemId, eventId, maxQuantity, totalQuantity) {
//     if (type === "merch") {
//         const modal = createQuantityModal(type, maxQuantity, async (quantity) => {
//             try {
//                 const paymentSession = await createPaymentSession(entityType, type, itemId, eventId, quantity);
//                 if (paymentSession) {
//                     showPaymentModal(entityType, type, paymentSession, eventId, itemId);
//                 }
//             } catch (error) {
//                 console.error("Error creating payment session:", error);
//                 alert("Failed to initiate payment. Please try again.");
//             }
//             modal.remove(); // Close modal after action
//         });

//         document.body.appendChild(modal);
//     } else if (type === "menu") {
//         // entityType = "place";
//         try {
//             const paymentSession = await createPaymentSession(entityType, type, itemId, eventId, maxQuantity);
//             if (paymentSession) {
//                 showPaymentModal(entityType, type, paymentSession, eventId, itemId);
//             }
//         } catch (error) {
//             console.error("Error creating payment session:", error);
//             alert("Failed to initiate payment. Please try again.");
//         }
//     }
// }


// // Create a reusable modal for quantity input
// function createQuantityModal(entityType, maxQuantity, onConfirm) {
//     const content = document.createElement("div");

//     const quantityLabel = createElement("label", { for: "quantity-input", textContent: "Enter Quantity:" });
//     const quantityInput = createElement("input", {
//         id: "quantity-input",
//         type: "number",
//         min: "1",
//         max: maxQuantity.toString(),
//         value: "1",
//         "aria-label": `${entityType} Quantity`,
//     });

//     const confirmButton = Button("Proceed to Payment", "confirm-purchase-btn", {
//         click: () => {
//             const quantity = parseInt(quantityInput.value);
//             if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
//                 alert(`Please enter a valid quantity between 1 and ${maxQuantity}.`);
//                 return;
//             }
//             confirmButton.disabled = true;
//             onConfirm(quantity);
//         },
//     });

//     content.append(quantityLabel, quantityInput, confirmButton);

//     return Modal({
//         title: `Purchase ${entityType === "merch" ? "Merchandise" : "Ticket"}`,
//         content,
//     });
// }

// // Create and show the payment modal
// function showPaymentModal(entityType, type, paymentSession, eventId, merchId = null) {
//     const content = document.createElement("div");
//     const cardNumberInput = createInputField("card-number", "text", "Card Number");
//     const expiryDateInput = createInputField("expiry-date", "text", "MM/YY Expiry Date");
//     const cvvInput = createInputField("cvv", "text", "CVV");
//     const paymentMessage = createElement("p", { id: "payment-message", textContent: "Enter your card details to proceed." });

//     const confirmButton = Button("Pay Now", "confirm-payment-btn", {
//         click: () => submitPayment(entityType, type, paymentSession, paymentMessage, eventId, merchId),
//     });

//     content.append(cardNumberInput, expiryDateInput, cvvInput, paymentMessage, confirmButton);

//     const modal = Modal({
//         title: "Payment Information",
//         content,
//         onClose: () => modal.remove(),
//     });


//     document.body.appendChild(modal);


//     // document.body.appendChild(
//     //     Modal({
//     //         title: "Payment Information",
//     //         content,
//     //         onClose: () => this.remove(),
//     //     })
//     // );
// }

// // Helper function to create input fields
// function createInputField(id, type, placeholder) {
//     return createElement("input", { id, type, placeholder });
// }

// // Helper function to create HTML elements
// function createElement(tag, attributes = {}) {
//     const element = document.createElement(tag);
//     Object.assign(element, attributes);
//     return element;
// }


// // Configuration for different entity types
// const ENTITY_CONFIG = {
//     merch: {
//         apiPath: (eventId, itemId) => `/merch/event/${eventId}/${itemId}/payment-session`,
//         payload: (itemId, eventId, quantity) => ({ merchId: itemId, eventId, stock: quantity })
//     },
//     menu: {
//         apiPath: (eventId, itemId) => `/places/menu/${eventId}/${itemId}/payment-session`,
//         payload: (itemId, eventId, quantity) => ({ menuId: itemId, eventId, stock: quantity })
//     }
//     // Add more entity types here if needed
// };

// // Create a payment session for any entity type
// async function createPaymentSession(entityType, itemType, itemId, eventId, quantity) {
//     try {
//         if (!ENTITY_CONFIG[itemType]) {
//             throw new Error(`Unsupported entity type: ${itemType}`);
//         }

//         const apiUrl = ENTITY_CONFIG[itemType].apiPath(eventId, itemId);
//         const body = JSON.stringify(ENTITY_CONFIG[itemType].payload(itemId, eventId, quantity));

//         const response = await apiFetch(apiUrl, "POST", body);
//         if (response?.success && response?.data) return response.data;

//         throw new Error(response?.message || "Failed to create payment session.");
//     } catch (error) {
//         console.error("Error:", error);
//         alert(`Error: ${error.message}`);
//         return null;
//     }
// }


// const CONFIRM_PURCHASE_CONFIG = {
//     merch: {
//         apiPath: (eventId, itemId) => `/merch/event/${eventId}/${itemId}/confirm-purchase`,
//         payload: (paymentSession) => ({
//             merchId: paymentSession.merchId,
//             eventId: paymentSession.eventId,
//             stock: paymentSession.stock
//         })
//     },
//     menu: {
//         apiPath: (eventId, itemId) => `/places/menu/${eventId}/${itemId}/confirm-purchase`,
//         payload: (paymentSession) => ({
//             menuId: paymentSession.menuId,
//             eventId: paymentSession.placeId,
//             stock: paymentSession.stock
//         })
//     }
//     // Add more entity types here if needed
// };

// // Submit the payment for any entity type
// async function submitPayment(entityType, itemType, paymentSession, paymentMessage, eventId, itemId) {
//     document.getElementById("confirm-payment-btn").disabled = true;

//     if (!CONFIRM_PURCHASE_CONFIG[itemType]) {
//         alert(`Unsupported entity type: ${itemType}`);
//         return;
//     }

//     const cardNumber = document.getElementById("card-number").value.trim();
//     const expiryDate = document.getElementById("expiry-date").value.trim();
//     const cvv = document.getElementById("cvv").value.trim();

//     if (!cardNumber || !expiryDate || !cvv) {
//         paymentMessage.textContent = "Please fill in all fields.";
//         return;
//     }

//     paymentMessage.textContent = "Processing payment...";

//     setTimeout(async () => {
//         try {
//             const apiUrl = CONFIRM_PURCHASE_CONFIG[itemType].apiPath(eventId, itemId);
//             const payload = JSON.stringify(CONFIRM_PURCHASE_CONFIG[itemType].payload(paymentSession));

//             const response = await apiFetch(apiUrl, "POST", payload);
//             let success = response?.message.includes("Payment successfully processed");
//             if (success) {
//                 logActivity("ticket_purchased", { itemId, eventId });
//             }
//             if (response?.message.includes("Payment successfully processed")) {
//                 alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} purchased successfully!`);
//                 // window.location.href = `/event/${eventId}`;
//                 window.location.href = `/${entityType}/${eventId}`;
//                 // window.location.href = window.location.pathname;
//             } else {
//                 throw new Error("Unexpected response from backend.");
//             }
//         } catch (error) {
//             console.error("Error during payment:", error);
//             alert("Payment failed! Please try again.");
//             paymentMessage.textContent = "Payment failed. Please try again.";
//         }
//     }, 2000);
// }


// export { handlePurchase };
