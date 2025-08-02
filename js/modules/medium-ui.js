import { createElement } from "../components/createElement.js";
import { apiFetch } from "../api/api.js";
import { Button } from "../components/base/Button.js";

document.body.appendChild(
  createElement("div", { id: "app" }, [
    createElement("h1", {}, ["Medium UI"]),
    createElement("p", {}, ["Some components loaded."]),
    Button("Continue", "continue-btn", {
      click: () => console.log("Continue clicked")
    })
  ])
);
