import { apipFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { v4 as uuidv4 } from "https://jspm.dev/uuid";

export function WalletTransfer({ onBalanceChange }) {
    const recipientInput = createElement("input", {
        type: "text",
        id: "transfer-recipient",
        placeholder: "Recipient User ID"
    });

    const amountInput = createElement("input", {
        type: "number",
        id: "transfer-amount",
        placeholder: "Enter amount",
        min: "1",
        step: "0.01"
    });

    const transferBtn = Button("Send", "transfer-btn", {
        click: async () => {
            const recipient = recipientInput.value.trim();
            const amount = parseFloat(amountInput.value);

            if (!recipient || !amount || amount <= 0) {
                alert("Enter valid recipient and amount");
                return;
            }

            transferBtn.disabled = true;
            try {
                const idempotencyKey = uuidv4();
                const res = await apipFetch("/wallet/transfer", "POST", {
                    recipient,
                    amount
                }, { headers: { "Idempotency-Key": idempotencyKey } });

                if (res.success) {
                    alert("Transfer successful");
                    recipientInput.value = "";
                    amountInput.value = "";
                    if (onBalanceChange) onBalanceChange();
                } else {
                    alert(res.message || "Transfer failed");
                }
            } catch (err) {
                console.error(err);
                alert("Transfer failed due to server error.");
            } finally {
                transferBtn.disabled = false;
            }
        }
    });

    return createElement("div", { id: "wallet-transfer", class: "wallet-card" }, [
        createElement("h3", { class: "wallet-section-title" }, ["Send Money"]),
        createElement("div", { class: "wallet-form" }, [
            recipientInput,
            amountInput,
            transferBtn
        ])
    ]);
}
