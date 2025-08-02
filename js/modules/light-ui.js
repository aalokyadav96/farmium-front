import { createElement } from "../components/createElement.js";
import { apiFetch } from "../api/api.js";

document.body.appendChild(
  createElement("div", { id: "app" }, [
    createElement("h1", {}, ["Light UI"]),
    createElement("p", {}, ["Optimized for low bandwidth or mobile."])
  ])
);
