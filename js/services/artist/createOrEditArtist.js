import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// ------------------- DELETE ARTIST -------------------
export async function deleteArtistForm(isLoggedIn, artistID, isCreator) {
    alert("noted");
}

// ------------------- CREATE OR EDIT ARTIST -------------------
export async function createOrEditArtist({ isLoggedIn, content, mode = "create", artistID = null, existingArtist = null, isCreator = false }) {
    if (!isLoggedIn) {
        Notify("Please log in to continue.", { type: "warning", duration: 3000, dismissible: true });
        navigate("/login");
        return;
    }

    if (mode === "edit" && !isCreator) {
        Notify("You are not authorized to edit this artist.", { type: "error", duration: 3000, dismissible: true });
        return;
    }

    content.innerHTML = ""; // clear existing form if any

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
        { type: "url", id: "artist-socials", label: "Socials", placeholder: "https://..." },
    ];

    formFields.forEach(field => {
        let value = existingArtist?.[field.id.replace("artist-", "")] ?? "";
        if (field.id === "artist-genres" && existingArtist?.genres) value = existingArtist.genres.join(", ");
        if (field.id === "artist-socials" && existingArtist?.socials?.raw) value = existingArtist.socials.raw;

        const inputField = createFormGroup({ ...field, value });
        section.appendChild(inputField);
    });

    // ------------------- BAND MEMBERS -------------------
    const membersContainer = createElement("div", { id: "band-members-container" });
    const bandSection = createElement("div", { class: "band-members-section" }, [
        createElement("h3", {}, ["Band Members"]),
        membersContainer,
        Button("Add Member", "add-member-btn", { click: () => addBandMember(null, membersContainer) })
    ]);
    section.appendChild(bandSection);

    // Prepopulate existing members
    if (mode === "edit" && existingArtist?.members) {
        existingArtist.members.forEach(member => addBandMember(member, membersContainer));
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

// ------------------- BAND MEMBER HANDLER -------------------
function addBandMember(existingMember = null, container) {
    if (!container) return;

    const photoSrc = existingMember?.image
        ? resolveImagePath(EntityType.ARTIST, PictureType.THUMB, existingMember.image)
        : "";

    const memberDiv = createElement("div", { class: "band-member" });

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

    const imageField = createFormGroup({
        type: "file",
        id: `member-image-${Date.now()}`,
        label: "Member Image",
        accept: "image/*",
        value: photoSrc
    });

    const removeBtn = Button("Remove", "", { click: () => container.removeChild(memberDiv) }, "remove-member-btn");

    [nameField, roleField, dobField, imageField, removeBtn].forEach(el => memberDiv.appendChild(el));
    container.appendChild(memberDiv);
}

// ------------------- FORM DATA COLLECTOR -------------------
function collectFormData(section) {
    if (!section) throw new Error("Form section is required.");

    const formData = new FormData();

    ["artist-category", "artist-name", "artist-bio", "artist-dob", "artist-place", "artist-country", "artist-genres", "artist-socials"].forEach(id => {
        const el = section.querySelector(`#${id}`);
        if (el) formData.append(id.replace("artist-", ""), el.value ?? "");
    });

    section.querySelectorAll(".band-member").forEach((div, index) => {
        const name = div.querySelector("input[type=text]")?.value.trim();
        if (name) {
            const role = div.querySelector("input[type=text]:nth-of-type(2)")?.value.trim();
            const dob = div.querySelector("input[type=date]")?.value;
            const imageFile = div.querySelector("input[type=file]")?.files?.[0];
            formData.append(`members[${index}]`, JSON.stringify({ name, role, dob }));
            if (imageFile) formData.append(`memberImage_${index}`, imageFile);
        }
    });

    return formData;
}

// ------------------- CREATE -------------------
async function submitArtistForm(section) {
    const formData = collectFormData(section);
    try {
        const response = await apiFetch("/artists", "POST", formData);
        Notify("Artist created successfully!", { type: "success", duration: 3000, dismissible: true });
        navigate(`/artist/${response.artistid}`);
    } catch (err) {
        Notify(`Failed to create artist: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
    }
}

// ------------------- UPDATE -------------------
async function updateArtistForm(artistID, section) {
    const formData = collectFormData(section);
    try {
        await apiFetch(`/artists/${artistID}`, "PUT", formData);
        Notify("Artist updated successfully", { type: "success", duration: 3000, dismissible: true });
        navigate(`/artist/${artistID}`);
    } catch (err) {
        Notify(`Failed to update artist: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
    }
}

// ------------------- CREATE ARTIST EXPORT -------------------
export function createArtist(isLoggedIn, content) {
    createOrEditArtist({ isLoggedIn, content, mode: "create" });
}

// ------------------- EDIT ARTIST EXPORT -------------------
export async function editArtist(isLoggedIn, content, artistID, existingArtist, isCreator) {
    createOrEditArtist({ isLoggedIn, content, mode: "edit", artistID, existingArtist, isCreator });
}

// import { navigate } from "../../routes/index.js";
// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createFormGroup } from "../../components/createFormGroup.js";
// import { createElement } from "../../components/createElement.js";
// import Notify from "../../components/ui/Notify.mjs";
// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// // ------------------- DELETE ARTIST -------------------
// export async function deleteArtistForm(isLoggedIn, artistID, isCreator) {
//     alert("noted");
// }

// // ------------------- CREATE OR EDIT ARTIST -------------------
// export async function createOrEditArtist({ isLoggedIn, content, mode = "create", artistID = null, existingArtist = null, isCreator = false }) {
//     if (!isLoggedIn) {
//         Notify("Please log in to continue.", { type: "warning", duration: 3000, dismissible: true });
//         navigate("/login");
//         return;
//     }

//     if (mode === "edit" && !isCreator) {
//         Notify("You are not authorized to edit this artist.", { type: "error", duration: 3000, dismissible: true });
//         return;
//     }

//     content.innerHTML = ""; // clear existing form if any

//     const section = createElement("div", { class: "artist-form-section" });
//     const heading = createElement("h2", {}, [mode === "create" ? "Create Artist" : "Edit Artist"]);
//     section.appendChild(heading);

//     const formFields = [
//         { type: "select", id: "artist-category", label: "Artist Type", required: true,
//           options: [
//               { value: "", label: "Select a Type" },
//               { value: "singer", label: "Singer" },
//               { value: "band", label: "Band" },
//               { value: "comedian", label: "Comedian" },
//               { value: "actor", label: "Actor" },
//               { value: "poet", label: "Poet" },
//               { value: "musician", label: "Musician" },
//               { value: "dancer", label: "Dancer" },
//               { value: "magician", label: "Magician" },
//               { value: "painter", label: "Painter" },
//               { value: "photographer", label: "Photographer" },
//               { value: "sculptor", label: "Sculptor" },
//               { value: "other", label: "Other" }
//           ]
//         },
//         { type: "text", id: "artist-name", label: "Artist Name", required: true },
//         { type: "textarea", id: "artist-bio", label: "Artist's Biography", required: true },
//         { type: "date", id: "artist-dob", label: "Date of Birth" },
//         { type: "text", id: "artist-place", label: "Artist Place", required: true },
//         { type: "text", id: "artist-country", label: "Country", required: true },
//         { type: "text", id: "artist-genres", label: "Genres (comma separated)" },
//         { type: "url", id: "artist-socials", label: "Socials" },
//     ];

//     formFields.forEach(field => {
//         let value = "";
//         if (existingArtist) {
//             switch (field.id) {
//                 case "artist-category": value = existingArtist.category || ""; break;
//                 case "artist-name": value = existingArtist.name || ""; break;
//                 case "artist-bio": value = existingArtist.bio || ""; break;
//                 case "artist-dob": value = existingArtist.dob || ""; break;
//                 case "artist-place": value = existingArtist.place || ""; break;
//                 case "artist-country": value = existingArtist.country || ""; break;
//                 case "artist-genres": value = existingArtist.genres ? existingArtist.genres.join(", ") : ""; break;
//                 case "artist-socials": value = existingArtist.socials?.raw || ""; break;
//             }
//         }
//         const inputField = createFormGroup({ ...field, value });
//         section.appendChild(inputField);
//     });

//     // ------------------- BAND MEMBERS -------------------
//     const membersContainer = createElement("div", { id: "band-members-container" });
//     const bandSection = createElement("div", { class: "band-members-section" }, [
//         createElement("h3", {}, ["Band Members"]),
//         membersContainer,
//         Button("Add Member", "add-member-btn", { click: () => addBandMember(null, membersContainer) })
//     ]);
//     section.appendChild(bandSection);

//     // Prepopulate existing members
//     if (mode === "edit" && existingArtist?.members) {
//         existingArtist.members.forEach(member => addBandMember(member, membersContainer));
//     }

//     const submitBtn = Button(mode === "create" ? "Create Artist" : "Update Artist", "artist-submit-btn", {
//         click: async (e) => {
//             e.preventDefault();
//             if (mode === "create") await submitArtistForm(section);
//             else await updateArtistForm(artistID, section);
//         }
//     });
//     section.appendChild(submitBtn);

//     content.appendChild(section);
// }

// // ------------------- BAND MEMBER HANDLER -------------------
// function addBandMember(existingMember = null, container) {
//     if (!container) return;

//     const photoSrc = existingMember?.image
//         ? resolveImagePath(EntityType.ARTIST, PictureType.THUMB, existingMember.image)
//         : "";

//     const memberDiv = createElement("div", { class: "band-member" });

//     const nameField = createFormGroup({
//         type: "text",
//         id: `member-name-${Date.now()}`,
//         label: "Member Name",
//         required: true,
//         value: existingMember?.name || ""
//     });

//     const roleField = createFormGroup({
//         type: "text",
//         id: `member-role-${Date.now()}`,
//         label: "Role (optional)",
//         value: existingMember?.role || ""
//     });

//     const dobField = createFormGroup({
//         type: "date",
//         id: `member-dob-${Date.now()}`,
//         label: "DOB (optional)",
//         value: existingMember?.dob || ""
//     });

//     const imageField = createFormGroup({
//         type: "file",
//         id: `member-image-${Date.now()}`,
//         label: "Member Image",
//         accept: "image/*",
//         value: photoSrc
//     });

//     const removeBtn = Button("Remove", "", {
//         click: () => container.removeChild(memberDiv)
//     }, "remove-member-btn");

//     [nameField, roleField, dobField, imageField, removeBtn].forEach(el => memberDiv.appendChild(el));
//     container.appendChild(memberDiv);
// }

// // ------------------- FORM DATA COLLECTOR -------------------
// function collectFormData(section) {
//     if (!section) throw new Error("Form section is required.");

//     const formData = new FormData();

//     ["artist-category", "artist-name", "artist-bio", "artist-dob", "artist-place", "artist-country", "artist-genres", "artist-socials"].forEach(id => {
//         const el = section.querySelector(`#${id}`);
//         if (el) formData.append(id.replace("artist-", ""), el.value || "");
//     });

//     // Band members
//     section.querySelectorAll(".band-member").forEach((div, index) => {
//         const name = div.querySelector("input[type=text]")?.value.trim();
//         if (name) {
//             const role = div.querySelector("input[type=text]:nth-of-type(2)")?.value.trim();
//             const dob = div.querySelector("input[type=date]")?.value;
//             const imageFile = div.querySelector("input[type=file]")?.files?.[0];
//             formData.append(`members[${index}]`, JSON.stringify({ name, role, dob }));
//             if (imageFile) formData.append(`memberImage_${index}`, imageFile);
//         }
//     });

//     return formData;
// }

// // ------------------- CREATE -------------------
// async function submitArtistForm(section) {
//     const formData = collectFormData(section);
//     try {
//         const response = await apiFetch("/artists", "POST", formData);
//         Notify("Artist created successfully!", { type: "success", duration: 3000, dismissible: true });
//         navigate(`/artist/${response.artistid}`);
//     } catch (err) {
//         Notify(`Failed to create artist: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
//     }
// }

// // ------------------- UPDATE -------------------
// async function updateArtistForm(artistID, section) {
//     const formData = collectFormData(section);
//     try {
//         await apiFetch(`/artists/${artistID}`, "PUT", formData);
//         Notify("Artist updated successfully", { type: "success", duration: 3000, dismissible: true });
//         navigate(`/artist/${artistID}`);
//     } catch (err) {
//         Notify(`Failed to update artist: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
//     }
// }

// // ------------------- CREATE ARTIST EXPORT -------------------
// export function createArtist(isLoggedIn, content) {
//     createOrEditArtist({ isLoggedIn, content, mode: "create" });
// }

// // ------------------- EDIT ARTIST EXPORT -------------------
// export async function editArtist(isLoggedIn, content, artistID, existingArtist, isCreator) {
//     createOrEditArtist({ isLoggedIn, content, mode: "edit", artistID, existingArtist, isCreator });
// }


// // import { navigate } from "../../routes/index.js";
// // import { apiFetch } from "../../api/api.js";
// // import Button from "../../components/base/Button.js";
// // import { createFormGroup } from "../../components/createFormGroup.js"; // ✅ updated import
// // import { createElement } from "../../components/createElement.js";
// // import Notify from "../../components/ui/Notify.mjs";
// // import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// // export async function deleteArtistForm(isLoggedIn, artistID, isCreator) {
// //     alert("noted");
// // }

// // // ------------------- CREATE OR EDIT ARTIST -------------------
// // export async function createOrEditArtist({ isLoggedIn, content, mode = "create", artistID = null, existingArtist = null, isCreator = false }) {
// //     if (!isLoggedIn) {
// //         Notify("Please log in to continue.", { type: "warning", duration: 3000, dismissible: true });
// //         navigate("/login");
// //         return;
// //     }

// //     if (mode === "edit" && !isCreator) {
// //         Notify("You are not authorized to edit this artist.", { type: "error", duration: 3000, dismissible: true });
// //         return;
// //     }

// //     content.innerHTML = ""; // clear existing form if any

// //     const section = createElement("div", { class: "artist-form-section" });
// //     const heading = createElement("h2", {}, [mode === "create" ? "Create Artist" : "Edit Artist"]);
// //     section.appendChild(heading);

// //     const formFields = [
// //         {
// //             type: "select", id: "artist-category", label: "Artist Type", required: true,
// //             options: [
// //                 { value: "", label: "Select a Type" },
// //                 { value: "singer", label: "Singer" },
// //                 { value: "band", label: "Band" },
// //                 { value: "comedian", label: "Comedian" },
// //                 { value: "actor", label: "Actor" },
// //                 { value: "poet", label: "Poet" },
// //                 { value: "musician", label: "Musician" },
// //                 { value: "dancer", label: "Dancer" },
// //                 { value: "magician", label: "Magician" },
// //                 { value: "painter", label: "Painter" },
// //                 { value: "photographer", label: "Photographer" },
// //                 { value: "sculptor", label: "Sculptor" },
// //                 { value: "other", label: "Other" }
// //             ]
// //         },
// //         { type: "text", id: "artist-name", label: "Artist Name", required: true },
// //         { type: "textarea", id: "artist-bio", label: "Artist's Biography", required: true },
// //         { type: "date", id: "artist-dob", label: "Date of Birth" },
// //         { type: "text", id: "artist-place", label: "Artist Place", required: true },
// //         { type: "text", id: "artist-country", label: "Country", required: true },
// //         { type: "text", id: "artist-genres", label: "Genres (comma separated)" },
// //         { type: "url", id: "artist-socials", label: "Socials" },
// //     ];

// //     formFields.forEach(field => {
// //         let value = "";

// //         if (existingArtist) {
// //             switch (field.id) {
// //                 case "artist-category":
// //                     value = existingArtist.category || "";
// //                     break;
// //                 case "artist-name":
// //                     value = existingArtist.name || "";
// //                     break;
// //                 case "artist-bio":
// //                     value = existingArtist.bio || "";
// //                     break;
// //                 case "artist-dob":
// //                     value = existingArtist.dob || "";
// //                     break;
// //                 case "artist-place":
// //                     value = existingArtist.place || "";
// //                     break;
// //                 case "artist-country":
// //                     value = existingArtist.country || "";
// //                     break;
// //                 case "artist-genres":
// //                     value = existingArtist.genres ? existingArtist.genres.join(", ") : "";
// //                     break;
// //                 case "artist-socials":
// //                     value = existingArtist.socials?.raw || "";
// //                     break;
// //             }
// //         }

// //         const inputField = createFormGroup({ ...field, value });
// //         section.appendChild(inputField);
// //     });

// //     // Band members section
// //     const membersContainer = createElement("div", { id: "band-members-container" });
// //     const bandSection = createElement("div", { class: "band-members-section" }, [
// //         createElement("h3", {}, ["Band Members"]),
// //         membersContainer,
// //         Button("Add Member", "add-member-btn", { click: () => addBandMember(null, membersContainer) })
// //     ]);
// //     section.appendChild(bandSection);

// //     // Prepopulate existing members
// //     if (mode === "edit" && existingArtist?.members) {
// //         existingArtist.members.forEach(member => addBandMember(member, membersContainer));
// //     }

// //     const submitBtn = Button(mode === "create" ? "Create Artist" : "Update Artist", "artist-submit-btn", {
// //         click: async (e) => {
// //             e.preventDefault();
// //             if (mode === "create") {
// //                 await submitArtistForm();
// //             } else {
// //                 await updateArtistForm(artistID);
// //             }
// //         }
// //     });
// //     section.appendChild(submitBtn);

// //     content.appendChild(section);
// // }

// // // ------------------- BAND MEMBER HANDLER -------------------
// // function addBandMember(existingMember = null, container) {
// //     if (!container) return;

// //     const photoSrc = existingMember?.image
// //         ? resolveImagePath(EntityType.ARTIST, PictureType.THUMB, existingMember.image)
// //         : "";

// //     const memberDiv = createElement("div", { class: "band-member" });

// //     const nameField = createFormGroup({
// //         type: "text",
// //         id: `member-name-${Date.now()}`,
// //         label: "Member Name",
// //         required: true,
// //         value: existingMember?.name || ""
// //     });

// //     const roleField = createFormGroup({
// //         type: "text",
// //         id: `member-role-${Date.now()}`,
// //         label: "Role (optional)",
// //         value: existingMember?.role || ""
// //     });

// //     const dobField = createFormGroup({
// //         type: "date",
// //         id: `member-dob-${Date.now()}`,
// //         label: "DOB (optional)",
// //         value: existingMember?.dob || ""
// //     });

// //     const imageField = createFormGroup({
// //         type: "file",
// //         id: `member-image-${Date.now()}`,
// //         label: "Member Image",
// //         accept: "image/*",
// //         value: photoSrc
// //     });

// //     const removeBtn = Button("Remove", "", {
// //         click: () => container.removeChild(memberDiv)
// //     }, "remove-member-btn");

// //     [nameField, roleField, dobField, imageField, removeBtn].forEach(el => memberDiv.appendChild(el));
// //     container.appendChild(memberDiv);
// // }

// // // ------------------- FORM DATA COLLECTOR -------------------
// // function collectFormData() {
// //     const formData = new FormData();
// //     const container = document.querySelector(".artist-form-section");

// //     ["artist-category", "artist-name", "artist-bio", "artist-dob", "artist-place", "artist-country", "artist-genres", "artist-socials"].forEach(id => {
// //         const el = container.querySelector(`#${id}`);
// //         if (el) formData.append(id.replace("artist-", ""), el.value || "");
// //     });

// //     // Band members
// //     const members = [];
// //     container.querySelectorAll(".band-member").forEach((div, index) => {
// //         const name = div.querySelector("input[type=text]")?.value.trim();
// //         if (name) {
// //             const role = div.querySelector("input[type=text]:nth-of-type(2)")?.value.trim();
// //             const dob = div.querySelector("input[type=date]")?.value;
// //             const imageFile = div.querySelector("input[type=file]")?.files?.[0];
// //             members.push({ name, role, dob });
// //             if (imageFile) formData.append(`memberImage_${index}`, imageFile);
// //         }
// //     });
// //     if (members.length) formData.append("members", JSON.stringify(members));

// //     return formData;
// // }

// // // ------------------- CREATE -------------------
// // async function submitArtistForm() {
// //     const formData = collectFormData();
// //     try {
// //         const response = await apiFetch("/artists", "POST", formData);
// //         Notify("Artist created successfully!", { type: "success", duration: 3000, dismissible: true });
// //         navigate(`/artist/${response.artistid}`);
// //     } catch (err) {
// //         Notify(`Failed to create artist: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
// //     }
// // }

// // // ------------------- UPDATE -------------------
// // async function updateArtistForm(artistID) {
// //     const formData = collectFormData();
// //     try {
// //         await apiFetch(`/artists/${artistID}`, "PUT", formData);
// //         Notify("Artist updated successfully", { type: "success", duration: 3000, dismissible: true });
// //         navigate(`/artist/${artistID}`);
// //     } catch (err) {
// //         Notify(`Failed to update artist: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
// //     }
// // }

// // // ------------------- CREATE ARTIST EXPORT -------------------
// // export function createArtist(isLoggedIn, content) {
// //     createOrEditArtist({ isLoggedIn, content, mode: "create" });
// // }

// // // ------------------- EDIT ARTIST EXPORT -------------------
// // export async function editArtist(isLoggedIn, content, artistID, existingArtist, isCreator) {
// //     createOrEditArtist({ isLoggedIn, content, mode: "edit", artistID, existingArtist, isCreator });
// // }
