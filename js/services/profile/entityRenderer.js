/** Render fetched data inside the tab container. */
function renderEntityData(container, data, entityType) {
    container.innerHTML = ""; // Clear previous content
    if (!data || data.length === 0) {
        container.textContent = `No ${entityType} data found.`;
        return;
    }

    console.log(entityType, data);

    const list = document.createElement("ul");
    data.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.appendChild(createEntityLink(item, entityType));
        list.appendChild(listItem);
    });

    container.appendChild(list);
}

// /** Create links for entities inside tabs. */
// function createEntityLink(item, entityType) {
//     const entityLink = document.createElement("a");

//     switch (entityType) {
//         case "place":
//             entityLink.href = `/place/${item.entity_id}`;
//             break;
//         case "event":
//             entityLink.href = `/event/${item.entity_id}`;
//             break;
//         case "feedpost":
//             entityLink.href = `/post/${item.entity_id}`;
//             break;
//         default:
//             entityLink.href = "#";
//     }

//     entityLink.textContent = `Post ID: ${item.entity_id} - Created At: ${new Date(
//         item.created_at
//     ).toLocaleString()}`;

//     return entityLink;
// }

// /** Create links for entities inside tabs. */
// function createEntityLink(item, entityType) {
//     const entityLink = document.createElement("a");

//     switch (entityType) {
//         case "place":
//             entityLink.href = `/place/${item.entity_id}`;
//             break;
//         case "event":
//             entityLink.href = `/event/${item.entity_id}`;
//             break;
//         case "feedpost":
//             entityLink.href = `/post/${item.entity_id}`;
//             break;
//         default:
//             entityLink.href = "#";
//     }

//     let label = "Post ID";
//     switch (entityType) {
//         case "media":
//             label = "Media ID";
//             break;
//         case "ticket":
//             label = "Ticket ID";
//             break;
//         case "merch":
//             label = "Merch ID";
//             break;
//         case "review":
//             label = "Review ID";
//             break;
//         case "comment":
//             label = "Comment ID";
//             break;
//         case "like":
//             label = "Like ID";
//             break;
//         case "favourite":
//             label = "Favourite ID";
//             break;
//         case "booking":
//             label = "Booking ID";
//             break;
//         case "blogpost":
//             label = "Blogpost ID";
//             break;
//         case "collection":
//             label = "Collection ID";
//             break;
//     }

//     entityLink.textContent = `${label}: ${item.entity_id} - Created At: ${new Date(
//         item.created_at
//     ).toLocaleString()}`;

//     return entityLink;
// }

function createEntityLink(item, entityType) {
    // Create card container
    const cardContainer = document.createElement("div");
    cardContainer.style.border = "1px solid #ccc";
    cardContainer.style.borderRadius = "8px";
    cardContainer.style.padding = "16px";
    cardContainer.style.margin = "8px";
    cardContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    // cardContainer.style.backgroundColor = "#f9f9f9";

    let label = "Post ID";
    switch (entityType) {
        case "media":
            label = "Media ID";
            break;
        case "ticket":
            label = "Ticket ID";
            break;
        case "merch":
            label = "Merch ID";
            break;
        case "review":
            label = "Review ID";
            break;
        case "comment":
            label = "Comment ID";
            break;
        case "like":
            label = "Like ID";
            break;
        case "favourite":
            label = "Favourite ID";
            break;
        case "booking":
            label = "Booking ID";
            break;
        case "blogpost":
            label = "Blogpost ID";
            break;
        case "collection":
            label = "Collection ID";
            break;
    }

    // Create paragraph for card content
    const cardContent = document.createElement("p");
    cardContent.textContent = `${label}: ${item.entity_id} - Created At: ${new Date(
        item.created_at
    ).toLocaleString()}`;
    cardContent.onclick = () => {
        navigator.clipboard.writeText(item.entity_id)
            .then(() => {
                alert("Entity ID copied to clipboard!");
            })
            .catch((error) => {
                console.error("Failed to copy text: ", error);
            });
    };

    cardContainer.appendChild(cardContent);

    // Create a separate link
    const entityLink = document.createElement("a");
    entityLink.href = "#"; // Default link, to be updated based on entityType
    switch (entityType) {
        case "place":
            entityLink.href = `/place/${item.entity_id}`;
            break;
        case "event":
            entityLink.href = `/event/${item.entity_id}`;
            break;
        case "feedpost":
            entityLink.href = `/feedpost/${item.entity_id}`;
            break;
        case "merch":
            entityLink.href = `/merch/${item.entity_id}`;
            break;
    }
    entityLink.textContent = "View Details";
    entityLink.style.color = "#007bff";
    entityLink.style.textDecoration = "none";

    // Add hover effect for link
    entityLink.onmouseover = () => (entityLink.style.textDecoration = "underline");
    entityLink.onmouseout = () => (entityLink.style.textDecoration = "none");

    cardContainer.appendChild(entityLink);

    return cardContainer;
}

// function createEntityLink(item, entityType) {
//     // Create card container
//     const cardContainer = document.createElement("div");
//     cardContainer.style.border = "1px solid #ccc";
//     cardContainer.style.borderRadius = "8px";
//     cardContainer.style.padding = "16px";
//     cardContainer.style.margin = "8px";
//     cardContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

//     let label = "Post ID";
//     switch (entityType) {
//         case "media":
//             label = "Media ID";
//             break;
//         case "ticket":
//             label = "Ticket ID";
//             break;
//         case "merch":
//             label = "Merch ID";
//             break;
//         case "review":
//             label = "Review ID";
//             break;
//         case "comment":
//             label = "Comment ID";
//             break;
//         case "like":
//             label = "Like ID";
//             break;
//         case "favourite":
//             label = "Favourite ID";
//             break;
//         case "booking":
//             label = "Booking ID";
//             break;
//         case "blogpost":
//             label = "Blogpost ID";
//             break;
//         case "collection":
//             label = "Collection ID";
//             break;
//     }

//     // Create paragraph for card content
//     const cardContent = document.createElement("p");
//     cardContent.textContent = `${label}: ${item.entity_id} - Created At: ${new Date(
//         item.created_at
//     ).toLocaleString()}`;
//     cardContent.onclick = () => {
//         navigator.clipboard.writeText(item.entity_id)
//             .then(() => {
//                 alert("Entity ID copied to clipboard!");
//             })
//             .catch((error) => {
//                 console.error("Failed to copy text: ", error);
//             });
//     };

//     cardContainer.appendChild(cardContent);

//     // Create a separate link
//     const entityLink = document.createElement("a");
//     entityLink.href = "#"; // Default link, to be updated based on entityType
//     switch (entityType) {
//         case "place":
//             entityLink.href = `/place/${item.entity_id}`;
//             break;
//         case "event":
//             entityLink.href = `/event/${item.entity_id}`;
//             break;
//         case "feedpost":
//             entityLink.href = `/post/${item.entity_id}`;
//             break;
//         case "merch":
//             entityLink.href = `/merch/${item.entity_id}`;
//             break;
//     }

//     // If both item_type and item_id are non-empty, append them as path segments
//     if (item.item_type && item.item_id) {
//         entityLink.href += `/${item.item_type}/${item.item_id}`;
//     }

//     entityLink.textContent = "View Details";
//     entityLink.style.color = "#007bff";
//     entityLink.style.textDecoration = "none";

//     // Add hover effect for link
//     entityLink.onmouseover = () => (entityLink.style.textDecoration = "underline");
//     entityLink.onmouseout = () => (entityLink.style.textDecoration = "none");

//     cardContainer.appendChild(entityLink);

//     return cardContainer;
// }

export { renderEntityData };
