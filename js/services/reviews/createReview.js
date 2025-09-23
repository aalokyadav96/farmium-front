import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import Button from "../../components/base/Button.js";

async function handleAddReview(container, entityType, entityId) {
    container.replaceChildren();

    const form = createElement("form", { class: "review-form" });

    // Rating input
    const ratingGroup = createFormGroup({
        type: "number",
        id: "rating",
        name: "rating",
        label: "Rating (1-5):",
        required: true,
        additionalProps: { min: 1, max: 5 }
    });

    // Comment input
    const commentGroup = createFormGroup({
        type: "textarea",
        id: "comment",
        name: "comment",
        label: "Your Review:",
        placeholder: "Write your review...",
        required: true,
        additionalProps: { rows: 3 }
    });

    // Submit button
    const submitButton = Button("Submit Review", "", { type: "submit" });

    // Cancel button
    const cancelButton = Button("Cancel", "", {
        click: () => container.replaceChildren()
    }, "cancel-btn");

    form.append(ratingGroup, commentGroup, submitButton, cancelButton);
    container.appendChild(form);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const ratingInput = form.querySelector("#rating");
        const commentInput = form.querySelector("#comment");

        const rating = parseInt(ratingInput.value, 10);
        const comment = commentInput.value.trim();

        if (rating < 1 || rating > 5 || !comment) {
            alert("Please enter a valid rating (1-5) and a review comment.");
            return;
        }

        try {
            await apiFetch(
                `/reviews/${entityType}/${entityId}`,
                "POST",
                JSON.stringify({ rating, comment })
            );
            alert("Review added successfully!");
            refreshReviews();
            container.replaceChildren();
        } catch (error) {
            console.error("Error adding review:", error);
            alert("Failed to add review. You might have already reviewed this entity.");
        }
    });
}

async function refreshReviews() {
    window.location.href = window.location.pathname;
}

async function handleEditReview(reviewId, entityType, entityId) {
    const newRating = parseInt(prompt("Enter a new rating (1-5):"), 10);
    const newComment = prompt("Enter a new comment:");

    if (newRating && newComment && newRating >= 1 && newRating <= 5) {
        try {
            await apiFetch(
                `/reviews/${entityType}/${entityId}/${reviewId}`,
                "PUT",
                JSON.stringify({ rating: newRating, comment: newComment })
            );
            alert("Review updated successfully!");
            refreshReviews();
        } catch (error) {
            console.error("Error editing review:", error);
            alert("Failed to update review.");
        }
    } else {
        alert("Invalid input. Rating must be between 1-5, and comment cannot be empty.");
    }
}

async function handleDeleteReview(reviewId, entityType, entityId) {
    if (confirm("Are you sure you want to delete this review?")) {
        try {
            await apiFetch(`/reviews/${entityType}/${entityId}/${reviewId}`, "DELETE");
            alert("Review deleted successfully!");
            refreshReviews();
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
        }
    }
}

export { handleAddReview, handleEditReview, handleDeleteReview };
