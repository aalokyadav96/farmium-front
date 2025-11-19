// createOrEditMembers.js

import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";

// ENTRY
export async function manageBandMembers(artistID, container) {
    container.replaceChildren();

    const heading = createElement("h2", {}, ["Manage Band Members"]);
    const membersContainer = createElement("div", { id: "band-members-container" });

    const addBtn = Button(
        "Add Member",
        "add-member-btn",
        { click: () => addBandMember(null, membersContainer) },
        "buttonx",
        {}
    );

    const saveBtn = Button(
        "Save Members",
        "save-members-btn",
        { click: () => saveBandMembers(artistID, membersContainer) },
        "buttonx",
        {}
    );

    container.append(heading, membersContainer, addBtn, saveBtn);

    try {
        const artist = await apiFetch(`/artists/${artistID}`, "GET");
        (artist?.members || []).forEach(m => addBandMember(m, membersContainer, false));
    } catch {
        Notify("Failed to load members.", { type: "error", duration: 3000 });
    }
}

// SAVE ONLY CHANGES
async function saveBandMembers(artistID, container) {
    const rows = container.querySelectorAll(".band-member");

    for (const row of rows) {
        const status = row.dataset.status;
        const id = row.dataset.id;

        const name = row.querySelector("input[id^='member-name-']")?.value.trim() || "";
        const role = row.querySelector("input[id^='member-role-']")?.value.trim() || "";
        const dob = row.querySelector("input[id^='member-dob-']")?.value || "";

        if (status === "removed") {
            if (!id.startsWith("new-")) {
                await apiFetch(`/artists/${artistID}/members/${id}`, "DELETE");
            }
            continue;
        }

        if (status === "new") {
            await apiFetch(`/artists/${artistID}/members`, "POST", {
                name,
                role,
                dob
            });
            continue;
        }

        if (status === "updated") {
            await apiFetch(`/artists/${artistID}/members/${id}`, "PUT", {
                name,
                role,
                dob
            });
        }
    }

    Notify("Members updated.", { type: "success", duration: 2500 });
    navigate(`/artist/${artistID}`);
}

// ADD MEMBER ROW
function addBandMember(existing, container, markNew = true) {
    if (!container) return;

    const data = existing || {};
    const safeId = data.artistid || `new-${crypto.randomUUID()}`;

    const memberDiv = createElement("div", {
        class: "band-member",
        "data-id": safeId,
        "data-status": existing ? "unchanged" : "new"
    });

    const idField = createFormGroup({
        type: "text",
        id: `member-id-${safeId}`,
        label: "Artist ID (optional)",
        placeholder: "Paste artist ID",
        value: data.artistid || ""
    });

    const nameField = createFormGroup({
        type: "text",
        id: `member-name-${safeId}`,
        label: "Member Name",
        required: true,
        placeholder: "Member name",
        value: data.name || ""
    });

    const roleField = createFormGroup({
        type: "text",
        id: `member-role-${safeId}`,
        label: "Role (optional)",
        placeholder: "Role or instrument",
        value: data.role || ""
    });

    const dobField = createFormGroup({
        type: "date",
        id: `member-dob-${safeId}`,
        label: "DOB (optional)",
        value: data.dob || ""
    });

    const setUpdated = () => {
        if (memberDiv.dataset.status === "unchanged") {
            memberDiv.dataset.status = "updated";
        }
    };

    memberDiv.addEventListener("input", setUpdated);

    const fetchBtn = Button(
        "Fetch Member",
        "",
        { click: () => fetchMemberData(idField, nameField, roleField, dobField, memberDiv) },
        "",
        {}
    );

    const removeBtn = Button(
        "Remove",
        "",
        {
            click: () => {
                memberDiv.dataset.status = "removed";
                memberDiv.style.opacity = "0.4";
            }
        },
        "remove-member-btn buttonx",
        {}
    );

    const idRow = createElement("div", { class: "member-id-row" }, [idField, fetchBtn]);

    memberDiv.append(idRow, nameField, roleField, dobField, removeBtn);
    container.append(memberDiv);
}

// FETCH MEMBER DATA
async function fetchMemberData(idField, nameField, roleField, dobField, row) {
    const val = idField.querySelector("input")?.value.trim();
    if (!val) {
        Notify("Please enter a valid artist ID first.", { type: "warning", duration: 2000 });
        return;
    }

    try {
        const artist = await apiFetch(`/artists/${val}`, "GET");

        if (!artist?.name) {
            Notify("Artist not found.", { type: "error", duration: 2000 });
            return;
        }

        nameField.querySelector("input").value = artist.name || "";
        roleField.querySelector("input").value = artist.role || "";
        dobField.querySelector("input").value = artist.dob || "";

        row.dataset.status = row.dataset.status === "new" ? "new" : "updated";

        Notify("Member data fetched.", { type: "success", duration: 1500 });
    } catch (err) {
        Notify(`Failed to fetch artist: ${err.message}`, { type: "error", duration: 3000 });
    }
}
