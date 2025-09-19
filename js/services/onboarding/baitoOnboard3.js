// onboarding/baitoOnboard.js
import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import Modal from "../../components/ui/Modal.mjs";

/**
 * Usage: import { Onboarding } from ".../baitoOnboard.js";
 * then call Onboarding() to open the modal.
 */
export function Onboarding() {
  // If already completed, do not open modal
  const saved = localStorage.getItem("baitoOnboarding");
  if (saved) {
    console.log("Onboarding skipped — already completed:", JSON.parse(saved));
    return;
  }

  // --- Stepper component (segmented) ---
  function Stepper({ total, current }) {
    const wrap = createElement("div", {
      class: "stepper-wrap",
      role: "progressbar",
      "aria-valuemin": "1",
      "aria-valuemax": String(total),
      "aria-valuenow": String(current),
      style: "display:flex;gap:8px;margin-bottom:14px;"
    }, []);
    for (let i = 1; i <= total; i++) {
      const stateCls = i < current ? "completed" : i === current ? "active" : "pending";
      const stepEl = createElement("div", {
        class: `step-seg ${stateCls}`,
        "aria-label": `Step ${i} ${stateCls}`,
        style: `
          flex:1; height:10px; border-radius:6px;
          background:${i < current ? "#4caf50" : i === current ? "#1976d2" : "#e0e0e0"};
          transition: background 220ms ease, width 220ms ease;
        `
      }, []);
      wrap.appendChild(stepEl);
    }
    return wrap;
  }

  // --- Create modal ---
  const modalEl = Modal({
    title: "Baito Onboarding",
    size: "large",
    content: () => createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []),
    closeOnOverlayClick: false
  });

  // modal returns the DOM node (per your Modal impl)
  const container = modalEl.querySelector("#onboarding-container");
  container.innerHTML = "";

  // --- state & history stack ---
  const state = {
    step: 0,
    totalSteps: 0,
    answers: {},
    path: "work",           // "work" or "hire"
    history: []            // stack of { fn, step } for reliable back navigation
  };

  // helper to push current step function to history before navigating away
  function pushHistory(fn) {
    // push a shallow snapshot of step / answers if needed
    state.history.push({ fn, step: state.step });
  }

  // helper to go back one step
  function goBack() {
    const prev = state.history.pop();
    if (!prev) return; // nothing to go back to
    state.step = prev.step;
    prev.fn();
  }

  // generic renderer for options + optional "edit" mode support
  function renderOptions({ title, options, onChoose, showBack = true, canEdit = false }) {
    container.innerHTML = "";

    // stepper
    container.appendChild(Stepper({ total: state.totalSteps, current: state.step }));

    // title
    container.appendChild(createElement("h2", {}, [title]));

    // option buttons
    const optsWrap = createElement("div", { class: "opts-wrap", style: "display:flex;flex-direction:column;gap:8px;margin:12px 0;" }, []);
    Object.entries(options).forEach(([label, value]) => {
      const btn = Button(label, `btn-${label.replace(/\s+/g, "-").toLowerCase()}`, {
        click: () => {
          // push the current rendering fn (caller) into history for Back
          pushHistory(onChoose.__caller__);
          // call the provided onChoose handler
          onChoose(value);
        }
      }, "buttonx");
      optsWrap.appendChild(btn);
    });
    container.appendChild(optsWrap);

    // back button
    if (showBack && state.history.length > 0) {
      const backBtn = Button("Back", "btn-back", { click: () => goBack() }, "button-back");
      container.appendChild(backBtn);
    }
  }

  // small helper to mark handlers with their caller fn so pushHistory can use it
  function makeOnChoose(callerFn, handler) {
    handler.__caller__ = callerFn;
    return handler;
  }

  // --- Step functions ---
  function startStep() {
    state.step = 1;
    // totalSteps set after path selection
    renderOptions({
      title: "Do you want to Work or Hire?",
      options: { Work: "work", Hire: "hire" },
      onChoose: makeOnChoose(startStep, (choice) => {
        state.answers.choice = choice;
        state.path = choice;
        // set total steps per path (work: 6, hire: 5)
        state.totalSteps = choice === "work" ? 6 : 5;
        state.step = 2;
        // proceed
        if (choice === "work") workDaysStep(); else hireWorkerTypeStep();
      }),
      showBack: false
    });
  }

  // ----- Work path -----
  function workDaysStep() {
    state.step = 2;
    renderOptions({
      title: "How many days do you want to work?",
      options: {
        "1 Day": "1",
        "Few Days": "few",
        "Long Term": "long",
        "Weekend Only": "weekend"
      },
      onChoose: makeOnChoose(workDaysStep, (val) => {
        state.answers.days = val;
        state.step = 3;
        workTypeStep();
      })
    });
  }

  function workTypeStep() {
    state.step = 3;
    renderOptions({
      title: "Select work type",
      options: {
        Kitchen: "kitchen",
        Delivery: "delivery",
        Cleaning: "cleaning",
        Retail: "retail",
        "Event Staff": "event"
      },
      onChoose: makeOnChoose(workTypeStep, (val) => {
        state.answers.type = val;
        state.step = 4;
        workShiftStep();
      })
    });
  }

  function workShiftStep() {
    state.step = 4;
    renderOptions({
      title: "Preferred shift timing?",
      options: {
        Morning: "morning",
        Afternoon: "afternoon",
        Night: "night",
        Flexible: "flexible"
      },
      onChoose: makeOnChoose(workShiftStep, (val) => {
        state.answers.shift = val;
        state.step = 5;
        workLocationStep();
      })
    });
  }

  function workLocationStep() {
    state.step = 5;
    renderOptions({
      title: "Preferred work location?",
      options: {
        "Near Me": "near",
        Remote: "remote",
        "Specific Area": "specific"
      },
      onChoose: makeOnChoose(workLocationStep, (val) => {
        state.answers.location = val;
        state.step = 6;
        workPayStep();
      })
    });
  }

  function workPayStep() {
    state.step = 6;
    renderOptions({
      title: "What pay range are you expecting?",
      options: {
        "Below 1000/day": "low",
        "1000–2000/day": "medium",
        "2000+/day": "high"
      },
      onChoose: makeOnChoose(workPayStep, (val) => {
        state.answers.pay = val;
        state.step = state.totalSteps; // go to summary
        summaryStep();
      })
    });
  }

  // ----- Hire path -----
  function hireWorkerTypeStep() {
    state.step = 2;
    renderOptions({
      title: "What type of worker are you looking to hire?",
      options: {
        "Part-Time": "parttime",
        "Full-Time": "fulltime",
        Temporary: "temp"
      },
      onChoose: makeOnChoose(hireWorkerTypeStep, (val) => {
        state.answers.hireType = val;
        state.step = 3;
        hireShiftStep();
      })
    });
  }

  function hireShiftStep() {
    state.step = 3;
    renderOptions({
      title: "What shift do you need covered?",
      options: {
        Morning: "morning",
        Afternoon: "afternoon",
        Night: "night",
        Flexible: "flexible"
      },
      onChoose: makeOnChoose(hireShiftStep, (val) => {
        state.answers.shift = val;
        state.step = 4;
        hirePayStep();
      })
    });
  }

  function hirePayStep() {
    state.step = 4;
    renderOptions({
      title: "What pay range are you offering?",
      options: {
        Low: "low",
        Medium: "medium",
        High: "high"
      },
      onChoose: makeOnChoose(hirePayStep, (val) => {
        state.answers.pay = val;
        state.step = 5;
        hireLocationStep();
      })
    });
  }

  function hireLocationStep() {
    state.step = 5;
    renderOptions({
      title: "Where is the job located?",
      options: {
        "Near Me": "near",
        Remote: "remote",
        "Specific Area": "specific"
      },
      onChoose: makeOnChoose(hireLocationStep, (val) => {
        state.answers.location = val;
        state.step = state.totalSteps; // go to summary
        summaryStep();
      })
    });
  }

  // ---- Summary ----
  function goToEditStep(stepName) {
    // Map a friendly stepName to step function
    const map = {
      choice: startStep,
      days: workDaysStep,
      type: workTypeStep,
      shift: workShiftStep,
      location: workLocationStep,
      pay: workPayStep,
      hireType: hireWorkerTypeStep,
      hireShift: hireShiftStep,
      hirePay: hirePayStep,
      hireLocation: hireLocationStep
    };
    const fn = map[stepName];
    if (!fn) return;
    // push current summary into history so user can Back from edit
    pushHistory(summaryStep);
    // set appropriate step index (find function's step logic)
    // We will set a safe step number but the step functions set state.step themselves.
    fn();
  }

  function summaryStep() {
    container.innerHTML = "";
    // final step index = totalSteps
    state.step = state.totalSteps;
    container.appendChild(Stepper({ total: state.totalSteps, current: state.step }));

    container.appendChild(createElement("h2", {}, ["Summary of your choices:"]));

    // build summary lines with edit buttons
    const rows = [];
    const addRow = (label, key, editKey) => {
      const value = state.answers[key] ?? "—";
      const row = createElement("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;" }, [
        createElement("div", {}, [createElement("strong", {}, [label + ": "]), ` ${value}`]),
        Button("Edit", `edit-${key}`, {
          click: () => goToEditStep(editKey || key)
        }, "button-link")
      ]);
      rows.push(row);
    };

    if (state.path === "work") {
      addRow("Choice", "choice", "choice");
      addRow("Days", "days", "days");
      addRow("Type", "type", "type");
      addRow("Shift", "shift", "shift");
      addRow("Location", "location", "location");
      addRow("Pay", "pay", "pay");
    } else {
      addRow("Choice", "choice", "choice");
      addRow("Worker Type", "hireType", "hireType");
      addRow("Shift", "shift", "hireShift");
      addRow("Pay", "pay", "hirePay");
      addRow("Location", "location", "hireLocation");
    }

    const listWrap = createElement("div", { style: "margin:8px 0 18px 0;" }, rows);
    container.appendChild(listWrap);

    // Finish button: save to localStorage and close modal
    const finishBtn = Button("Finish", "btn-finish", {
      click: () => {
        localStorage.setItem("baitoOnboarding", JSON.stringify(state.answers));
        console.log("Baito onboarding saved:", state.answers);
        modalEl.remove();
      }
    }, "buttonx");
    container.appendChild(finishBtn);

    // Back button (to previous step) if history exists
    if (state.history.length > 0) {
      const backBtn = Button("Back", "btn-back", { click: () => goBack() }, "button-back");
      container.appendChild(backBtn);
    }
  }

  // Start
  state.totalSteps = 5; // default until choice
  startStep();
}

// import { createElement } from "../../components/createElement.js";
// import { Button } from "../../components/base/Button.js";
// import Modal from "../../components/ui/Modal.mjs";

// export function OnboardingModal() {
//   // --- Stepper Component ---
//   function Stepper({ steps, currentStep }) {
//     const container = createElement("div", { class: "stepper", style: "display:flex; gap:6px; margin-bottom:15px;" }, []);
//     steps.forEach((_, index) => {
//       const stepEl = createElement("div", {
//         style: `
//           flex:1; height:10px; border-radius:5px;
//           background:${index + 1 < currentStep ? "#4caf50" : index + 1 === currentStep ? "#2196F3" : "#ddd"};
//           transition: background 0.3s;
//         `
//       });
//       container.appendChild(stepEl);
//     });
//     return container;
//   }

//   // --- Modal Setup ---
//   const modalInstance = Modal({
//     title: "Baito Onboarding",
//     size: "large",
//     content: () => createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []),
//     onClose: () => console.log("Onboarding modal closed"),
//     closeOnOverlayClick: false
//   });

//   const container = modalInstance.querySelector("#onboarding-container");
//   container.innerHTML = "";

//   // --- State ---
//   const state = {
//     step: 0,
//     answers: {},
//     path: "work",
//     totalSteps: 0,
//     history: [] // stack of previous step functions
//   };

//   // --- Utility: render step content ---
//   function renderStepContent(titleText, options, callback) {
//     container.innerHTML = "";

//     // Stepper
//     container.appendChild(Stepper({ steps: new Array(state.totalSteps).fill(""), currentStep: state.step }));

//     // Title
//     container.appendChild(createElement("h2", {}, [titleText]));

//     // Options
//     Object.entries(options).forEach(([label, value]) => {
//       const btn = Button(label, `btn-${label}`, {
//         click: () => {
//           state.history.push(callback); // push current step function for back
//           callback(value);
//         }
//       }, "buttonx");
//       container.appendChild(btn);
//     });

//     // Back Button
//     if (state.history.length > 0) {
//       const backBtn = Button("Back", "btn-back", {
//         click: () => {
//           const prev = state.history.pop();
//           state.step = Math.max(1, state.step - 1);
//           prev(); // re-render previous step
//         }
//       }, "button-back");
//       container.appendChild(backBtn);
//     }
//   }

//   // --- Step Functions ---
//   function startStep() {
//     state.step = 1;
//     renderStepContent("Do you want to Work or Hire?", {
//       Work: "work",
//       Hire: "hire"
//     }, choice => {
//       state.answers.choice = choice;
//       state.path = choice.toLowerCase();
//       state.totalSteps = state.path === "work" ? 6 : 5; // adjust path length
//       state.step++;
//       state.path === "work" ? workDaysStep() : hireWorkerTypeStep();
//     });
//   }

//   // --- Work Path ---
//   function workDaysStep() {
//     renderStepContent("How many days do you want to work?", {
//       "1 Day": "1",
//       "Few Days": "few",
//       "Long Term": "long",
//       "Weekend Only": "weekend"
//     }, value => {
//       state.answers.days = value;
//       state.step++;
//       workTypeStep();
//     });
//   }

//   function workTypeStep() {
//     renderStepContent("Select work type", {
//       Kitchen: "kitchen",
//       Delivery: "delivery",
//       Cleaning: "cleaning",
//       Retail: "retail",
//       "Event Staff": "event"
//     }, value => {
//       state.answers.type = value;
//       state.step++;
//       workShiftStep();
//     });
//   }

//   function workShiftStep() {
//     renderStepContent("Preferred shift timing?", {
//       Morning: "morning",
//       Afternoon: "afternoon",
//       Night: "night",
//       "Flexible": "flexible"
//     }, value => {
//       state.answers.shift = value;
//       state.step++;
//       workLocationStep();
//     });
//   }

//   function workLocationStep() {
//     renderStepContent("Preferred work location?", {
//       "Near Me": "near",
//       Remote: "remote",
//       "Specific Area": "specific"
//     }, value => {
//       state.answers.location = value;
//       state.step++;
//       expectedPayStep();
//     });
//   }

//   function expectedPayStep() {
//     renderStepContent("What pay range are you expecting?", {
//       "Below 1000¥/day": "low",
//       "1000–2000¥/day": "medium",
//       "2000¥+/day": "high"
//     }, value => {
//       state.answers.pay = value;
//       state.step++;
//       summaryStep();
//     });
//   }

//   // --- Hire Path ---
//   function hireWorkerTypeStep() {
//     renderStepContent("What type of worker are you looking to hire?", {
//       "Part-Time": "parttime",
//       "Full-Time": "fulltime",
//       "Temporary": "temp"
//     }, value => {
//       state.answers.hireType = value;
//       state.step++;
//       hireShiftStep();
//     });
//   }

//   function hireShiftStep() {
//     renderStepContent("What shift do you need covered?", {
//       Morning: "morning",
//       Afternoon: "afternoon",
//       Night: "night",
//       Flexible: "flexible"
//     }, value => {
//       state.answers.shift = value;
//       state.step++;
//       hirePayStep();
//     });
//   }

//   function hirePayStep() {
//     renderStepContent("What pay range are you offering?", {
//       Low: "low",
//       Medium: "medium",
//       High: "high"
//     }, value => {
//       state.answers.pay = value;
//       state.step++;
//       hireLocationStep();
//     });
//   }

//   function hireLocationStep() {
//     renderStepContent("Where is the job located?", {
//       "Near Me": "near",
//       Remote: "remote",
//       "Specific Area": "specific"
//     }, value => {
//       state.answers.location = value;
//       state.step++;
//       summaryStep();
//     });
//   }

//   // --- Summary Step ---
//   function summaryStep() {
//     container.innerHTML = "";
//     container.appendChild(Stepper({ steps: new Array(state.totalSteps).fill(""), currentStep: state.step }));

//     container.appendChild(createElement("h2", {}, ["Summary of your choices:"]));
//     const summary = createElement("pre", {}, [JSON.stringify(state.answers, null, 2)]);
//     container.appendChild(summary);

//     // Finish Button
//     const finishBtn = Button("Finish", "btn-finish", {
//       click: () => {
//         localStorage.setItem("baitoOnboarding", JSON.stringify(state.answers));
//         console.log("Final answers saved:", state.answers);
//         modalInstance.remove();
//       }
//     }, "buttonx");
//     container.appendChild(finishBtn);

//     // Back Button
//     if (state.history.length > 0) {
//       const backBtn = Button("Back", "btn-back", {
//         click: () => {
//           const prev = state.history.pop();
//           state.step = Math.max(1, state.step - 1);
//           prev();
//         }
//       }, "button-back");
//       container.appendChild(backBtn);
//     }
//   }

//   // --- Start or Skip ---
//   const saved = localStorage.getItem("baitoOnboarding");
//   if (saved) {
//     console.log("User already onboarded:", JSON.parse(saved));
//     modalInstance.remove();
//   } else {
//     startStep();
//   }
// }

// export { OnboardingModal as Onboarding };

// // import { createElement } from "../../components/createElement.js";
// // import { Button } from "../../components/base/Button.js";
// // import Modal from "../../components/ui/Modal.mjs";

// // export function OnboardingModal() {

// //   // --- Stepper Component ---
// //   function Stepper({ steps, currentStep }) {
// //     const container = createElement("div", { class: "stepper", style: "display:flex; gap:6px; margin-bottom:15px;" }, []);
// //     steps.forEach((step, index) => {
// //       const stepEl = createElement("div", {
// //         class: `step ${index + 1 < currentStep ? "completed" : index + 1 === currentStep ? "active" : "pending"}`,
// //         style: `
// //           flex:1; height:10px; border-radius:5px;
// //           background:${index + 1 < currentStep ? "#4caf50" : index + 1 === currentStep ? "#2196F3" : "#ddd"};
// //           transition: background 0.3s;
// //         `
// //       });
// //       container.appendChild(stepEl);
// //     });
// //     return container;
// //   }

// //   // --- Modal Setup ---
// //   const modalInstance = Modal({
// //     title: "Baito Onboarding",
// //     size: "large",
// //     content: () => createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []),
// //     onClose: () => console.log("Onboarding modal closed"),
// //     closeOnOverlayClick: false
// //   });

// //   const container = modalInstance.querySelector("#onboarding-container");
// //   container.innerHTML = "";

// //   // --- State ---
// //   const state = {
// //     step: 0,
// //     answers: {},
// //     path: "work",
// //     stepsList: [],
// //     totalSteps: 0,
// //     prevStepFn: null
// //   };

// //   // --- Utility: render step content ---
// //   function renderStepContent(titleText, options, callback, showBack = true) {
// //     container.innerHTML = "";

// //     // Stepper
// //     container.appendChild(Stepper({ steps: new Array(state.totalSteps).fill(""), currentStep: state.step }));

// //     // Title
// //     container.appendChild(createElement("h2", {}, [titleText]));

// //     // Options
// //     Object.entries(options).forEach(([label, value]) => {
// //       const btn = Button(label, `btn-${label}`, {
// //         click: () => callback(value)
// //       }, "buttonx");
// //       container.appendChild(btn);
// //     });

// //     // Back Button
// //     if (showBack && state.prevStepFn) {
// //       const backBtn = Button("Back", "btn-back", {
// //         click: () => {
// //           state.step--;
// //           state.prevStepFn();
// //         }
// //       }, "button-back");
// //       container.appendChild(backBtn);
// //     }
// //   }

// //   // --- Step Functions ---

// //   // Start
// //   function startStep() {
// //     state.step = 1;
// //     state.totalSteps = 5; // max for now, will adjust dynamically
// //     renderStepContent("Do you want to Work or Hire?", {
// //       Work: "work",
// //       Hire: "hire"
// //     }, choice => {
// //       state.answers.choice = choice;
// //       state.path = choice.toLowerCase();
// //       state.prevStepFn = startStep;

// //       // Adjust total steps dynamically
// //       state.totalSteps = state.path === "work" ? 5 : 4;
// //       state.step++;
// //       state.path === "work" ? workDaysStep() : hireWorkerTypeStep();
// //     }, false);
// //   }

// //   // --- Work Path ---
// //   function workDaysStep() {
// //     renderStepContent("How many days do you want to work?", {
// //       "1 Day": "1",
// //       "Few Days": "few",
// //       "Long Term": "long"
// //     }, value => {
// //       state.answers.days = value;
// //       state.prevStepFn = workDaysStep;
// //       state.step++;
// //       workTypeStep();
// //     });
// //   }

// //   function workTypeStep() {
// //     renderStepContent("Select work type", {
// //       Kitchen: "kitchen",
// //       Delivery: "delivery",
// //       Cleaning: "cleaning"
// //     }, value => {
// //       state.answers.type = value;
// //       state.prevStepFn = workTypeStep;
// //       state.step++;
// //       workShiftStep();
// //     });
// //   }

// //   function workShiftStep() {
// //     renderStepContent("Preferred shift timing?", {
// //       Morning: "morning",
// //       Afternoon: "afternoon",
// //       Night: "night"
// //     }, value => {
// //       state.answers.shift = value;
// //       state.prevStepFn = workShiftStep;
// //       state.step++;
// //       workLocationStep();
// //     });
// //   }

// //   function workLocationStep() {
// //     renderStepContent("Preferred work location?", {
// //       "Near Me": "near",
// //       Remote: "remote"
// //     }, value => {
// //       state.answers.location = value;
// //       state.prevStepFn = workLocationStep;
// //       state.step++;
// //       summaryStep();
// //     });
// //   }

// //   // --- Hire Path ---
// //   function hireWorkerTypeStep() {
// //     renderStepContent("What type of worker are you looking to hire?", {
// //       "Part-Time": "parttime",
// //       "Full-Time": "fulltime"
// //     }, value => {
// //       state.answers.hireType = value;
// //       state.prevStepFn = hireWorkerTypeStep;
// //       state.step++;
// //       hirePayStep();
// //     });
// //   }

// //   function hirePayStep() {
// //     renderStepContent("Expected pay range?", {
// //       Low: "low",
// //       Medium: "medium",
// //       High: "high"
// //     }, value => {
// //       state.answers.pay = value;
// //       state.prevStepFn = hirePayStep;
// //       state.step++;
// //       hireLocationStep();
// //     });
// //   }

// //   function hireLocationStep() {
// //     renderStepContent("Preferred location for hired staff?", {
// //       "Near Me": "near",
// //       Remote: "remote"
// //     }, value => {
// //       state.answers.location = value;
// //       state.prevStepFn = hireLocationStep;
// //       state.step++;
// //       summaryStep();
// //     });
// //   }

// //   // --- Summary Step ---
// //   function summaryStep() {
// //     container.innerHTML = "";
// //     container.appendChild(Stepper({ steps: new Array(state.totalSteps).fill(""), currentStep: state.step }));

// //     container.appendChild(createElement("h2", {}, ["Summary of your choices:"]));
// //     const summary = createElement("pre", {}, [JSON.stringify(state.answers, null, 2)]);
// //     container.appendChild(summary);

// //     // Finish Button
// //     const finishBtn = Button("Finish", "btn-finish", {
// //       click: () => {
// //         console.log("Final answers submitted:", state.answers);
// //         modalInstance.remove();
// //       }
// //     }, "buttonx");
// //     container.appendChild(finishBtn);

// //     // Back Button to edit last step
// //     const backBtn = Button("Back", "btn-back", {
// //       click: () => {
// //         state.step--;
// //         state.path === "work" ? workLocationStep() : hireLocationStep();
// //       }
// //     }, "button-back");
// //     container.appendChild(backBtn);
// //   }

// //   // --- Start Onboarding ---
// //   startStep();
// // }

// // export { OnboardingModal as Onboarding };


// // // import { createElement } from "../../components/createElement.js";
// // // import { Button } from "../../components/base/Button.js";
// // // import Modal from "../../components/ui/Modal.mjs";

// // // export function OnboardingModal() {

// // //   const modalInstance = Modal({
// // //     title: "Baito Onboarding",
// // //     size: "large",
// // //     content: () => createElement("div", { id: "onboarding-container", class: "onboarding-box" }, []),
// // //     onClose: () => console.log("Onboarding modal closed"),
// // //     closeOnOverlayClick: true
// // //   });

// // //   const container = modalInstance.querySelector("#onboarding-container");
// // //   container.innerHTML = "";

// // //   const state = { step: 0, totalSteps: 5, answers: {} };

// // //   function renderStep(stepFn) {
// // //     container.innerHTML = "";
// // //     stepFn();
// // //     renderProgressBar();
// // //   }

// // //   function renderProgressBar() {
// // //     const progressContainer = createElement("div", { class: "progress-container", style: "margin-bottom:10px; width:100%; background:#eee; height:8px; border-radius:4px;" });
// // //     const fill = createElement("div", {
// // //       class: "progress-fill",
// // //       style: `width:${(state.step / state.totalSteps) * 100}%; background:#4caf50; height:100%; border-radius:4px; transition: width 0.3s;`
// // //     });
// // //     progressContainer.appendChild(fill);
// // //     container.prepend(progressContainer);
// // //   }

// // //   // ---- Steps ----
// // //   function startStep() {
// // //     state.step = 1;
// // //     const title = createElement("h2", {}, ["Do you want to Work or Hire?"]);
// // //     const workBtn = Button("Work", "btn-work", { click: () => { state.answers.choice = "Work"; renderStep(workDaysStep); } }, "buttonx");
// // //     const hireBtn = Button("Hire", "btn-hire", { click: () => { state.answers.choice = "Hire"; renderStep(hireStep); } }, "buttonx");
// // //     container.append(title, workBtn, hireBtn);
// // //   }

// // //   // --- Work Path ---
// // //   function workDaysStep() {
// // //     state.step = 2;
// // //     const title = createElement("h2", {}, ["How many days do you want to work?"]);
// // //     const oneDayBtn = Button("1 Day", "btn-1day", { click: () => { state.answers.days = "1"; renderStep(workTypeStep); } }, "buttonx");
// // //     const fewDaysBtn = Button("Few Days", "btn-fewdays", { click: () => { state.answers.days = "Few"; renderStep(workTypeStep); } }, "buttonx");
// // //     const longTermBtn = Button("Long Term", "btn-longterm", { click: () => { state.answers.days = "Long"; renderStep(workTypeStep); } }, "buttonx");
// // //     container.append(title, oneDayBtn, fewDaysBtn, longTermBtn);
// // //   }

// // //   function workTypeStep() {
// // //     state.step = 3;
// // //     const title = createElement("h2", {}, ["Select work type"]);
// // //     const kitchenBtn = Button("Kitchen", "btn-kitchen", { click: () => { state.answers.type = "Kitchen"; renderStep(workShiftStep); } }, "buttonx");
// // //     const deliveryBtn = Button("Delivery", "btn-delivery", { click: () => { state.answers.type = "Delivery"; renderStep(workShiftStep); } }, "buttonx");
// // //     const cleaningBtn = Button("Cleaning", "btn-cleaning", { click: () => { state.answers.type = "Cleaning"; renderStep(workShiftStep); } }, "buttonx");
// // //     container.append(title, kitchenBtn, deliveryBtn, cleaningBtn);
// // //   }

// // //   function workShiftStep() {
// // //     state.step = 4;
// // //     const title = createElement("h2", {}, ["Preferred shift timing?"]);
// // //     const morningBtn = Button("Morning", "btn-morning", { click: () => { state.answers.shift = "Morning"; renderStep(workLocationStep); } }, "buttonx");
// // //     const afternoonBtn = Button("Afternoon", "btn-afternoon", { click: () => { state.answers.shift = "Afternoon"; renderStep(workLocationStep); } }, "buttonx");
// // //     const nightBtn = Button("Night", "btn-night", { click: () => { state.answers.shift = "Night"; renderStep(workLocationStep); } }, "buttonx");
// // //     container.append(title, morningBtn, afternoonBtn, nightBtn);
// // //   }

// // //   function workLocationStep() {
// // //     state.step = 5;
// // //     const title = createElement("h2", {}, ["Preferred work location?"]);
// // //     const nearBtn = Button("Near Me", "btn-near", { click: () => { state.answers.location = "Near"; renderStep(finalStep); } }, "buttonx");
// // //     const remoteBtn = Button("Remote", "btn-remote", { click: () => { state.answers.location = "Remote"; renderStep(finalStep); } }, "buttonx");
// // //     container.append(title, nearBtn, remoteBtn);
// // //   }

// // //   // --- Hire Path ---
// // //   function hireStep() {
// // //     state.step = 2;
// // //     const title = createElement("h2", {}, ["What type of worker are you looking to hire?"]);
// // //     const partTimeBtn = Button("Part-Time", "btn-parttime", { click: () => { state.answers.hireType = "Part-Time"; renderStep(hirePayStep); } }, "buttonx");
// // //     const fullTimeBtn = Button("Full-Time", "btn-fulltime", { click: () => { state.answers.hireType = "Full-Time"; renderStep(hirePayStep); } }, "buttonx");
// // //     container.append(title, partTimeBtn, fullTimeBtn);
// // //   }

// // //   function hirePayStep() {
// // //     state.step = 3;
// // //     const title = createElement("h2", {}, ["Expected pay range?"]);
// // //     const lowBtn = Button("Low", "btn-low", { click: () => { state.answers.pay = "Low"; renderStep(hireLocationStep); } }, "buttonx");
// // //     const midBtn = Button("Medium", "btn-mid", { click: () => { state.answers.pay = "Medium"; renderStep(hireLocationStep); } }, "buttonx");
// // //     const highBtn = Button("High", "btn-high", { click: () => { state.answers.pay = "High"; renderStep(hireLocationStep); } }, "buttonx");
// // //     container.append(title, lowBtn, midBtn, highBtn);
// // //   }

// // //   function hireLocationStep() {
// // //     state.step = 4;
// // //     const title = createElement("h2", {}, ["Preferred work location for hired staff?"]);
// // //     const nearBtn = Button("Near Me", "btn-near", { click: () => { state.answers.location = "Near"; renderStep(finalStep); } }, "buttonx");
// // //     const remoteBtn = Button("Remote", "btn-remote", { click: () => { state.answers.location = "Remote"; renderStep(finalStep); } }, "buttonx");
// // //     container.append(title, nearBtn, remoteBtn);
// // //   }

// // //   // --- Final Step ---
// // //   function finalStep() {
// // //     state.step = state.totalSteps;
// // //     const title = createElement("h2", {}, ["Thank you! Your preferences have been recorded."]);
// // //     const summary = createElement("pre", {}, [JSON.stringify(state.answers, null, 2)]);
// // //     container.append(title, summary);
// // //     renderProgressBar();
// // //   }

// // //   // start onboarding
// // //   renderStep(startStep);
// // // }

// // // export { OnboardingModal as Onboarding };
