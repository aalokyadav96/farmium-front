import ReviewItem from './ui/ReviewItem.mjs';
// import Button from "./base/Button.js";

async function displayReviews(content) {
    const timeline = content;

    // createElement("p", {}, ["No reviews available."])
    
    // const reviewButton = Button("Add Review", "add-review-btn", { click: () => alert("Button clicked!"), });
    // timeline.appendChild(reviewButton);

    const reviews = [
        { reviewerName: 'Alice', rating: 5, comment: 'Excellent place!' },
        { reviewerName: 'Bob', rating: 4, comment: 'Great experience.' },
        { reviewerName: 'Charlie', rating: 3, comment: 'It was okay.' },
    ];

    reviews.forEach((review) => {
        timeline.appendChild(ReviewItem(review));
    });

}

export { displayReviews };