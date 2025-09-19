import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import Modal from "../../components/ui/Modal.mjs"; // your modal component

export function OnboardingModal() {

  const modalInstance = Modal({
    title: "Baito Onboarding",
    size: "large",
    content: () => {
      const container = createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []);
      return container;
    },
    onClose: () => console.log("Onboarding modal closed"),
    closeOnOverlayClick: true
  });

  const container = modalInstance.querySelector("#onboarding-container");
  container.innerHTML = "";

  const state = { step: 0, totalSteps: 5, answers: {} };

  function renderStep(stepFn) {
    container.innerHTML = "";
    stepFn();
    renderProgress();
  }

  function renderProgress() {
    const progressBar = createElement("div", { class: "onboard-progress", style: "margin-bottom:10px;" }, [
      createElement("span", {}, [`Step ${state.step} of ${state.totalSteps}`])
    ]);
    container.prepend(progressBar);
  }

  function startStep() {
    state.step = 1;
    const title = createElement("h2", {}, ["Do you want to Work or Hire?"]);
    const workBtn = Button("Work", "btn-work", { click: () => { state.answers.choice = "Work"; renderStep(workDaysStep); } }, "buttonx");
    const hireBtn = Button("Hire", "btn-hire", { click: () => { state.answers.choice = "Hire"; renderStep(hireStep); } }, "buttonx");
    container.append(title, workBtn, hireBtn);
  }

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
    const kitchenBtn = Button("Kitchen", "btn-kitchen", { click: () => { state.answers.type = "Kitchen"; renderStep(finalStep); } }, "buttonx");
    const deliveryBtn = Button("Delivery", "btn-delivery", { click: () => { state.answers.type = "Delivery"; renderStep(finalStep); } }, "buttonx");
    const cleaningBtn = Button("Cleaning", "btn-cleaning", { click: () => { state.answers.type = "Cleaning"; renderStep(finalStep); } }, "buttonx");
    container.append(title, kitchenBtn, deliveryBtn, cleaningBtn);
  }

  function hireStep() {
    state.step = 2;
    const title = createElement("h2", {}, ["What type of worker are you looking to hire?"]);
    const partTimeBtn = Button("Part-Time", "btn-parttime", { click: () => { state.answers.hireType = "Part-Time"; renderStep(finalStep); } }, "buttonx");
    const fullTimeBtn = Button("Full-Time", "btn-fulltime", { click: () => { state.answers.hireType = "Full-Time"; renderStep(finalStep); } }, "buttonx");
    container.append(title, partTimeBtn, fullTimeBtn);
  }

  function finalStep() {
    state.step = state.totalSteps;
    const title = createElement("h2", {}, ["Thank you! Your preferences have been recorded."]);
    const summary = createElement("pre", {}, [JSON.stringify(state.answers, null, 2)]);
    container.append(title, summary);
  }

  // start onboarding
  renderStep(startStep);
}

export { OnboardingModal as Onboarding};


// import { createElement } from "../../components/createElement";
// import { Button } from "../../components/base/Button.js";

// // call as : Onboarding("onboarding-container");


// export function Onboarding(containerId) {
//   const container = document.getElementById(containerId);
//   container.innerHTML = ""; // allowed because you’re resetting container

//   function renderStep(stepFn) {
//     container.innerHTML = "";
//     stepFn();
//   }

//   function startStep() {
//     const title = createElement("h2", {}, ["Do you want to Work or Hire?"]);
//     const workBtn = Button("Work", "btn-work", { click: () => renderStep(workDaysStep) }, "buttonx");
//     const hireBtn = Button("Hire", "btn-hire", { click: () => renderStep(hireStep) }, "buttonx");
//     container.append(title, workBtn, hireBtn);
//   }

//   function workDaysStep() {
//     const title = createElement("h2", {}, ["How many days do you want to work?"]);
//     const oneDayBtn = Button("1 Day", "btn-1day", { click: () => renderStep(workTypeStep) }, "buttonx");
//     const fewDaysBtn = Button("Few Days", "btn-fewdays", { click: () => renderStep(workTypeStep) }, "buttonx");
//     const longTermBtn = Button("Long Term", "btn-longterm", { click: () => renderStep(workTypeStep) }, "buttonx");
//     container.append(title, oneDayBtn, fewDaysBtn, longTermBtn);
//   }

//   function workTypeStep() {
//     const title = createElement("h2", {}, ["What type of work are you looking for?"]);
//     const kitchenBtn = Button("Kitchen", "btn-kitchen", { click: () => renderStep(finalStep) }, "buttonx");
//     const deliveryBtn = Button("Delivery", "btn-delivery", { click: () => renderStep(finalStep) }, "buttonx");
//     const cleaningBtn = Button("Cleaning", "btn-cleaning", { click: () => renderStep(finalStep) }, "buttonx");
//     container.append(title, kitchenBtn, deliveryBtn, cleaningBtn);
//   }

//   function hireStep() {
//     const title = createElement("h2", {}, ["What type of worker are you looking to hire?"]);
//     const partTimeBtn = Button("Part-Time", "btn-parttime", { click: () => renderStep(finalStep) }, "buttonx");
//     const fullTimeBtn = Button("Full-Time", "btn-fulltime", { click: () => renderStep(finalStep) }, "buttonx");
//     container.append(title, partTimeBtn, fullTimeBtn);
//   }

//   function finalStep() {
//     const title = createElement("h2", {}, ["Thank you! Your preferences have been recorded."]);
//     container.append(title);
//   }

//   // start flow
//   renderStep(startStep);
// }
