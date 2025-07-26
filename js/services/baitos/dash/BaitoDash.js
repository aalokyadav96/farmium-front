import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";
import { baitoEmployerDash } from "./baitoEmployerDash.js";
import { baitoApplicantDash } from "./baitoApplicantDash.js";

export function displayBaitoDash(isLoggedIn, container) {
  while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(createElement("h2", {}, ["🏢 Baito Dashboard"]));
  if (!isLoggedIn) {
    container.appendChild(createElement("p", {}, ["🔒 Please log in to access your dashboard."]));
    return;
  }
  container.append(
    Button("Employer Dashboard", "baito-dash-emp", { click: () => baitoEmployerDash(container) }, "buttonx"),
    Button("Applicant Dashboard", "baito-dash-apc", { click: () => baitoApplicantDash(container) }, "buttonx")
  );
}
