import { login, signup } from "../../services/auth/authService.js";
import { getState, subscribeDeep } from "../../state/state.js";
import { createElement } from "../../components/createElement.js";

// --- Main entry
export function Auth(isL, contentContainer) {
  contentContainer.innerHTML = '';
  renderAuthSection(isL, contentContainer);

  // Reactive update when login/logout
  subscribeDeep("token", () => renderAuthSection(isL, contentContainer));
}

// --- Core UI Renderer
function renderAuthSection(isL, contentContainer) {
  contentContainer.innerHTML = '';

  // If user is already logged in, redirect them
  if (getState("token")) {
    window.location.href = "/home";
    return;
  }

  const wrapper = createElement("div", { class: "auth-wrapper" });
  const authBox = createElement("div", { class: "auth-box" });

  authBox.appendChild(createLoginForm());
  authBox.appendChild(createElement("div", { class: "auth-divider" }, ["or"]));
  authBox.appendChild(createSignupForm());

  wrapper.appendChild(authBox);
  contentContainer.appendChild(wrapper);
}

// --- Login form
function createLoginForm() {
  const section = createElement("section", { class: "auth-section" });
  const title = createElement("h2", { class: "auth-title" }, ["Log In"]);

  const form = createElement("form", { class: "auth-form" });
  form.append(
    inputField("text", "Username", "login-username", "username"),
    inputField("password", "Password", "login-password", "current-password"),
    submitButton("Login")
  );

  form.addEventListener("submit", login);
  section.append(title, form);
  return section;
}

// --- Signup form
function createSignupForm() {
  const section = createElement("section", { class: "auth-section" });
  const title = createElement("h2", { class: "auth-title" }, ["Sign Up"]);

  const form = createElement("form", { class: "auth-form" });
  const usernameInput = inputField("text", "Username", "signup-username", "username");
  const emailInput = inputField("email", "Email", "signup-email", "email");
  const passwordInput = inputField("password", "Password", "signup-password", "new-password");

  const checkbox = createElement("input", { type: "checkbox", id: "signup-terms", required: true });
  const termsLabel = createElement("label", { class: "auth-terms" }, [" I agree to the Terms & Conditions"]);
  termsLabel.insertBefore(checkbox, termsLabel.firstChild);

  form.append(usernameInput, emailInput, passwordInput, termsLabel, submitButton("Signup"));
  form.addEventListener("submit", (e) => {
    if (!checkbox.checked) {
      e.preventDefault();
      alert("You must agree to the Terms & Conditions.");
      return;
    }
    signup(e);
  });

  section.append(title, form);
  return section;
}

// --- Helper: Input
function inputField(type, placeholder, id, autocomplete = "") {
  const attrs = { type, id, placeholder, required: true };
  if (autocomplete) attrs.autocomplete = autocomplete;
  return createElement("input", attrs);
}

// --- Helper: Button
function submitButton(label) {
  return createElement("button", { type: "submit" }, [label]);
}
