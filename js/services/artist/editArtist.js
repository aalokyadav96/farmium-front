import { navigate } from "../../routes/index.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import SnackBar from "../../components/ui/Snackbar.mjs";
import Button from "../../components/base/Button.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { createElement } from "../../components/createElement";
createElement

export async function deleteArtistForm(isLoggedIn, artistID, isCreator) {
    alert("noted");
}

export async function editArtistForm(isLoggedIn, artistID, isCreator) {
    const editSection = document.getElementById("editartist");
    console.log(editSection);

    if (!isLoggedIn) {
        navigate("/login");
        return;
    }

    if (!isCreator) {
        return;
    }

    try {
        const artist = await apiFetch(`/artists/${artistID}`);
        console.log(artist);

        editSection.innerHTML = "";

        const formContainer = document.createElement("div");
        formContainer.className = "form-container";

        const formHeading = document.createElement("h2");
        formHeading.textContent = "Edit Artist";

        const form = document.createElement("form");
        form.id = "edit-artist-form";
        form.className = "edit-artist-form";

        const formGroups = [
            { label: "Artist Name", inputType: "text", inputId: "artist-name", inputValue: artist.name, placeholder: "Artist Name", isRequired: true },
            {
                label: "Artist Type", inputType: "select", inputId: "artist-category", inputValue: artist.category, options: [
                    { value: artist.category, label: artist.category },
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
                    { value: "other", label: "Other" },
                ], isRequired: true
            },
            { label: "Biography", inputType: "textarea", inputId: "artist-bio", inputValue: artist.bio, placeholder: "Artist Biography", isRequired: true },
            { label: "Date of Birth", inputType: "date", inputId: "artist-dob", inputValue: artist.dob, isRequired: true },
            { label: "Place", inputType: "text", inputId: "artist-place", inputValue: artist.place, placeholder: "Place", isRequired: true },
            { label: "Country", inputType: "text", inputId: "artist-country", inputValue: artist.country, placeholder: "Country", isRequired: true },
            { label: "Genres", inputType: "text", inputId: "artist-genres", inputValue: artist.genres.join(", "), placeholder: "Genres (comma separated)" },
            { label: "Socials", inputType: "textarea", inputId: "artist-socials", inputValue: JSON.stringify(artist.socials, null, 2), placeholder: "Socials (JSON format)" },
            { label: "Artist Banner", inputType: "file", inputId: "artist-banner", additionalProps: { accept: "image/*" } },
            { label: "Artist Photo", inputType: "file", inputId: "artist-photo", additionalProps: { accept: "image/*" } },
        ];

        formGroups.forEach(group => form.appendChild(createFormGroup(group)));

        // 👉 Band Members Section
        const bandSection = document.createElement("div");
        bandSection.className = "band-members-section";

        const bandHeader = document.createElement("h3");
        bandHeader.textContent = "Band Members";
        bandSection.appendChild(bandHeader);

        const membersContainer = document.createElement("div");
        membersContainer.id = "band-members-container";
        bandSection.appendChild(membersContainer);

        const addMemberBtn = Button("Add Member", "add-member-btn", { click: (member) => { addBandMember(member, membersContainer) } });
        bandSection.appendChild(addMemberBtn);

        form.appendChild(bandSection);

        // Load existing members if any
        if (artist.members && artist.members.length > 0) {
            artist.members.forEach(member => {
                addBandMember(member, membersContainer);
            });
        }

        const updateButton = document.createElement("button");
        updateButton.type = "submit";
        updateButton.className = "button update-btn";
        updateButton.textContent = "Update Artist";

        const cancelButton = Button("Cancel", "cancel-btn", {
            click: () => (editSection.innerHTML = ""),
        });
        cancelButton.type = "button";

        form.appendChild(updateButton);
        form.appendChild(cancelButton);

        formContainer.appendChild(formHeading);
        formContainer.appendChild(form);

        editSection.appendChild(formContainer);

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            await updateArtist(event, artistID);
        });

    } catch (error) {
        console.error("Edit Artist Form Error:", error);
        SnackBar(`Error loading artist: ${error.message}`, 3000);
    }
}

function addBandMember(existingMember = null, container) {
    const nameInput = createElement("input", {
        type: "text",
        placeholder: "Member Name",
        required: true,
        class: "member-name",
        value: existingMember?.name || ""
    });

    const roleInput = createElement("input", {
        type: "text",
        placeholder: "Role (optional)",
        class: "member-role",
        value: existingMember?.role || ""
    });

    const dobInput = createElement("input", {
        type: "date",
        placeholder: "DOB (optional)",
        class: "member-dob",
        value: existingMember?.dob || ""
    });

    const imageInput = createElement("input", {
        type: "file",
        accept: "image/*",
        class: "member-image"
    });

    // const imagePreview = createElement("img", {
    //     class: "member-preview",
    //     style: "max-width: 150px; display: none; margin-top: 10px;"
    // });

    // // If there's an existing image URL in the member, show it
    // if (existingMember?.image) {
    //     imagePreview.src = `${SRC_URL}/artistpic/members/${existingMember.image}`;
    //     imagePreview.style.display = "block";
    // }

    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = "block";
        }
    });

    const removeBtn = Button("Remove","", {
        click : () => {
            container.removeChild(memberDiv);
        }
    },"remove-member-btn");

    const memberDiv = createElement("div", { class: "band-member" }, [
        nameInput,
        roleInput,
        dobInput,
        imageInput,
        // imagePreview,
        removeBtn
    ]);


    container.appendChild(memberDiv);
}


// function addBandMember(existingMember = null, container) {
//     // const container = document.getElementById("band-members-container");

//     const memberDiv = document.createElement("div");
//     memberDiv.className = "band-member";

//     memberDiv.innerHTML = `
//         <input type="text" placeholder="Member Name" class="member-name" value="${existingMember?.name || ""}" required />
//         <input type="text" placeholder="Role (optional)" class="member-role" value="${existingMember?.role || ""}" />
//         <input type="date" placeholder="DOB (optional)" class="member-dob" value="${existingMember?.dob || ""}" />
//         <button type="button" class="remove-member-btn">Remove</button>
//     `;

//     memberDiv.querySelector(".remove-member-btn").addEventListener("click", () => {
//         container.removeChild(memberDiv);
//     });

//     container.appendChild(memberDiv);
// }

async function updateArtist(event, artistID) {
    const form = event.target;
    const formData = new FormData();

    // Basic fields
    formData.append("name", form.querySelector("#artist-name").value);
    formData.append("category", form.querySelector("#artist-category").value);
    formData.append("bio", form.querySelector("#artist-bio").value);
    formData.append("dob", form.querySelector("#artist-dob").value);
    formData.append("place", form.querySelector("#artist-place").value);
    formData.append("country", form.querySelector("#artist-country").value);
    formData.append("genres", form.querySelector("#artist-genres").value);
    formData.append("socials", form.querySelector("#artist-socials").value);

    // Banner and photo files
    const bannerInput = form.querySelector("#artist-banner");
    if (bannerInput?.files?.[0]) {
        formData.append("banner", bannerInput.files[0]);
    }

    const photoInput = form.querySelector("#artist-photo");
    if (photoInput?.files?.[0]) {
        formData.append("photo", photoInput.files[0]);
    }

    // 👉 Handle band members
    const memberDivs = form.querySelectorAll(".band-member");
    const membersArray = [];

    memberDivs.forEach((div, index) => {
        const name = div.querySelector(".member-name")?.value?.trim();
        const role = div.querySelector(".member-role")?.value?.trim();
        const dob = div.querySelector(".member-dob")?.value?.trim();
        const imageInput = div.querySelector(".member-image");

        // push text fields into members array
        membersArray.push({ name, role, dob });

        // if image exists, add to FormData with index
        if (imageInput?.files?.[0]) {
            formData.append(`memberImage_${index}`, imageInput.files[0]);
        }
    });

    // Append serialized members as JSON string
    formData.append("members", JSON.stringify(membersArray));

    try {
        await apiFetch(`/artists/${artistID}`, "PUT", formData, {
            headers: {
                // Content-Type will be auto-set by browser with correct boundary
            }
        });
        SnackBar("Artist updated successfully", 3000);
        navigate(`/artist/${artistID}`);
    } catch (err) {
        console.error("Update error:", err);
        SnackBar("Failed to update artist", 3000);
    }
}

// async function updateArtist(event, artistId) {
//     event.preventDefault();

//     const formData = new FormData();
//     const artist = await apiFetch(`/artists/${artistId}`); // fetch current data for comparison

//     const category = document.getElementById("artist-category").value;
//     const name = document.getElementById("artist-name").value;
//     const bio = document.getElementById("artist-bio").value;
//     const dob = document.getElementById("artist-dob").value;
//     const place = document.getElementById("artist-place").value;
//     const country = document.getElementById("artist-country").value;
//     const genres = document.getElementById("artist-genres").value;
//     const socials = document.getElementById("artist-socials").value;
//     const banner = document.getElementById("artist-banner").files[0];
//     const photo = document.getElementById("artist-photo").files[0];

//     // Compare and append only if changed
//     if (category && category !== artist.category) formData.append("category", category);
//     if (name && name !== artist.name) formData.append("name", name);
//     if (bio && bio !== artist.bio) formData.append("bio", bio);
//     if (dob && dob !== artist.dob) formData.append("dob", dob);
//     if (place && place !== artist.place) formData.append("place", place);
//     if (country && country !== artist.country) formData.append("country", country);

//     if (genres) {
//         const genresList = genres.split(",").map(g => g.trim()).filter(g => g);
//         const originalGenres = Array.isArray(artist.genres) ? artist.genres : [];
//         const genresChanged = genresList.length !== originalGenres.length || genresList.some((g, i) => g !== originalGenres[i]);
//         if (genresChanged) {
//             formData.append("genres", JSON.stringify(genresList));
//         }
//     }

//     if (socials) {
//         try {
//             const parsedSocials = JSON.parse(socials);
//             const originalSocials = artist.socials || {};
//             const socialsChanged = JSON.stringify(parsedSocials) !== JSON.stringify(originalSocials);
//             if (socialsChanged) {
//                 formData.append("socials", JSON.stringify(parsedSocials));
//             }
//         } catch (e) {
//             SnackBar("Invalid JSON format in socials", 3000);
//             return;
//         }
//     }

//     if (banner) formData.append("banner", banner);
//     if (photo) formData.append("photo", photo);

//     // Compare band members

//     const members = artist.members || [];
//     const memberElements = document.querySelectorAll(".band-member");
    
//     memberElements.forEach((member, index) => {
//         const name = member.querySelector(".member-name").value.trim();
//         if (name) {
//             const role = member.querySelector(".member-role").value.trim();
//             const dob = member.querySelector(".member-dob").value;
//             const imageFile = member.querySelector(".member-image").files[0];
    
//             const memberData = { name, role, dob };
//             members.push(memberData);
    
//             if (imageFile) {
//                 formData.append(`memberImage_${index}`, imageFile);
//             }
//         }
//     });
    
//     const originalMembers = artist.members || [];
//     const membersChanged = JSON.stringify(members) !== JSON.stringify(originalMembers);
//     if (membersChanged && members.length > 0) {
//         formData.append("members", JSON.stringify(members));
//     }

//     if ([...formData.keys()].length === 0) {
//         SnackBar("No changes to update.", 3000);
//         return;
//     }

//     try {
//         const response = await apiFetch(`/artists/${artistId}`, "PUT", formData);

//         if (response) {
//             SnackBar("Artist updated successfully!", 3000);
//             navigate(`/artist/${artistId}`);
//         } else {
//             const errorData = await response;
//             SnackBar(`Error: ${errorData.message}`, 3000);
//         }
//     } catch (error) {
//         SnackBar(`Failed to update artist: ${error.message}`, 3000);
//     }
// }


// // async function updateArtist(event, artistId) {
// //     event.preventDefault();

// //     const formData = new FormData();
// //     const category = document.getElementById("artist-category").value;
// //     const name = document.getElementById("artist-name").value;
// //     const bio = document.getElementById("artist-bio").value;
// //     const dob = document.getElementById("artist-dob").value;
// //     const place = document.getElementById("artist-place").value;
// //     const country = document.getElementById("artist-country").value;
// //     const genres = document.getElementById("artist-genres").value;
// //     const socials = document.getElementById("artist-socials").value;
// //     const banner = document.getElementById("artist-banner").files[0];
// //     const photo = document.getElementById("artist-photo").files[0];

// //     if (category) formData.append("category", category);
// //     if (name) formData.append("name", name);
// //     if (bio) formData.append("bio", bio);
// //     if (dob) formData.append("dob", dob);
// //     if (place) formData.append("place", place);
// //     if (country) formData.append("country", country);
// //     if (genres) formData.append("genres", genres);
// //     if (socials) formData.append("socials", socials);
// //     if (banner) formData.append("banner", banner);
// //     if (photo) formData.append("photo", photo);

// //     // 👉 Collect Band Members
// //     const members = [];
// //     const memberElements = document.querySelectorAll(".band-member");
// //     memberElements.forEach(member => {
// //         const name = member.querySelector(".member-name").value.trim();
// //         if (name) {
// //             members.push({
// //                 name,
// //                 role: member.querySelector(".member-role").value.trim(),
// //                 dob: member.querySelector(".member-dob").value,
// //             });
// //         }
// //     });

// //     if (members.length > 0) {
// //         formData.append("members", JSON.stringify(members));
// //     }

// //     try {
// //         const response = await apiFetch(`/artists/${artistId}`, "PUT", formData);

// //         if (response) {
// //             SnackBar("Artist updated successfully!", 3000);
// //             navigate(`/artist/${artistId}`);
// //         } else {
// //             const errorData = await response;
// //             SnackBar(`Error: ${errorData.message}`, 3000);
// //         }
// //     } catch (error) {
// //         SnackBar(`Failed to update artist: ${error.message}`, 3000);
// //     }
// // }
