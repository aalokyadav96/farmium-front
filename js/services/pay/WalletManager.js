import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { apipFetch } from "../../api/api.js";
import { v4 as uuidv4 } from "https://jspm.dev/uuid";

export function WalletManager() {
    const balanceEl = createElement("div", { id: "wallet-balance", class: "balance-display" }, []);

    const amountInput = createElement("input", {
        type: "number",
        id: "topup-amount",
        placeholder: "Enter amount",
        min: "1",
        step: "0.01"
    });

    const methodSelect = createElement("select", { id: "topup-method" }, [
        createElement("option", { value: "wallet" }, ["Wallet"]),
        createElement("option", { value: "card" }, ["Card"]),
        createElement("option", { value: "upi" }, ["UPI"]),
        createElement("option", { value: "cod" }, ["Cash on Delivery"])
    ]);

    const topupBtn = Button("Top Up", "topup-btn", {
        click: async () => {
            const amount = parseFloat(amountInput.value);
            const method = methodSelect.value;

            if (!amount || amount <= 0) {
                alert("Enter a valid amount");
                return;
            }

            topupBtn.disabled = true;
            try {
                const idempotencyKey = uuidv4();
                const res = await apipFetch("/wallet/topup", "POST", { amount, method }, {
                    headers: { "Idempotency-Key": idempotencyKey }
                });
                if (res?.success) {
                    alert(res.message || "Top-up successful");
                    await loadBalance();
                    amountInput.value = "";
                } else {
                    alert(res?.message || "Top-up failed");
                }
            } catch (err) {
                console.error(err);
                alert("Top-up failed due to server error.");
            } finally {
                topupBtn.disabled = false;
            }
        }
    });

    async function loadBalance() {
        try {
            const res = await apipFetch("/wallet/balance");
            if (res && res.balance !== undefined) {
                balanceEl.textContent = "Wallet Balance: ₹" + res.balance.toFixed(2);
            } else {
                balanceEl.textContent = "Error fetching balance";
            }
        } catch (err) {
            console.error(err);
            balanceEl.textContent = "Error fetching balance";
        }
    }

    loadBalance();

    return {
        element: createElement("div", { id: "wallet-manager", class: "wallet-card" }, [
            createElement("h3", { class: "wallet-section-title" }, ["Balance"]),
            balanceEl,
            createElement("div", { class: "wallet-form" }, [
                amountInput,
                methodSelect,
                topupBtn
            ])
        ]),
        loadBalance
    };
}
