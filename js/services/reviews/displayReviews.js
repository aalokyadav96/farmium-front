import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { handleAddReview, handleEditReview, handleDeleteReview } from "./createReview.js";

// Create a review item component
function ReviewItem(isCreator, { reviewerName, rating, comment, onEdit, onDelete }) {
    let actions;
    let authorOfReview = `"${reviewerName}"` == localStorage.getItem("user");
    if (!isCreator && !!authorOfReview) {
        actions = createElement("div", { class: "review-actions" }, [
            Button("Edit", "edit-review-btn", { click: onEdit }),
            Button("Delete", "delete-review-btn", { click: onDelete }),
        ]);
    } else {
        actions = null;
    }
    console.log(isCreator);
    return createElement("div", { class: "review-item" }, [
        createElement("h3", {}, [reviewerName]),
        createElement("p", {}, [`Ratings: ${rating}`]),
        createElement("p", {}, [comment]),
        ...(actions ? [actions] : []), // Spread operator to add `actions` if not null
    ]);

}

// Display reviews for the given entity
async function displayReviews(reviewsContainer, isCreator, isLoggedIn, entityType, entityId) {
    reviewsContainer.innerHTML = ""; // Clear existing reviews
    reviewsContainer.appendChild(createElement('h2', "", ["Reviews"]));
    const newcon = document.createElement('div');

    if (!isCreator && isLoggedIn) {
        const addButton = Button("Add Review", "add-review-btn", {
            click: () => handleAddReview(newcon, entityType, entityId),
        });
        reviewsContainer.appendChild(addButton);
    }

    reviewsContainer.appendChild(newcon);
    try {
        const response = await apiFetch(`/reviews/${entityType}/${entityId}`);
        if (response.ok) {
            const { reviews } = await response;
            if (reviews && reviews.length > 0) {
                reviews.forEach((review) => {
                    reviewsContainer.appendChild(
                        ReviewItem(isCreator, {
                            reviewerName: review.userid ? review.userid : "Anonymous",
                            rating: review.rating,
                            comment: review.comment,
                            date: new Date(review.date).toLocaleString(),
                            onEdit: () => handleEditReview(review.reviewid, entityType, entityId),
                            onDelete: () => handleDeleteReview(review.reviewid, entityType, entityId),
                        })
                    );
                });
            } else {
                reviewsContainer.appendChild(createElement("p", {}, ["No reviews yet."]));
            }
        } else {
            throw new Error(`API error: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        reviewsContainer.appendChild(createElement("p", {}, ["Failed to load reviews."]));
    }

}

export { displayReviews };
