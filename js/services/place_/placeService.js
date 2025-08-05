import { apiFetch } from "../../api/api.js";
import SnackBar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import displayPlace from "./displayPlace.js";
import {editPlaceForm, updatePlace, deletePlace} from "./editPlace.js";

/***************  Code to find duplicate ids  ******************/
// const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
// const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
// console.log('Duplicate IDs:', duplicateIds);


async function createPlace(isLoggedIn) {
    if (!isLoggedIn) {
        SnackBar("Please log in to create a place.", 3000);
        navigate('/login');
        return;
    }

    // Get form values
    const name = document.getElementById("place-name").value.trim();
    const address = document.getElementById("place-address").value.trim();
    const description = document.getElementById("place-description").value.trim();
    const capacity = document.getElementById("capacity").value.trim();
    const category = document.getElementById("category-sub").value.trim();
    // const bannerFile = document.getElementById("place-banner-add").files[0];

    // Validate input fields
    if (!name || !address || !description || !category || !capacity) {
        SnackBar("Please fill in all required fields.", 3000);
        return;
    }
    if (!Number.isInteger(Number(capacity)) || capacity <= 0) {
        SnackBar("Capacity must be a positive integer.", 3000);
        return;
    }

    // // Validate banner file size and type (optional)
    // const bannerError = validateBanner(bannerFile);
    // if (bannerError) {
    //     SnackBar(bannerError, 3000);
    //     return;
    // }

    // Prepare FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('address', address);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('capacity', capacity);
    // if (bannerFile) {
    //     formData.append('banner', bannerFile);
    // }

    try {
        SnackBar("Creating place...", 3000); // Show progress feedback
        const result = await apiFetch('/places/place', 'POST', formData);
        SnackBar(`Place created successfully: ${result.name}`, 3000);
        navigate('/place/' + result.placeid); // Navigate to the new place's page
    } catch (error) {
        SnackBar(`Error creating place: ${error.message || error}`, 3000);
    }
}

// function validateBanner(file) {
//     if (file && (file.size > 5 * 1024 * 1024 || !file.type.startsWith("image/"))) {
//         return "Please upload a valid image file (max 5MB).";
//     }
//     return null;
// }

async function analyticsPlace(isLoggedIn, placeId) {
    if (!isLoggedIn) {

        SnackBar("Please log in to view your place analytics.", 3000);
        return;
    }
    if (confirm("Are you sure you want to view your place analytics?")) {
        try {
            // await apiFetch(`/places/place/${placeId}`, 'DELETE');

            // SnackBar("Place deleted successfully.", 3000);
            // navigate('/places'); // Redirect to home or another page
        } catch (error) {

            // SnackBar(`Error deleting place: ${error.message || 'Unknown error'}`, 3000);
        }
    }
}


export { createPlace, editPlaceForm, updatePlace, displayPlace, deletePlace, analyticsPlace };