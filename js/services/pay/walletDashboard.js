import { WalletManager } from "./walletManager.js";
import { WalletTransactions } from "./walletTransactions.js";
import { WalletTransfer } from "./walletTransfer.js";
import { createElement } from "../../components/createElement.js";

export function WalletDashboard() {
    const container = createElement("div", { id: "wallet-dashboard", class: "wallet-dashboard" }, []);

    // --- Left column: Balance + Transfer ---
    const leftCol = createElement("div", { class: "wallet-left-col" }, []);

    // Wallet Balance
    const walletManagerWrapper = createElement("div", { class: "wallet-section wallet-balance" }, [
        createElement("h2", { class: "wallet-section-title" }, ["Balance"]),
    ]);
    const walletManagerInstance = WalletManager();
    walletManagerWrapper.appendChild(walletManagerInstance.element);
    leftCol.appendChild(walletManagerWrapper);

    const refreshBalance = async () => walletManagerInstance.loadBalance();

    // Wallet Transfer
    const transferWrapper = createElement("div", { class: "wallet-section wallet-transfer" }, [
        createElement("h2", { class: "wallet-section-title" }, ["Transfer"]),
    ]);
    const transferContainer = WalletTransfer({ onBalanceChange: refreshBalance });
    transferWrapper.appendChild(transferContainer);
    leftCol.appendChild(transferWrapper);

    container.appendChild(leftCol);

    // --- Right column: Transactions ---
    const rightCol = createElement("div", { class: "wallet-right-col" }, []);
    const txnWrapper = createElement("div", { class: "wallet-section wallet-transactions" }, [
        createElement("h2", { class: "wallet-section-title" }, ["Transactions"]),
    ]);
    const txnContainer = WalletTransactions({ onBalanceChange: refreshBalance });
    txnWrapper.appendChild(txnContainer);
    rightCol.appendChild(txnWrapper);

    container.appendChild(rightCol);

    return container;
}

// import { WalletManager } from "./walletManager.js";
// import { WalletTransactions } from "./walletTransactions.js";
// import { WalletTransfer } from "./walletTransfer.js";
// import { createElement } from "../../components/createElement.js";

// export function WalletDashboard() {
//     const container = createElement("div", { id: "wallet-dashboard", class: "wallet-dashboard" }, []);

//     // --- Wallet Balance / Manager ---
//     const walletManagerWrapper = createElement("div", { class: "wallet-section wallet-balance" }, [
//         createElement("h2", { class: "wallet-section-title" }, ["Balance"]),
//     ]);
//     const walletManagerInstance = WalletManager();
//     walletManagerWrapper.appendChild(walletManagerInstance.element);
//     container.appendChild(walletManagerWrapper);

//     const refreshBalance = async () => walletManagerInstance.loadBalance();

//     // --- Wallet Transfer ---
//     const transferWrapper = createElement("div", { class: "wallet-section wallet-transfer" }, [
//         createElement("h2", { class: "wallet-section-title" }, ["Transfer"]),
//     ]);
//     const transferContainer = WalletTransfer({ onBalanceChange: refreshBalance });
//     transferWrapper.appendChild(transferContainer);
//     container.appendChild(transferWrapper);

//     // --- Wallet Transactions ---
//     const txnWrapper = createElement("div", { class: "wallet-section wallet-transactions" }, [
//         createElement("h2", { class: "wallet-section-title" }, ["Transactions"]),
//     ]);
//     const txnContainer = WalletTransactions({ onBalanceChange: refreshBalance });
//     txnWrapper.appendChild(txnContainer);
//     container.appendChild(txnWrapper);

//     return container;
// }

// // import { WalletManager } from "./walletManager.js";
// // import { WalletTransactions } from "./walletTransactions.js";
// // import { WalletTransfer } from "./walletTransfer.js";
// // import { createElement } from "../../components/createElement.js";

// // export function WalletDashboard() {
// //     const container = createElement("div", { id: "wallet-dashboard" }, []);

// //     const walletManagerInstance = WalletManager();
// //     container.appendChild(walletManagerInstance.element);

// //     const refreshBalance = async () => walletManagerInstance.loadBalance();

// //     const transferContainer = WalletTransfer({ onBalanceChange: refreshBalance });
// //     container.appendChild(transferContainer);

// //     const txnContainer = WalletTransactions({ onBalanceChange: refreshBalance });
// //     container.appendChild(txnContainer);

// //     return container;
// // }
