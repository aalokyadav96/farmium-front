import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { formatRelativeTime } from "../../utils/dateUtils.js";

export async function baitoApplicantDash(content) {
    // Clear container
    content.innerHTML = "";
    let container = createElement('div', { "class": "baitospage" }, []);
  
    content.innerHTML = "";
    content.appendChild(container);
    container.innerHTML = "";
    container.appendChild(createElement("h2", {}, ["📥 Your Baito Applications"]));

    let applications;
    try {
        applications = await apiFetch("/baitos/applications");
    } catch (err) {
        container.appendChild(createElement("p", { class: "error" }, ["❌ Failed to load applications."]));
        return;
    }

    if (!applications.length) {
        container.appendChild(createElement("p", { class: "empty-state" }, ["You haven’t applied for any baito jobs yet."]));
        return;
    }

    const list = createElement("div", { class: "application-list" });

    applications.forEach(app => {
        const card = createElement("div", { class: "application-card" });

        const title = createElement("h4", {}, [app.title || "Untitled Job"]);
        const meta = createElement("p", { class: "meta" }, [`📍 ${app.location} • 💴 ¥${app.wage}/hr`]);
        const pitch = createElement("p", {}, [`📝 Pitch: ${app.pitch || "—"}`]);
        const date = createElement("p", {}, [`📅 ${formatRelativeTime(app.submittedAt)}`]);

        card.append(title, meta, pitch, date);
        list.appendChild(card);
    });

    container.appendChild(list);
}

// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";

// export async function baitoApplicantDash(container) {
//     const applications = await apiFetch("/baitos/applications");

//     container.appendChild(createElement("h3", {}, ["📥 Your Applications"]));

//     if (!applications.length) {
//         container.appendChild(createElement("p", {}, ["You haven't applied for any baito jobs yet."]));
//         return;
//     }

//     const list = createElement("div", { class: "application-list" });

//     applications.forEach(app => {
//         const card = createElement("div", { class: "application-card" });
//         card.appendChild(createElement("h4", {}, [app.title || "Untitled"]));
//         card.appendChild(createElement("p", {}, [`📍 ${app.location} • 💴 ¥${app.wage}/hr`]));
//         card.appendChild(createElement("p", {}, [`📩 Pitch: ${app.pitch || "—"}`]));
//         card.appendChild(createElement("p", {}, [`📅 Applied on ${new Date(app.submittedAt).toLocaleDateString()}`]));
//         list.appendChild(card);
//     });

//     container.appendChild(list);
// }
