import { createElement } from "../../../components/createElement.js";
import Snackbar from "../../../components/ui/Snackbar.mjs";
import { navigate } from "../../../routes/index.js";
import { apiFetch } from "../../../api/api.js";
import { createFormGroup } from "../../../components/createFormGroup.js";
import Button from "../../../components/base/Button.js";

export function displayCreateBaitoProfile(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = "";

    if (!isLoggedIn) {
        Snackbar("Login required to create your worker profile.", 3000);
        navigate("/login");
        return;
    }

    const section = createElement("div", { class: "create-section" });
    const form = createElement("form");

    const bioCounter = createElement("small", { class: "char-count" });

    const fields = [
        { label: "Full Name", inputType: "text", inputId: "profile-name", isRequired: true, placeholder: "e.g. Yuki Tanaka" },
        { label: "Age", inputType: "number", inputId: "profile-age", isRequired: true, placeholder: "e.g. 22", additionalProps: { min: 16 } },
        { label: "Phone Number", inputType: "text", inputId: "profile-phone", isRequired: true, placeholder: "e.g. 080-1234-5678" },
        { label: "Location", inputType: "text", inputId: "profile-location", isRequired: true, placeholder: "e.g. Shibuya, Tokyo" },
        { label: "Preferred Roles", inputType: "text", inputId: "profile-roles", isRequired: true, placeholder: "e.g. Waiter, Cashier" },
        { label: "Bio", inputType: "textarea", inputId: "profile-bio", isRequired: true, placeholder: "Brief intro, experience, availability...", additionalNodes: [bioCounter] },
        { label: "Profile Picture", inputType: "file", inputId: "profile-picture", additionalProps: { accept: "image/*" } }
    ];

    fields.forEach(f => form.appendChild(createFormGroup(f)));

    // Bio character counter
    form.querySelector("#profile-bio").addEventListener("input", e => {
        bioCounter.textContent = `${e.target.value.length} characters`;
    });

    // Image preview
    const pictureInput = form.querySelector("#profile-picture");
    pictureInput.addEventListener("change", () => {
        const file = pictureInput.files?.[0];
        const container = pictureInput.closest(".form-group");
        const existing = container.querySelector(".profile-preview");
        if (existing) existing.remove();

        if (file) {
            const preview = createElement("img", {
                src: URL.createObjectURL(file),
                class: "profile-preview"
            });
            container.appendChild(preview);
        }
    });

    const submitBtn = Button("Create Profile", "create-profile-btn", {}, "btn btn-primary");

    form.addEventListener("submit", async e => {
        e.preventDefault();
        submitBtn.disabled = true;

        const formData = new FormData(form);

        const requiredFields = {
            name: formData.get("profile-name")?.trim(),
            age: formData.get("profile-age"),
            phone: formData.get("profile-phone")?.trim(),      // backend expects "phone"
            location: formData.get("profile-location")?.trim(),// backend expects "location"
            roles: formData.get("profile-roles")?.trim(),      // backend expects "roles"
            bio: formData.get("profile-bio")?.trim()
        };

        if (Object.values(requiredFields).some(v => !v)) {
            Snackbar("Please fill all required fields.", 3000);
            submitBtn.disabled = false;
            return;
        }

        if (Number(requiredFields.age) < 16) {
            Snackbar("Minimum age is 16.", 3000);
            submitBtn.disabled = false;
            return;
        }

        const payload = new FormData();
        Object.entries(requiredFields).forEach(([k, v]) => payload.append(k, v));

        const profilePic = pictureInput?.files?.[0];
        if (profilePic) payload.append("picture", profilePic); // backend expects "picture"

        try {
            Snackbar("Creating profile...", 2000);
            await apiFetch("/baitos/profile", "POST", payload);
            Snackbar("Profile created successfully!", 3000);
            navigate("/baitos");
        } catch (err) {
            Snackbar(`Error: ${err.message || "Profile creation failed."}`, 3000);
        } finally {
            submitBtn.disabled = false;
        }
    });

    form.appendChild(submitBtn);
    section.appendChild(createElement("h2", {}, ["Create Worker Profile"]));
    section.appendChild(form);
    contentContainer.appendChild(section);
}
