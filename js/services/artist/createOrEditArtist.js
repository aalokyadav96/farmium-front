import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// ------------------- CREATE ARTIST EXPORT -------------------
export function createArtist(isLoggedIn, content) {
    createOrEditArtist({ isLoggedIn, content, mode: "create" });
}

// ------------------- EDIT ARTIST EXPORT -------------------
export async function editArtist(isLoggedIn, content, artistID, existingArtist, isCreator) {
    createOrEditArtist({ isLoggedIn, content, mode: "edit", artistID, existingArtist, isCreator });
}

// ------------------- CREATE -------------------
async function submitArtistForm(section) {
    const formData = collectFormData(section);
    try {
        const response = await apiFetch("/artists", "POST", formData);
        Notify("Artist created successfully!", { type: "success", duration: 3000 });
        navigate(`/artist/${response.artistid}`);
    } catch (err) {
        Notify(`Failed to create artist: ${err.message}`, { type: "error", duration: 3000 });
    }
}

// ------------------- UPDATE -------------------
async function updateArtistForm(artistID, section) {
    const formData = collectFormData(section);
    try {
        await apiFetch(`/artists/${artistID}`, "PUT", formData);
        Notify("Artist updated successfully", { type: "success", duration: 3000 });
        navigate(`/artist/${artistID}`);
    } catch (err) {
        Notify(`Failed to update artist: ${err.message}`, { type: "error", duration: 3000 });
    }
}

// ------------------- CREATE OR EDIT ARTIST -------------------
export async function createOrEditArtist({ isLoggedIn, content, mode = "create", artistID = null, existingArtist = null, isCreator = false }) {
    if (!isLoggedIn) {
        Notify("Please log in to continue.", { type: "warning", duration: 3000 });
        navigate("/login");
        return;
    }

    if (mode === "edit" && !isCreator) {
        Notify("You are not authorized to edit this artist.", { type: "error", duration: 3000 });
        return;
    }

    content.replaceChildren();

    const section = createElement("div", { class: "create-section" });
    const heading = createElement("h2", {}, [mode === "create" ? "Create Artist" : "Edit Artist"]);
    section.appendChild(heading);

    const formFields = [
        { type: "select", id: "artist-category", label: "Artist Type", required: true,
          options: [
              { value: "", label: "Select a Type" },
              { value: "singer", label: "Singer" },
              { value: "band", label: "Band" },
              { value: "comedian", label: "Comedian" },
              { value: "actor", label: "Actor" },
              { value: "poet", label: "Poet" },
              { value: "musician", label: "Musician" },
              { value: "dancer", label: "Dancer" },
              { value: "magician", label: "Magician" },
              { value: "painter", label: "Painter" },
              { value: "photographer", label: "Photographer" },
              { value: "sculptor", label: "Sculptor" },
              { value: "other", label: "Other" }
          ]
        },
        { type: "text", id: "artist-name", label: "Artist Name", required: true, placeholder: "Enter artist name" },
        { type: "textarea", id: "artist-bio", label: "Artist's Biography", required: true, placeholder: "Write a short bio" },
        { type: "date", id: "artist-dob", label: "Date of Birth" },
        { type: "text", id: "artist-place", label: "Artist Place", required: true, placeholder: "City or place" },
        { type: "text", id: "artist-country", label: "Country", required: true, placeholder: "Country" },
        { type: "text", id: "artist-genres", label: "Genres (comma separated)", placeholder: "e.g., Jazz, Rock" },
    ];

    formFields.forEach(field => {
        let value = existingArtist?.[field.id.replace("artist-", "")] ?? "";
        if (field.id === "artist-genres" && existingArtist?.genres) value = existingArtist.genres.join(", ");
        const inputField = createFormGroup({ ...field, value });
        section.appendChild(inputField);
    });

    // ------------------- SOCIAL LINKS SECTION -------------------
    const socialsContainer = createElement("div", { id: "artist-socials-container" });
    const socialsSection = createElement("div", { class: "socials-section" }, [
        createElement("h3", {}, ["Social Links"]),
        socialsContainer,
        Button("Add Social", "add-social-btn", { click: () => addSocialField(null, socialsContainer) })
    ]);
    section.appendChild(socialsSection);

    if (mode === "edit" && existingArtist?.socials) {
        Object.entries(existingArtist.socials).forEach(([platform, url]) => {
            addSocialField({ platform, url }, socialsContainer);
        });
    }

    const submitBtn = Button(mode === "create" ? "Create Artist" : "Update Artist", "artist-submit-btn", {
        click: async (e) => {
            e.preventDefault();
            if (mode === "create") await submitArtistForm(section);
            else await updateArtistForm(artistID, section);
        }
    });

    section.appendChild(submitBtn);
    content.appendChild(section);
}

// ------------------- SOCIAL FIELD -------------------
function addSocialField(existingSocial = null, container) {
    const row = createElement("div", { class: "social-field-row" });

    const platformField = createFormGroup({
        type: "text",
        id: `social-platform-${Date.now()}`,
        label: "Platform",
        required: true,
        value: existingSocial?.platform || "",
        placeholder: "e.g. Instagram"
    });

    const urlField = createFormGroup({
        type: "url",
        id: `social-url-${Date.now()}`,
        label: "URL",
        required: true,
        value: existingSocial?.url || "",
        placeholder: "https://..."
    });

    const removeBtn = Button("Remove", "", { click: () => container.removeChild(row) }, "remove-social-btn");
    [platformField, urlField, removeBtn].forEach(el => row.appendChild(el));
    container.appendChild(row);
}

// ------------------- FORM DATA COLLECTOR -------------------
function collectFormData(section) {
    const formData = new FormData();

    ["artist-category", "artist-name", "artist-bio", "artist-dob", "artist-place", "artist-country", "artist-genres"].forEach(id => {
        const el = section.querySelector(`#${id}`);
        if (el) formData.append(id.replace("artist-", ""), el.value ?? "");
    });

    // ---- Collect socials as JSON ----
    const socials = {};
    section.querySelectorAll(".social-field-row").forEach(row => {
        const platform = row.querySelector("input[type=text]")?.value.trim().toLowerCase();
        const url = row.querySelector("input[type=url]")?.value.trim();
        if (platform && url) socials[platform] = url;
    });
    if (Object.keys(socials).length > 0) {
        formData.append("socials", JSON.stringify(socials));
    }

    return formData;
}

// ------------------- MANAGE BAND MEMBERS (new separate module) -------------------
export async function manageBandMembers(artistID, container) {
    container.replaceChildren();

    const heading = createElement("h2", {}, ["Manage Band Members"]);
    const membersContainer = createElement("div", { id: "band-members-container" });
    const addBtn = Button("Add Member", "add-member-btn", { click: () => addBandMember(null, membersContainer) }, "buttonx");
    const saveBtn = Button("Save Members", "save-members-btn", {
        click: async () => {
            const members = [];
            membersContainer.querySelectorAll(".band-member").forEach(div => {
                const artistid = div.querySelector("input[id^='member-id-']")?.value.trim();
                const name = div.querySelector("input[id^='member-name-']")?.value.trim();
                const role = div.querySelector("input[id^='member-role-']")?.value.trim();
                const dob = div.querySelector("input[id^='member-dob-']")?.value;

                if (artistid || name) {
                    const m = { role, dob };
                    if (artistid) m.artistid = artistid;
                    else m.name = name;
                    members.push(m);
                }
            });

            try {
                await apiFetch(`/artists/${artistID}/members`, "PUT", { members });
                Notify("Members updated successfully.", { type: "success", duration: 3000 });
                navigate(`/artist/${artistID}`);
            } catch (err) {
                Notify(`Failed to update members: ${err.message}`, { type: "error", duration: 3000 });
            }
        }
    }, "buttonx");

    container.appendChild(heading);
    container.appendChild(membersContainer);
    container.appendChild(addBtn);
    container.appendChild(saveBtn);

    // Fetch and populate existing members
    try {
        const artist = await apiFetch(`/artists/${artistID}`, "GET");
        if (artist?.members) artist.members.forEach(m => addBandMember(m, membersContainer));
    } catch (err) {
        Notify("Failed to load members.", { type: "error", duration: 3000 });
    }
}

// ------------------- BAND MEMBER HANDLER -------------------
function addBandMember(existingMember = null, container) {
    if (!container) return;
    const memberDiv = createElement("div", { class: "band-member" });

    const idField = createFormGroup({
        type: "text",
        id: `member-id-${Date.now()}`,
        label: "Artist ID (optional)",
        placeholder: "Paste artist ID to fetch data",
        value: existingMember?.artistid || ""
    });

    const nameField = createFormGroup({
        type: "text",
        id: `member-name-${Date.now()}`,
        label: "Member Name",
        required: true,
        value: existingMember?.name || "",
        placeholder: "Member name"
    });

    const roleField = createFormGroup({
        type: "text",
        id: `member-role-${Date.now()}`,
        label: "Role (optional)",
        value: existingMember?.role || "",
        placeholder: "Role or instrument"
    });

    const dobField = createFormGroup({
        type: "date",
        id: `member-dob-${Date.now()}`,
        label: "DOB (optional)",
        value: existingMember?.dob || ""
    });

    const fetchBtn = Button("Fetch Member", "", {
        click: async () => {
            const artistID = idField.querySelector("input")?.value.trim();
            if (!artistID) {
                Notify("Please enter a valid artist ID first.", { type: "warning", duration: 2000 });
                return;
            }

            // --- DUPLICATE CHECK ---
            const existingIDs = Array.from(container.querySelectorAll(".band-member input[id^='member-id-']"))
                .map(el => el.value.trim())
                .filter(Boolean);
            const duplicate = existingIDs.filter(id => id === artistID).length > 1;
            if (duplicate) {
                Notify("This artist is already added as a member.", { type: "warning", duration: 3000 });
                return;
            }

            try {
                const artist = await apiFetch(`/artists/${artistID}`, "GET");
                if (!artist || !artist.name) {
                    Notify("Artist not found.", { type: "error", duration: 2000 });
                    return;
                }

                nameField.querySelector("input").value = artist.name || "";
                roleField.querySelector("input").value = artist.role || "";
                dobField.querySelector("input").value = artist.dob || "";

                Notify("Member data fetched.", { type: "success", duration: 1500 });
            } catch (err) {
                Notify(`Failed to fetch artist: ${err.message}`, { type: "error", duration: 3000 });
            }
        }
    });

    const removeBtn = Button("Remove", "", { click: () => container.removeChild(memberDiv) }, "remove-member-btn buttonx");
    const idRow = createElement("div", { class: "member-id-row" }, [idField, fetchBtn]);
    [idRow, nameField, roleField, dobField, removeBtn].forEach(el => memberDiv.appendChild(el));
    container.appendChild(memberDiv);
}

// ------------------- DELETE ARTIST -------------------
export async function deleteArtistForm(isLoggedIn, artistID, isCreator) {
    if (!isLoggedIn) {
        Notify("You must be logged in to delete an artist.", { type: "warning", duration: 3000 });
        navigate("/login");
        return;
    }

    if (!isCreator) {
        Notify("You are not authorized to delete this artist.", { type: "error", duration: 3000 });
        return;
    }

    const confirmed = confirm("Are you sure you want to delete this artist? This action cannot be undone.");
    if (!confirmed) return;

    try {
        await apiFetch(`/artists/${artistID}`, "DELETE");
        Notify("Artist deleted successfully.", { type: "success", duration: 3000 });
        navigate("/artists");
    } catch (err) {
        Notify(`Failed to delete artist: ${err.message}`, { type: "error", duration: 4000 });
    }
}
