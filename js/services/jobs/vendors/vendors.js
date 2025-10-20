import { createElement } from "../../../components/createElement.js";
import Notify from "../../../components/ui/Notify.mjs";
import { loadVendors } from "./loadVendors.js";
import { vendorForm } from "./vendorForm.js";

export async function hireVendors(anacon, isLoggedIn, eventId) {
    if (!isLoggedIn) {
        Notify("Please log in first.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    // Clear old content
    anacon.innerHTML = "";

    // Wrapper
    const container = createElement("div", { id: "vendors-wrapper" }, [
        createElement("h3", {}, ["Vendors Marketplace"])
    ]);

    // Load vendors
    const vendorListEl = await loadVendors(eventId);
    container.appendChild(vendorListEl);

    // Add vendor registration form
    container.appendChild(vendorForm(anacon, isLoggedIn, eventId));

    anacon.appendChild(container);
}


// import { createElement } from "../../../components/createElement.js";
// import { apiFetch } from "../../../api/api.js";
// import Notify from "../../../components/ui/Notify.mjs";
// import Button from "../../../components/base/Button.js";

// export async function hireVendors(anacon, isLoggedIn, eventId) {
//     if (!isLoggedIn) {
//         Notify("Please log in to hire vendors.", { type: "warning", duration: 3000, dismissible: true });
//         return;
//     }

//     // Fetch vendors list from backend
//     let vendors = [];
//     try {
//         vendors = await apiFetch(`/vendors`, "GET");
//     } catch (err) {
//         Notify("Failed to load vendors.", { type: "error" });
//         return;
//     }

//     const container = createElement("div", { id: "vendors-section" }, [
//         createElement("h4", {}, ["Available Vendors"])
//     ]);

//     if (vendors.length === 0) {
//         container.appendChild(createElement("p", {}, ["No vendors available right now."]));
//     } else {
//         vendors.forEach(vendor => {
//             const vendorBox = createElement("div", { class: "vendor-box" }, [
//                 createElement("span", {}, [`${vendor.name} - ${vendor.category}`]),
//                 Button("Hire", `hire-${vendor._id}`, {
//                     click: async () => {
//                         try {
//                             await apiFetch(`/events/${eventId}/hire`, "POST", { vendorId: vendor._id });
//                             Notify(`You hired ${vendor.name}.`, { type: "success" });
//                         } catch (err) {
//                             Notify("Failed to hire vendor.", { type: "error" });
//                         }
//                     }
//                 })
//             ]);
//             container.appendChild(vendorBox);
//         });
//     }

//     anacon.innerHTML = ""; // clear old content
//     anacon.appendChild(container);
// }
