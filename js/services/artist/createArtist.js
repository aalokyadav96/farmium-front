import { navigate } from "../../routes/index.js";
import SnackBar from '../../components/ui/Snackbar.mjs';
import { createFormField } from "../event/createEventHelpers.js";
import Button from "../../components/base/Button.js";
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";

export async function createArtistForm(isLoggedIn, content) {
    const createSection = createElement("div", { class: "create-section" });

    if (!isLoggedIn) {
        SnackBar("Please log in to create an artist.", 3000);
        navigate("/login");
        return;
    }

    const header = createElement("h2", {}, ["Create Artist"]);
    createSection.appendChild(header);

    const formFields = [
        {
            type: "select", id: "artist-category", label: "Artist Type", required: true,
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
        { type: "text", id: "artist-name", label: "Artist Name", required: true },
        { type: "textarea", id: "artist-bio", label: "Artist's Biography", required: true },
        { type: "date", id: "artist-dob", label: "Date of Birth" },
        { type: "text", id: "artist-place", label: "Artist Place", required: true },
        { type: "text", id: "artist-country", label: "Country", required: true },
        { type: "text", id: "artist-genres", label: "Genres (comma separated)" },
        { type: "url", id: "artist-socials", label: "Socials" },
        { type: "file", id: "artist-banner", label: "Artist Banner", accept: "image/*" },
        { type: "file", id: "artist-photo", label: "Artist Photo", accept: "image/*" },
    ];

    formFields.forEach(field => {
        if (field.id === "artist-place") {
            const wrapper = createElement("div", { class: "suggestions-container" });
            const input = createFormField(field);
            const acList = createElement("ul", { id: "ac-list", class: "ac-list" });
            wrapper.appendChild(input);
            wrapper.appendChild(acList);
            createSection.appendChild(wrapper);
        } else {
            const input = createFormField(field);
            createSection.appendChild(input);

            // Add preview for images
            if (field.type === "file") {
                const preview = createElement("img", {
                    id: `${field.id}-preview`,
                    style: "max-width: 200px; display: none; margin-top: 10px;"
                });
                input.querySelector("input").addEventListener("change", (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        preview.src = URL.createObjectURL(file);
                        preview.style.display = "block";
                    }
                });
                createSection.appendChild(preview);
            }
        }
    });

    const bandSection = createElement("div", { class: "band-members-section" }, [
        createElement("h3", {}, ["Band Members (optional)"]),
        createElement("div", { id: "band-members-container" }),
        Button("Add Member", "add-member-btn", { click: addBandMember })
    ]);

    createSection.appendChild(bandSection);
    createSection.appendChild(Button("Create Artist", "create-artist-btn", { click: createArtist }));

    content.appendChild(createSection);
}

function addBandMember() {
    const container = document.getElementById("band-members-container");

    const nameInput = createElement("input", {
        type: "text",
        placeholder: "Member Name",
        required: true,
        class: "member-name"
    });

    const roleInput = createElement("input", {
        type: "text",
        placeholder: "Role (optional)",
        class: "member-role"
    });

    const dobInput = createElement("input", {
        type: "date",
        placeholder: "DOB (optional)",
        class: "member-dob"
    });

    const imageInput = createElement("input", {
        type: "file",
        accept: "image/*",
        class: "member-image"
    });

    const imagePreview = createElement("img", {
        class: "member-preview",
        style: "max-width: 150px; display: none; margin-top: 10px;"
    });

    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = "block";
        }
    });

    const removeBtn = createElement("button", {
        type: "button",
        class: "remove-member-btn"
    }, ["Remove"]);

    const memberDiv = createElement("div", { class: "band-member" }, [
        nameInput,
        roleInput,
        dobInput,
        imageInput,
        imagePreview,
        removeBtn
    ]);

    removeBtn.addEventListener("click", () => {
        container.removeChild(memberDiv);
    });

    container.appendChild(memberDiv);
}

async function createArtist(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("category", document.getElementById("artist-category").value);
    formData.append("name", document.getElementById("artist-name").value);
    formData.append("bio", document.getElementById("artist-bio").value);
    formData.append("dob", document.getElementById("artist-dob").value || "");
    formData.append("place", document.getElementById("artist-place").value);
    formData.append("country", document.getElementById("artist-country").value);
    formData.append("genres", document.getElementById("artist-genres").value || "");
    formData.append("socials", document.getElementById("artist-socials").value || "");

    const banner = document.getElementById("artist-banner").files[0];
    const photo = document.getElementById("artist-photo").files[0];

    if (banner) formData.append("banner", banner);
    if (photo) formData.append("photo", photo);

    // // Collect Band Members
  
    const members = [];
    const memberElements = document.querySelectorAll(".band-member");
    
    memberElements.forEach((member, index) => {
        const name = member.querySelector(".member-name").value.trim();
        if (name) {
            const role = member.querySelector(".member-role").value.trim();
            const dob = member.querySelector(".member-dob").value;
            const imageFile = member.querySelector(".member-image").files[0];
    
            const memberData = { name, role, dob };
            members.push(memberData);
    
            if (imageFile) {
                formData.append(`memberImage_${index}`, imageFile);
            }
        }
    });
    
    if (members.length > 0) {
        formData.append("members", JSON.stringify(members));
    }
    
    try {
        const response = await apiFetch("/artists", "POST", formData);

        if (response) {
            SnackBar("Artist created successfully!", 3000);
            navigate(`/artist/${response.artistid}`);
        } else {
            const errorData = await response;
            SnackBar(`Error: ${errorData.message}`, 3000);
        }
    } catch (error) {
        SnackBar(`Failed to create artist: ${error.message}`, 3000);
    }
}
