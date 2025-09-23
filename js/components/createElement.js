function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
        if (key === "events" && value && typeof value === "object") {
            for (const [eventName, handler] of Object.entries(value)) {
                if (typeof handler === "function") {
                    element.addEventListener(eventName, handler);
                }
            }
        } else if ((key === "style" || key === "styles") && value && typeof value === "object") {
            for (const [prop, val] of Object.entries(value)) {
                element.style[prop] = val;
            }
        } else if (key === "class" && typeof value === "string") {
            const classes = value.trim().split(/\s+/);
            if (classes.length) {
                element.classList.add(...classes);
            }
        } else if (key === "dataset" && value && typeof value === "object") {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                element.dataset[dataKey] = dataValue;
            }
        } else if (key in element) {
            // Directly assign known DOM properties like `value`, `type`, etc.
            element[key] = value;
        } else {
            // Fallback to setAttribute
            element.setAttribute(key, value);
        }
    }

    for (const child of [].concat(children)) {
        if (child === null || child === undefined || child === false) continue;

        if (typeof child === "string" || typeof child === "number") {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else {
            console.error("Invalid child passed to createElement:", child);
        }
    }

    return element;
}

export { createElement };


/*
import { createElement } from "./createElement.js";

// Example: A card with a title, button, and dataset/style/events
const card = createElement("div", {
  class: "card highlighted",
  style: { border: "1px solid #333", padding: "10px", backgroundColor: "#fafafa" },
  dataset: { postid: "123", role: "info" },
}, [
  createElement("h2", { class: "card-title" }, ["Hello World"]),  // string child
  createElement("p", {}, ["This card demonstrates all features of createElement."]),
  createElement("input", {
    type: "text",
    value: "Default text",
    class: "card-input",
  }),
  createElement("button", {
    class: "card-btn",
    events: {
      click: () => alert("Button clicked!"),
      mouseover: () => console.log("Hovered"),
    },
    style: { cursor: "pointer", marginTop: "8px" },
  }, ["Click Me"])
]);

document.body.appendChild(card);

*/