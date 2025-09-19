
// File validation function
function isValidFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        showErrorMessage('Unsupported file type. Please upload a JPEG, PNG, or MP4 file.');
        return false;
    }

    if (file.size > maxSize) {
        showErrorMessage('File size exceeds 5MB. Please upload a smaller file.');
        return false;
    }

    return true;
}

// Function to show error messages
function showErrorMessage(message) {
    alert(message);  // You can replace this with your custom error handling UI
}

// Media upload preview function
function handleMediaPreview(file) {
    const reader = new FileReader();
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.createElement('progress');
    progressBar.max = 100;
    progressContainer.appendChild(progressBar);

    reader.onload = function (e) {
        const mediaType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : null);
        if (!mediaType) {
            alert("Unsupported file type");
            return;
        }

        const mediaItem = renderMediaItem({
            type: mediaType,
            url: e.target.result,
            description: 'Uploaded Media',
            name: file.name,
            size: (file.size / 1024).toFixed(2) // File size in KB
        });

        const mediaPreview = document.getElementById('mediaPreview');
        mediaPreview.innerHTML += mediaItem;

        // Add event listener for remove button
        const removeButton = mediaPreview.querySelector('.remove-button:last-of-type');
        removeButton.addEventListener('click', () => removeMediaPreview(removeButton));
    };

    reader.onprogress = function (event) {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.value = percentComplete;
        }
    };

    reader.readAsDataURL(file);  // Read the file as a data URL (base64)
}

// Remove media preview
function removeMediaPreview(button) {
    const mediaPreview = document.getElementById('mediaPreview');
    mediaPreview.removeChild(button.parentElement);
}

// Main media upload function (uploads media and shows preview)
async function handleMediaUpload() {
    const input = document.getElementById('mediaInput');
    const files = input.files;
    const progressContainer = document.getElementById('progressContainer');

    progressContainer.innerHTML = ''; // Clear previous progress bars

    for (const file of files) {
        if (!isValidFile(file)) {
            continue; // Skip invalid files
        }

        handleMediaPreview(file);
    }

    input.value = ''; // Clear the input after upload
}


export {isValidFile, handleMediaPreview, handleMediaUpload};