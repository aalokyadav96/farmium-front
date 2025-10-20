import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { apiFetch } from "../../api/api.js";
import Modal from "../../components/ui/Modal.mjs";
import { v4 as uuidv4 } from "https://jspm.dev/uuid";

export async function showPaymentModal({ entityType, entityId, entityName }) {
    // Fetch wallet balance
    let walletBalance = 0;
    try {
        const res = await apiFetch("/wallet/balance", "GET");
        walletBalance = res.balance || 0;
    } catch (err) {
        console.error("Failed to fetch wallet balance", err);
        return { success: false };
    }

    if (entityType === "user") {
        return { success: false };
    }

    // Error message box (inline)
    const errorBox = createElement("div", { class: "error-box", style: "display:none;color:red;font-size:0.9em;" }, []);

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = "block";
    }
    function clearError() {
        errorBox.textContent = "";
        errorBox.style.display = "none";
    }

    // Amount input
    const amountInput = createElement("input", {
        type: "number",
        min: "0.01",
        step: "0.01",
        value: "0.01",
        placeholder: "Enter amount",
        class: "payment-amount-input"
    });

    // Currency select
    const currencySelect = createElement("select", { class: "currency-select" }, [
        createElement("option", { value: "CCoin", selected: true }, ["CCoin"]),
        createElement("option", { value: "USD" }, ["USD"]),
        createElement("option", { value: "EUR" }, ["EUR"]),
        createElement("option", { value: "INR" }, ["INR"])
    ]);

    // Payment methods
    const paymentMethods = createElement("div", { class: "payment-methods" }, [
        createElement("div", { class: "balance-display" }, [`Wallet Balance: ${walletBalance.toFixed(2)} CCoin`]),
        createElement("label", {}, [
            createElement("input", { type: "radio", name: "payment-method", value: "wallet", checked: true }),
            " CPay Wallet"
        ]),
        createElement("label", {}, [
            createElement("input", { type: "radio", name: "payment-method", value: "card" }),
            " Debit/Credit Card"
        ]),
        createElement("label", {}, [
            createElement("input", { type: "radio", name: "payment-method", value: "upi" }),
            " UPI"
        ]),
        createElement("label", {}, [
            createElement("input", { type: "radio", name: "payment-method", value: "cod" }),
            " Cash on Delivery"
        ]),
        createElement("div", { class: "amount-wrapper" }, [
            createElement("label", {}, ["Amount: ", amountInput, currencySelect]),
            errorBox
        ])
    ]);

    let modal, confirmBtn;

    // Button helpers
    function setProcessing(state) {
        if (state) {
            confirmBtn.setAttribute("disabled", "true");
            confirmBtn.innerHTML = `<span class="spinner"></span> Processing...`;
        } else {
            confirmBtn.removeAttribute("disabled");
            confirmBtn.textContent = "Confirm Payment";
        }
    }

    const actions = () => {
        confirmBtn = Button("Confirm Payment", "confirm-payment-btn", {
            click: async () => {
                clearError();

                const selectedMethod = document.querySelector("input[name='payment-method']:checked")?.value;
                const amount = parseFloat(amountInput.value);
                const currency = currencySelect.value;

                if (!selectedMethod) {
                    showError("Please select a payment method.");
                    return;
                }
                if (!amount || amount <= 0) {
                    showError("Please enter a valid amount.");
                    return;
                }
                if (selectedMethod === "wallet" && currency !== "CCoin") {
                    showError("Wallet payments are only supported in CCoin.");
                    return;
                }
                if (selectedMethod === "wallet" && amount > walletBalance) {
                    showError("Insufficient wallet balance.");
                    return;
                }

                setProcessing(true);

                try {
                    const idempotencyKey = uuidv4();
                    const res = await apiFetch("/wallet/pay", "POST", {
                        entityType,
                        entityId,
                        method: selectedMethod,
                        amount,
                        currency
                    }, { headers: { "Idempotency-Key": idempotencyKey } });

                    if (res.success) {
                        modal.close({ success: true, method: selectedMethod, amount, currency });
                    } else if (res.status === "pending") {
                        showError("Payment is pending. Please check later.");
                        setProcessing(false);
                    } else if (res.status === "failed") {
                        showError(res.message || "Payment failed.");
                        setProcessing(false);
                    } else {
                        showError(res.message || "Payment could not be processed.");
                        setProcessing(false);
                    }
                } catch (err) {
                    console.error("Payment error", err);
                    showError("Payment failed due to server error.");
                    setProcessing(false);
                }
            }
        }, "buttonx");

        const cancelBtn = Button("Cancel", "cancel-payment-btn", {
            click: () => modal.close({ success: false })
        }, "buttonx");

        return createElement("div", { class: "modal-actions" }, [confirmBtn, cancelBtn]);
    };

    modal = Modal({
        title: `Pay for ${entityName}`,
        content: paymentMethods,
        actions,
        size: "medium",
        returnDataOnClose: true
    });

    // Autofocus on amount
    setTimeout(() => amountInput.focus(), 100);

    return await modal.closed;
}
