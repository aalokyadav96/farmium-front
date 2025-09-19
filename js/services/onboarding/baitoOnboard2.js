import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import Modal from "../../components/ui/Modal.mjs";

export function OnboardingModal() {

  const modalInstance = Modal({
    title: "Baito Onboarding",
    size: "large",
    content: () => createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []),
    onClose: () => console.log("Onboarding modal closed"),
    closeOnOverlayClick: true
  });

  const container = modalInstance.querySelector("#onboarding-container");
  container.innerHTML = "";

  const state = { step: 0, totalSteps: 5, answers: {} };

  function renderStep(stepFn) {
    container.innerHTML = "";
    stepFn();
    renderProgressBar();
  }

  function renderProgressBar() {
    const progressContainer = createElement("div", { class: "progress-container", style: "margin-bottom:10px; width:100%; background:#eee; height:8px; border-radius:4px;" });
    const fill = createElement("div", {
      class: "progress-fill",
      style: `width:${(state.step / state.totalSteps) * 100}%; background:#4caf50; height:100%; border-radius:4px; transition: width 0.3s;`
    });
    progressContainer.appendChild(fill);
    container.prepend(progressContainer);
  }

  // ---- Steps ----
  function startStep() {
    state.step = 1;
    const title = createElement("h2", {}, ["Do you want to Work or Hire?"]);
    const workBtn = Button("Work", "btn-work", { click: () => { state.answers.choice = "Work"; renderStep(workDaysStep); } }, "buttonx");
    const hireBtn = Button("Hire", "btn-hire", { click: () => { state.answers.choice = "Hire"; renderStep(hireStep); } }, "buttonx");
    container.append(title, workBtn, hireBtn);
  }

  // --- Work Path ---
  function workDaysStep() {
    state.step = 2;
    const title = createElement("h2", {}, ["How many days do you want to work?"]);
    const oneDayBtn = Button("1 Day", "btn-1day", { click: () => { state.answers.days = "1"; renderStep(workTypeStep); } }, "buttonx");
    const fewDaysBtn = Button("Few Days", "btn-fewdays", { click: () => { state.answers.days = "Few"; renderStep(workTypeStep); } }, "buttonx");
    const longTermBtn = Button("Long Term", "btn-longterm", { click: () => { state.answers.days = "Long"; renderStep(workTypeStep); } }, "buttonx");
    container.append(title, oneDayBtn, fewDaysBtn, longTermBtn);
  }

  function workTypeStep() {
    state.step = 3;
    const title = createElement("h2", {}, ["Select work type"]);
    const kitchenBtn = Button("Kitchen", "btn-kitchen", { click: () => { state.answers.type = "Kitchen"; renderStep(workShiftStep); } }, "buttonx");
    const deliveryBtn = Button("Delivery", "btn-delivery", { click: () => { state.answers.type = "Delivery"; renderStep(workShiftStep); } }, "buttonx");
    const cleaningBtn = Button("Cleaning", "btn-cleaning", { click: () => { state.answers.type = "Cleaning"; renderStep(workShiftStep); } }, "buttonx");
    container.append(title, kitchenBtn, deliveryBtn, cleaningBtn);
  }

  function workShiftStep() {
    state.step = 4;
    const title = createElement("h2", {}, ["Preferred shift timing?"]);
    const morningBtn = Button("Morning", "btn-morning", { click: () => { state.answers.shift = "Morning"; renderStep(workLocationStep); } }, "buttonx");
    const afternoonBtn = Button("Afternoon", "btn-afternoon", { click: () => { state.answers.shift = "Afternoon"; renderStep(workLocationStep); } }, "buttonx");
    const nightBtn = Button("Night", "btn-night", { click: () => { state.answers.shift = "Night"; renderStep(workLocationStep); } }, "buttonx");
    container.append(title, morningBtn, afternoonBtn, nightBtn);
  }

  function workLocationStep() {
    state.step = 5;
    const title = createElement("h2", {}, ["Preferred work location?"]);
    const nearBtn = Button("Near Me", "btn-near", { click: () => { state.answers.location = "Near"; renderStep(finalStep); } }, "buttonx");
    const remoteBtn = Button("Remote", "btn-remote", { click: () => { state.answers.location = "Remote"; renderStep(finalStep); } }, "buttonx");
    container.append(title, nearBtn, remoteBtn);
  }

  // --- Hire Path ---
  function hireStep() {
    state.step = 2;
    const title = createElement("h2", {}, ["What type of worker are you looking to hire?"]);
    const partTimeBtn = Button("Part-Time", "btn-parttime", { click: () => { state.answers.hireType = "Part-Time"; renderStep(hirePayStep); } }, "buttonx");
    const fullTimeBtn = Button("Full-Time", "btn-fulltime", { click: () => { state.answers.hireType = "Full-Time"; renderStep(hirePayStep); } }, "buttonx");
    container.append(title, partTimeBtn, fullTimeBtn);
  }

  function hirePayStep() {
    state.step = 3;
    const title = createElement("h2", {}, ["Expected pay range?"]);
    const lowBtn = Button("Low", "btn-low", { click: () => { state.answers.pay = "Low"; renderStep(hireLocationStep); } }, "buttonx");
    const midBtn = Button("Medium", "btn-mid", { click: () => { state.answers.pay = "Medium"; renderStep(hireLocationStep); } }, "buttonx");
    const highBtn = Button("High", "btn-high", { click: () => { state.answers.pay = "High"; renderStep(hireLocationStep); } }, "buttonx");
    container.append(title, lowBtn, midBtn, highBtn);
  }

  function hireLocationStep() {
    state.step = 4;
    const title = createElement("h2", {}, ["Preferred work location for hired staff?"]);
    const nearBtn = Button("Near Me", "btn-near", { click: () => { state.answers.location = "Near"; renderStep(finalStep); } }, "buttonx");
    const remoteBtn = Button("Remote", "btn-remote", { click: () => { state.answers.location = "Remote"; renderStep(finalStep); } }, "buttonx");
    container.append(title, nearBtn, remoteBtn);
  }

  // --- Final Step ---
  function finalStep() {
    state.step = state.totalSteps;
    const title = createElement("h2", {}, ["Thank you! Your preferences have been recorded."]);
    const summary = createElement("pre", {}, [JSON.stringify(state.answers, null, 2)]);
    container.append(title, summary);
    renderProgressBar();
  }

  // start onboarding
  renderStep(startStep);
}

export { OnboardingModal as Onboarding };

// import { createElement } from "../../components/createElement.js";
// import { Button } from "../../components/base/Button.js";
// import Modal from "../../components/ui/Modal.mjs"; // your modal component

// export function OnboardingModal() {

//   const modalInstance = Modal({
//     title: "Baito Onboarding",
//     size: "large",
//     content: () => {
//       const container = createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []);
//       return container;
//     },
//     onClose: () => console.log("Onboarding modal closed"),
//     closeOnOverlayClick: true
//   });

//   const container = modalInstance.querySelector("#onboarding-container");
//   container.innerHTML = "";

//   const state = { step: 0, totalSteps: 5, answers: {} };

//   function renderStep(stepFn) {
//     container.innerHTML = "";
//     stepFn();
//     renderProgressBar();
//   }

//   function renderProgressBar() {
//     const progressContainer = createElement("div", { class: "progress-container", style: "margin-bottom:10px; width:100%; background:#eee; height:8px; border-radius:4px;" });
//     const fill = createElement("div", {
//       class: "progress-fill",
//       style: `width:${(state.step / state.totalSteps) * 100}%; background:#4caf50; height:100%; border-radius:4px; transition: width 0.3s;`
//     });
//     progressContainer.appendChild(fill);
//     container.prepend(progressContainer);
//   }

//   function startStep() {
//     state.step = 1;
//     const title = createElement("h2", {}, ["Do you want to Work or Hire?"]);
//     const workBtn = Button("Work", "btn-work", { click: () => { state.answers.choice = "Work"; renderStep(workDaysStep); } }, "buttonx");
//     const hireBtn = Button("Hire", "btn-hire", { click: () => { state.answers.choice = "Hire"; renderStep(hireStep); } }, "buttonx");
//     container.append(title, workBtn, hireBtn);
//   }

//   function workDaysStep() {
//     state.step = 2;
//     const title = createElement("h2", {}, ["How many days do you want to work?"]);
//     const oneDayBtn = Button("1 Day", "btn-1day", { click: () => { state.answers.days = "1"; renderStep(workTypeStep); } }, "buttonx");
//     const fewDaysBtn = Button("Few Days", "btn-fewdays", { click: () => { state.answers.days = "Few"; renderStep(workTypeStep); } }, "buttonx");
//     const longTermBtn = Button("Long Term", "btn-longterm", { click: () => { state.answers.days = "Long"; renderStep(workTypeStep); } }, "buttonx");
//     container.append(title, oneDayBtn, fewDaysBtn, longTermBtn);
//   }

//   function workTypeStep() {
//     state.step = 3;
//     const title = createElement("h2", {}, ["Select work type"]);
//     const kitchenBtn = Button("Kitchen", "btn-kitchen", { click: () => { state.answers.type = "Kitchen"; renderStep(finalStep); } }, "buttonx");
//     const deliveryBtn = Button("Delivery", "btn-delivery", { click: () => { state.answers.type = "Delivery"; renderStep(finalStep); } }, "buttonx");
//     const cleaningBtn = Button("Cleaning", "btn-cleaning", { click: () => { state.answers.type = "Cleaning"; renderStep(finalStep); } }, "buttonx");
//     container.append(title, kitchenBtn, deliveryBtn, cleaningBtn);
//   }

//   function hireStep() {
//     state.step = 2;
//     const title = createElement("h2", {}, ["What type of worker are you looking to hire?"]);
//     const partTimeBtn = Button("Part-Time", "btn-parttime", { click: () => { state.answers.hireType = "Part-Time"; renderStep(finalStep); } }, "buttonx");
//     const fullTimeBtn = Button("Full-Time", "btn-fulltime", { click: () => { state.answers.hireType = "Full-Time"; renderStep(finalStep); } }, "buttonx");
//     container.append(title, partTimeBtn, fullTimeBtn);
//   }

//   function finalStep() {
//     state.step = state.totalSteps;
//     const title = createElement("h2", {}, ["Thank you! Your preferences have been recorded."]);
//     const summary = createElement("pre", {}, [JSON.stringify(state.answers, null, 2)]);
//     container.append(title, summary);
//     renderProgressBar();
//   }

//   // start onboarding
//   renderStep(startStep);
// }

// export { OnboardingModal as Onboarding };
