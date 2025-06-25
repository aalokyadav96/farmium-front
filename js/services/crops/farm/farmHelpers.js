import { createElement } from "../../../components/createElement.js";

export function createInputField(type, placeholder, value = "", required = false) {
    return createElement("input", {
        type,
        placeholder,
        value,
        required,
    });
}

export function createLabeledField(labelText, inputElement) {
    return createElement("div", { class: "form-group" }, [
        createElement("label", {}, [labelText]),
        inputElement
    ]);
}

export function createForm(fields, onSubmit, submitText = "Submit") {
    const form = createElement("form", { class: "form-container" });
    fields.forEach(field => form.appendChild(field));
    const submitBtn = createElement("button", { type: "submit" }, [submitText]);
    form.appendChild(submitBtn);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await onSubmit(form);
    });

    return form;
}
