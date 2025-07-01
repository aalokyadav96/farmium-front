function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
        if (key === "events" && typeof value === "object") {
            for (const [eventName, handler] of Object.entries(value)) {
                if (typeof handler === "function") {
                    element.addEventListener(eventName, handler);
                }
            }
        } else if (key === "style" && typeof value === "object") {
            for (const [styleProp, styleValue] of Object.entries(value)) {
                element.style[styleProp] = styleValue;
            }
        } else if (key === "class" && typeof value === "string") {
            element.classList.add(...value.split(" ").filter(Boolean));
        } else if (key === "dataset" && typeof value === "object") {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                element.dataset[dataKey] = dataValue;
            }
        } else {
            element.setAttribute(key, value);
        }
    }

    for (const child of children) {
        if (typeof child === "string" || typeof child === "number") {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else {
            console.error("Invalid child passed to createElement:", child);
        }
    }

    return element;
}

export { createElement };

/**
 * EXAMPLES
 */
/*
const myButton = createElement("button", {
    id: "saveBtn",
    class: "primary large",
    style: {
        backgroundColor: "blue",
        color: "white"
    },
    events: {
        click: () => console.log("Button clicked"),
        mouseover: () => console.log("Hovered")
    }
}, ["Save"]);

document.body.appendChild(myButton);

const button = createElement("button", {
    class: "submit-btn",
    dataset: {
        userId: "abc123",
        mode: "edit"
    },
    events: {
        click: (e) => {
            console.log("User ID:", e.currentTarget.dataset.userId);
        }
    }
}, ["Edit User"]);

document.body.appendChild(button);

*/

// function createElement(tag, attributes, children = []) {
//     const element = document.createElement(tag);

//     // Set attributes
//     if (attributes) {
//         for (const [key, value] of Object.entries(attributes)) {
//             element.setAttribute(key, value);
//         }
//     }

//     // Append children
//     children.forEach((child) => {
//         if (typeof child === "string" || typeof child === "number") {
//             element.appendChild(document.createTextNode(child));
//         } else if (child instanceof Node) {
//             element.appendChild(child);
//         } else {
//             console.error("Invalid child passed to createElement:", child);
//         }
//     });

//     return element;
// }

// export { createElement };