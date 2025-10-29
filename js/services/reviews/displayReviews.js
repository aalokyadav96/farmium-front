import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { handleAddReview, handleEditReview, handleDeleteReview } from "./createReview.js";
import { fetchUserMeta } from "../../utils/usersMeta.js";

function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

// Single review component
function ReviewItem(isCreator, { reviewerName, rating, comment, date, onEdit, onDelete }) {
    const currentUser = localStorage.getItem("user");
    const isAuthor = reviewerName === currentUser;

    let actions = null;
    if (!isCreator && isAuthor) {
        actions = createElement("div", { class: "review-actions" }, [
            Button("Edit", "edit-review-btn", { click: onEdit }),
            Button("Delete", "delete-review-btn", { click: onDelete })
        ]);
    }

    return createElement("div", { class: "review-item" }, [
        createElement("div", { class: "review-header" }, [
            createElement("h3", {}, [reviewerName || "Anonymous"]),
            createElement("span", { class: "review-date" }, [date || ""])
        ]),
        createElement("p", { class: "review-rating" }, [`Rating: ${rating}`]),
        createElement("p", { class: "review-comment" }, [comment]),
        ...(actions ? [actions] : [])
    ]);
}

async function displayReviews(reviewsContainer, isCreator, isLoggedIn, entityType, entityId) {
    clearElement(reviewsContainer);
    reviewsContainer.appendChild(createElement("h2", {}, ["Reviews"]));

    const actionContainer = createElement("div", { class: "review-action-container" });

    if (!isCreator && isLoggedIn) {
        const addButton = Button("Add Review", "add-review-btn", {
            click: () => handleAddReview(actionContainer, entityType, entityId)
        }, "buttonx");
        reviewsContainer.appendChild(addButton);
    }

    reviewsContainer.appendChild(actionContainer);

    try {
        const { reviews } = await apiFetch(`/reviews/${entityType}/${entityId}`);
        if (Array.isArray(reviews) && reviews.length > 0) {
            // Fetch usernames for all review user IDs
            const userIds = reviews.map(r => r.userid);
            const userMeta = await fetchUserMeta(userIds);

            reviews.forEach((review) => {
                const reviewerName = userMeta[review.userid]?.username || "Anonymous";

                reviewsContainer.appendChild(
                    ReviewItem(isCreator, {
                        reviewerName,
                        rating: review.rating,
                        comment: review.comment,
                        date: review.date ? new Date(review.date).toLocaleString() : "",
                        onEdit: () => handleEditReview(review.reviewid, entityType, entityId),
                        onDelete: () => handleDeleteReview(review.reviewid, entityType, entityId)
                    })
                );
            });
        } else {
            reviewsContainer.appendChild(
                createElement("p", { class: "no-reviews" }, ["No reviews yet."])
            );
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        reviewsContainer.appendChild(
            createElement("p", { class: "error-message" }, ["Failed to load reviews."])
        );
    }
}

// // Display all reviews for an entity
// async function displayReviews(reviewsContainer, isCreator, isLoggedIn, entityType, entityId) {
//     clearElement(reviewsContainer);
//     reviewsContainer.appendChild(createElement("h2", {}, ["Reviews"]));

//     const actionContainer = createElement("div", { class: "review-action-container" });

//     if (!isCreator && isLoggedIn) {
//         const addButton = Button("Add Review", "add-review-btn", {
//             click: () => handleAddReview(actionContainer, entityType, entityId)
//         }, "buttonx");
//         reviewsContainer.appendChild(addButton);
//     }

//     reviewsContainer.appendChild(actionContainer);

//     try {
//         const { reviews } = await apiFetch(`/reviews/${entityType}/${entityId}`);
//         if (Array.isArray(reviews) && reviews.length > 0) {
//             reviews.forEach((review) => {
//                 reviewsContainer.appendChild(
//                     ReviewItem(isCreator, {
//                         reviewerName: review.userid || "Anonymous",
//                         rating: review.rating,
//                         comment: review.comment,
//                         date: review.date ? new Date(review.date).toLocaleString() : "",
//                         onEdit: () => handleEditReview(review.reviewid, entityType, entityId),
//                         onDelete: () => handleDeleteReview(review.reviewid, entityType, entityId)
//                     })
//                 );
//             });
//         } else {
//             reviewsContainer.appendChild(
//                 createElement("p", { class: "no-reviews" }, ["No reviews yet."])
//             );
//         }
//     } catch (error) {
//         console.error("Error fetching reviews:", error);
//         reviewsContainer.appendChild(
//             createElement("p", { class: "error-message" }, ["Failed to load reviews."])
//         );
//     }
// }

export { displayReviews };
