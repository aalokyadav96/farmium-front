import { apipFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { v4 as uuidv4 } from "https://jspm.dev/uuid";

export function WalletTransactions({ onBalanceChange }) {
    const container = createElement("div", { id: "wallet-transactions", class: "wallet-card" }, [
        createElement("h3", { class: "wallet-section-title" }, ["Transactions"])
    ]);
    let skip = 0;
    const limit = 10;

    function renderStatusBadge(state) {
        const classes = {
            initiated: "badge-pending",
            success: "badge-success",
            failed: "badge-failed",
            reversed: "badge-reversed"
        };
        return createElement("span", { class: `txn-badge ${classes[state] || ""}` }, [state.toUpperCase()]);
    }

    async function loadTransactions() {
        container.querySelectorAll(".txn-item, .load-more, .txn-error").forEach(el => el.remove());
        try {
            const res = await apipFetch(`/wallet/transactions?skip=${skip}&limit=${limit}`);
            if (!res || !res.transactions) {
                container.appendChild(createElement("div", { class: "txn-error" }, ["Error loading transactions"]));
                return;
            }

            res.transactions.forEach(txn => {
                // Determine type label and color
                const typeLabel = txn.type === "topup" ? "Top-up" : txn.type === "payment" ? "Payment" : txn.type.toUpperCase();
                const typeClass = txn.type === "topup" ? "txn-topup" : txn.type === "payment" ? "txn-payment" : `txn-${txn.type}`;

                const txnEl = createElement("div", { class: `txn-item ${typeClass}` }, [
                    createElement("div", { class: "txn-info" }, [
                        `${typeLabel} ${txn.amount.toLocaleString()} ${txn.currency} via ${txn.method}`
                    ]),
                    createElement("div", { class: "txn-meta" }, [
                        renderStatusBadge(txn.state),
                        ` ${new Date(txn.created_at).toLocaleString()}`
                    ])
                ]);

                // Display sender/recipient info
                const accounts = [];
                if (txn.from_account) accounts.push(`From: ${txn.from_account}`);
                if (txn.to_account) accounts.push(`To: ${txn.to_account}`);
                if (accounts.length) {
                    txnEl.appendChild(createElement("div", { class: "txn-accounts" }, [accounts.join(" | ")]));
                }

                // Show meta info if available
                if (txn.meta) {
                    const metaInfo = [];
                    if (txn.meta.note) metaInfo.push(txn.meta.note);
                    if (txn.meta.entity_type && txn.meta.entity_id) metaInfo.push(`${txn.meta.entity_type} (${txn.meta.entity_id})`);
                    if (metaInfo.length > 0) {
                        const metaEl = createElement("div", { class: "txn-extra" }, [metaInfo.join(" | ")]);
                        txnEl.appendChild(metaEl);
                    }
                }

                // Refund button only for successful payments from user
                if (txn.type === "payment" && txn.state === "success" && txn.from_account === txn.userid) {
                    const refundBtn = Button("Refund", "", {
                        click: async () => {
                            if (!confirm("Refund this transaction?")) return;
                            refundBtn.disabled = true;
                            try {
                                const idempotencyKey = uuidv4();
                                const refundRes = await apipFetch("/wallet/refund", "POST", {
                                    transaction_id: txn.id
                                }, { headers: { "Idempotency-Key": idempotencyKey } });

                                if (refundRes.success) {
                                    alert("Refund successful");
                                    if (onBalanceChange) onBalanceChange();
                                    skip = 0;
                                    await loadTransactions();
                                } else {
                                    alert(refundRes.message || "Refund failed");
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Refund failed due to server error.");
                            } finally {
                                refundBtn.disabled = false;
                            }
                        }
                    });
                    txnEl.querySelector(".txn-meta").appendChild(refundBtn);
                }

                container.appendChild(txnEl);
            });

            if (res.transactions.length === limit) {
                const moreBtn = Button("Load More", "load-more", {
                    click: async () => {
                        moreBtn.disabled = true;
                        skip += limit;
                        await loadTransactions();
                        moreBtn.disabled = false;
                    }
                });
                container.appendChild(moreBtn);
            }
        } catch (err) {
            console.error(err);
            container.appendChild(createElement("div", { class: "txn-error" }, ["Error loading transactions"]));
        }
    }

    loadTransactions();

    return container;
}

// import { apipFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { Button } from "../../components/base/Button.js";
// import { v4 as uuidv4 } from "https://jspm.dev/uuid";

// export function WalletTransactions({ onBalanceChange }) {
//     const container = createElement("div", { id: "wallet-transactions", class: "wallet-card" }, [
//         createElement("h3", { class: "wallet-section-title" }, ["Transactions"])
//     ]);
//     let skip = 0;
//     const limit = 10;

//     function renderStatusBadge(state) {
//         const classes = {
//             initiated: "badge-pending",
//             success: "badge-success",
//             failed: "badge-failed",
//             reversed: "badge-reversed"
//         };
//         return createElement("span", { class: `txn-badge ${classes[state] || ""}` }, [state.toUpperCase()]);
//     }

//     async function loadTransactions() {
//         container.querySelectorAll(".txn-item, .load-more, .txn-error").forEach(el => el.remove());
//         try {
//             const res = await apipFetch(`/wallet/transactions?skip=${skip}&limit=${limit}`);
//             if (!res || !res.transactions) {
//                 container.appendChild(createElement("div", { class: "txn-error" }, ["Error loading transactions"]));
//                 return;
//             }

//             res.transactions.forEach(txn => {
//                 const txnEl = createElement("div", { class: `txn-item txn-${txn.type}` }, [
//                     createElement("div", { class: "txn-info" }, [
//                         `${txn.type.toUpperCase()} ${txn.amount.toLocaleString()} ${txn.currency} via ${txn.method}`
//                     ]),
//                     createElement("div", { class: "txn-meta" }, [
//                         renderStatusBadge(txn.state),
//                         ` ${new Date(txn.created_at).toLocaleString()}`
//                     ])
//                 ]);

//                 // Show meta info if available
//                 if (txn.meta) {
//                     const metaInfo = [];
//                     if (txn.meta.note) metaInfo.push(txn.meta.note);
//                     if (txn.meta.entity_type && txn.meta.entity_id) metaInfo.push(`${txn.meta.entity_type} (${txn.meta.entity_id})`);
//                     if (metaInfo.length > 0) {
//                         const metaEl = createElement("div", { class: "txn-extra" }, [metaInfo.join(" | ")]);
//                         txnEl.appendChild(metaEl);
//                     }
//                 }

//                 // Refund button only for successful payments from user
//                 if (txn.type === "payment" && txn.state === "success" && txn.from_account === txn.userid) {
//                     const refundBtn = Button("Refund", "", {
//                         click: async () => {
//                             if (!confirm("Refund this transaction?")) return;
//                             refundBtn.disabled = true;
//                             try {
//                                 const idempotencyKey = uuidv4();
//                                 const refundRes = await apipFetch("/wallet/refund", "POST", {
//                                     transaction_id: txn.id
//                                 }, { headers: { "Idempotency-Key": idempotencyKey } });

//                                 if (refundRes.success) {
//                                     alert("Refund successful");
//                                     if (onBalanceChange) onBalanceChange();
//                                     skip = 0;
//                                     await loadTransactions();
//                                 } else {
//                                     alert(refundRes.message || "Refund failed");
//                                 }
//                             } catch (err) {
//                                 console.error(err);
//                                 alert("Refund failed due to server error.");
//                             } finally {
//                                 refundBtn.disabled = false;
//                             }
//                         }
//                     });
//                     txnEl.querySelector(".txn-meta").appendChild(refundBtn);
//                 }

//                 container.appendChild(txnEl);
//             });

//             if (res.transactions.length === limit) {
//                 const moreBtn = Button("Load More", "load-more", {
//                     click: async () => {
//                         moreBtn.disabled = true;
//                         skip += limit;
//                         await loadTransactions();
//                         moreBtn.disabled = false;
//                     }
//                 });
//                 container.appendChild(moreBtn);
//             }
//         } catch (err) {
//             console.error(err);
//             container.appendChild(createElement("div", { class: "txn-error" }, ["Error loading transactions"]));
//         }
//     }

//     loadTransactions();

//     return container;
// }
