
import { apiFetch } from "../../api/api.js";
import SnackBar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import displayPlace from "./displayPlace.js";


const categoryMap = {
    "Food & Beverage": ["Restaurant", "Cafe", "Bakery"],
    "Health & Wellness": ["Hospital", "Clinic", "Gym", "Yoga Center"],
    "Entertainment": ["Theater", "Stadium", "Museum", "Arena"],
    "Services": ["Saloon", "Studio", "Petrol Pump", "Shop"],
    "Public Facilities": ["Toilet", "Park"],
    "Business": ["Business", "Hotel", "Other"]
};

export function createFormGroup({ label, inputType, inputId, inputValue = '', placeholder = '', isRequired = false, additionalProps = {}, options }) {
    const group = document.createElement('div');
    group.classList.add('form-group');

    const labelElement = document.createElement('label');
    labelElement.setAttribute('for', inputId);
    labelElement.textContent = label;

    let inputElement;
    if (inputType === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.textContent = inputValue;
    } else if (inputType === 'select') {
        inputElement = document.createElement('select');
        inputElement.id = inputId;
        inputElement.name = inputId;
        if (isRequired) inputElement.required = true;

        (options || []).forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            if (option.value === inputValue) opt.selected = true;
            inputElement.appendChild(opt);
        });
    } else {
        inputElement = document.createElement('input');
        inputElement.type = inputType;
        inputElement.value = inputValue;
    }

    inputElement.id = inputId;
    if (placeholder) inputElement.placeholder = placeholder;
    if (isRequired) inputElement.required = true;

    Object.entries(additionalProps).forEach(([key, value]) => {
        inputElement[key] = value;
    });

    group.appendChild(labelElement);
    group.appendChild(inputElement);
    return group;
}

async function editPlaceForm(isLoggedIn, placeId, content) {
    if (!isLoggedIn) {
        navigate('/login');
        return;
    }

    try {
        const place = await apiFetch(`/places/place/${placeId}`);
        content.innerHTML = '';

        const formContainer = document.createElement('div');
        formContainer.classList.add('form-container');

        const formHeading = document.createElement('h2');
        formHeading.textContent = 'Edit Place';

        const form = document.createElement('form');
        form.id = 'edit-place-form';
        form.classList.add('edit-place-form');

        // Detect main category from subcategory
        let detectedMainCategory = Object.entries(categoryMap).find(([_, subs]) =>
            subs.includes(place.category)
        )?.[0] || "";

        // Main category group
        const mainCategoryOptions = Object.keys(categoryMap).map(cat => ({ value: cat, label: cat }));
        form.appendChild(createFormGroup({
            label: "Place Type",
            inputType: "select",
            inputId: "main-category",
            inputValue: detectedMainCategory,
            isRequired: true,
            options: mainCategoryOptions
        }));

        // Subcategory group (filtered based on main category)
        const subcategoryOptions = (categoryMap[detectedMainCategory] || []).map(sub => ({ value: sub, label: sub }));
        form.appendChild(createFormGroup({
            label: "Category",
            inputType: "select",
            inputId: "category",
            inputValue: place.category,
            isRequired: true,
            options: subcategoryOptions
        }));

        // Other form fields
        const formGroups = [
            { label: 'Name', inputType: 'text', inputId: 'place-name', inputValue: place.name, placeholder: 'Place Name', isRequired: true },
            { label: 'Description', inputType: 'textarea', inputId: 'place-description', inputValue: place.description, placeholder: 'Description', isRequired: true },
            { label: 'Address', inputType: 'text', inputId: 'place-address', inputValue: place.address, placeholder: 'Location', isRequired: true },
            { label: 'Capacity', inputType: 'number', inputId: 'capacity', inputValue: place.capacity, placeholder: 'Capacity', isRequired: true },
            { label: 'Place Banner', inputType: 'file', inputId: 'banner', additionalProps: { accept: 'image/*' } },
        ];

        formGroups.forEach(group => form.appendChild(createFormGroup(group)));

        const updateButton = document.createElement('button');
        updateButton.type = 'submit';
        updateButton.textContent = 'Update Place';
        form.appendChild(updateButton);

        // Update subcategory when main category changes
        form.querySelector('#main-category').addEventListener('change', (e) => {
            const selected = e.target.value;
            const subSelect = form.querySelector('#category');
            subSelect.innerHTML = '';
            (categoryMap[selected] || []).forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                subSelect.appendChild(opt);
            });
        });

        formContainer.appendChild(formHeading);
        formContainer.appendChild(form);
        content.appendChild(formContainer);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await updatePlace(isLoggedIn, placeId);
        });

    } catch (error) {
        SnackBar(`Error loading place: ${error.message}`, 3000);
    }
}

async function updatePlace(isLoggedIn, placeId) {
    if (!isLoggedIn) {
        SnackBar("Please log in to update place.", 3000);
        return;
    }

    const name = document.getElementById("place-name").value.trim();
    const capacity = document.getElementById("capacity").value;
    const category = document.getElementById("category").value;
    const address = document.getElementById("place-address").value.trim();
    const description = document.getElementById("place-description").value.trim();
    const bannerInput = document.getElementById("banner");
    const bannerFile = bannerInput?.files[0] || null;

    if (!name || !capacity || !category || !address || !description) {
        SnackBar("Please fill in all required fields.", 3000);
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('capacity', capacity);
    formData.append('category', category);
    formData.append('address', address);
    formData.append('description', description);
    if (bannerFile) formData.append('banner', bannerFile);

    try {
        const result = await apiFetch(`/places/place/${placeId}`, 'PUT', formData);
        SnackBar(`Place updated successfully: ${result.name}`, 3000);
        displayPlace(isLoggedIn, placeId);
    } catch (error) {
        SnackBar(`Error updating place: ${error.message}`, 3000);
    }
}


async function deletePlace(isLoggedIn, placeId) {
    if (!isLoggedIn) {

        SnackBar("Please log in to delete your place.", 3000);
        return;
    }
    if (confirm("Are you sure you want to delete this place?")) {
        try {
            await apiFetch(`/places/place/${placeId}`, 'DELETE');

            SnackBar("Place deleted successfully.", 3000);
            navigate('/places'); // Redirect to home or another page
        } catch (error) {

            SnackBar(`Error deleting place: ${error.message || 'Unknown error'}`, 3000);
        }
    }
}

export { editPlaceForm, updatePlace, deletePlace };