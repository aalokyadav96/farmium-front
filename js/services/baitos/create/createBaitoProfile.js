import { createElement } from "../../../components/createElement.js";
import { navigate } from "../../../routes/index.js";
import { apiFetch } from "../../../api/api.js";
import { createFormGroup } from "../../../components/createFormGroup.js";
import Button from "../../../components/base/Button.js";
import Notify from "../../../components/ui/Notify.mjs";

export function displayCreateBaitoProfile(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = "";

    if (!isLoggedIn) {
        Notify("Login required to create your worker profile.", {type:"warning",duration:3000, dismissible:true});
        navigate("/login");
        return;
    }

    const section = createElement("div", { class: "create-section" });
    const form = createElement("form");

    const bioCounter = createElement("small", { class: "char-count" });

    const fields = [
        { label: "Full Name", type: "text", id: "profile-name", required: true, placeholder: "e.g. Yuki Tanaka" },
        { label: "Age", type: "number", id: "profile-age", required: true, placeholder: "e.g. 22", additionalProps: { min: 16 } },
        { label: "Phone Number", type: "text", id: "profile-phone", required: true, placeholder: "e.g. 080-1234-5678" },
        { label: "Location", type: "text", id: "profile-location", required: true, placeholder: "e.g. Shibuya, Tokyo" },
        { label: "Preferred Roles", type: "text", id: "profile-roles", required: true, placeholder: "e.g. Waiter, Cashier" },
        { label: "Bio", type: "textarea", id: "profile-bio", required: true, placeholder: "Brief intro...", additionalProps: {}, additionalNodes: [bioCounter] },
        { label: "Profile Picture", type: "file", id: "profile-picture", accept: "image/*" }
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
            Notify("Please fill all required fields.", {type:"warning",duration:3000, dismissible:true});
            submitBtn.disabled = false;
            return;
        }

        if (Number(requiredFields.age) < 16) {
            Notify("Minimum age is 16.", {type:"warning",duration:3000, dismissible:true});
            submitBtn.disabled = false;
            return;
        }

        const payload = new FormData();
        Object.entries(requiredFields).forEach(([k, v]) => payload.append(k, v));

        const profilePic = pictureInput?.files?.[0];
        if (profilePic) payload.append("picture", profilePic); // backend expects "picture"

        try {
            Notify("Creating profile...", {type:"info",duration:3000, dismissible:true});
            await apiFetch("/baitos/profile", "POST", payload);
            Notify("Profile created successfully!", {type:"success",duration:3000, dismissible:true});
            navigate("/baitos");
        } catch (err) {
            Notify(`Error: ${err.message || "Profile creation failed."}`, {type:"error",duration:3000, dismissible:true});
        } finally {
            submitBtn.disabled = false;
        }
    });

    form.appendChild(submitBtn);
    section.appendChild(createElement("h2", {}, ["Create Worker Profile"]));
    section.appendChild(form);
    contentContainer.appendChild(section);
}
