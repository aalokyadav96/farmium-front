import { createElement } from "../../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../../api/api.js";
import Snackbar from "../../../components/ui/Snackbar.mjs";
import { getState } from "../../../state/state.js";
import { navigate } from "../../../routes/index.js";
import { editBaito } from "../create/editBaito.js";
import Button from "../../../components/base/Button.js";
import { showApplicantsModal } from "../dash/baitoEmployerDash.js";
import { ImageGallery } from "../../../components/ui/IMageGallery.mjs";
import { displayReviews } from "../../reviews/displayReviews.js";
import SnackBar from "../../../components/ui/Snackbar.mjs";
import { meChat } from "../../mechat/plugnplay.js";

/**
 * Stub: Start chat with employer
 */
function startChatWithEmployer(userId, baitoId, container) {
  meChat(userId, container, "baito",  baitoId );
}

/**
 * Stub: Upload resume feature
 */
function uploadResumeFeature() {
  SnackBar("Resume upload feature is under development.",1000);
}

/**
 * Stub: Leave a review
 */
// function leaveReview(baitoId) {
//   alert(`Leave review feature for job ${baitoId} is coming soon.`);
// }

/**
 * Stub: View application history (owner only)
 */
function storeApplicationHistory(baitoId) {
  SnackBar(`Application history for job ${baitoId} is coming soon.`,1000);
}

function renderExpandableDescription(text = "") {
  const descP = createElement("p", { class: "baito-description" }, []);
  const isLong = text.length > 300;
  descP.textContent = isLong ? text.slice(0, 300) + "…" : text;

  if (!isLong) return descP;

  const btn = Button("Show More", "toggle-desc", {
    click: () => {
      descP.textContent = text;
      btn.remove();
    }
  }, "btn btn-secondary");

  return createElement("div", {}, [descP, btn]);
}

function renderOwnerControls(baito) {
  return createElement("div", { class: "baito-owner-controls" }, [
    Button("✏️ Edit Job", "baito-edit-btn", { click: () => editBaito(baito) }, "buttonx btn-secondary"),
    Button("📨 View Applicants", "view-applicants-btn", { click: () => showApplicantsModal(baito) }, "buttonx btn-secondary"),
    Button("🗑 Delete Job", "delete-baito-btn", {
      click: async () => {
        if (!confirm("Delete this job permanently?")) return;
        try {
          await apiFetch(`/baitos/baito/${baito._id}`, "DELETE");
          Snackbar("✅ Deleted", 2000);
          navigate("/baitos");
        } catch {
          Snackbar("❌ Failed to delete.", 2000);
        }
      }
    }, "buttonx btn-danger"),
    Button("📜 Application History", "app-history-btn", {
      click: () => storeApplicationHistory(baito._id)
    }, "buttonx btn-secondary"),
    Button("Chats", "chats-btn-baito", {
      click: () => navigate("/merechats")
    }, "buttonx btn-secondary")
  ]);
}

function renderApplicantControls(baito, baitoid, isOwner, container, isLoggedIn) {
  return createElement("div", { class: "baito-user-controls" }, [
    Button("📩 Apply / Contact", "apply-btn", {
      click: async (e) => {
        const btn = e.currentTarget;
        if (!isLoggedIn) return Snackbar("Please log in to apply for this job.", 3000);
        const pitch = prompt("Write a short message to the employer:");
        if (!pitch?.trim()) return Snackbar("Application cancelled.", 2000);

        btn.disabled = true;
        btn.textContent = "Applying...";
        try {
          const form = new FormData();
          form.append("pitch", pitch.trim());
          const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", form);
          Snackbar(res.success ? "✅ Application sent!" : res.message, 3000);
          btn.textContent = "Applied";
        } catch {
          Snackbar("❌ Failed to apply.", 3000);
          btn.disabled = false;
          btn.textContent = "📩 Apply / Contact";
        }
      }
    }, "buttonx btn-primary"),

    Button("⭐ Save Job", "save-job-btn", {
      click: () => {
        const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
        if (!saved.includes(baito._id)) {
          saved.push(baito._id);
          localStorage.setItem("savedJobs", JSON.stringify(saved));
          Snackbar("Saved!", 2000);
        }
      }
    }, "buttonx btn-bookmark"),

    Button("🚩 Report Listing", "report-btn", {
      click: async () => {
        const reason = prompt("Why are you reporting this job?");
        if (!reason?.trim()) return;
        try {
          await apiFetch(`/baitos/baito/${baitoid}/report`, "POST", { reason: reason.trim() });
          Snackbar("✅ Report submitted", 2000);
        } catch {
          Snackbar("❌ Failed to report", 2000);
        }
      }
    }, "buttonx btn-danger"),

    Button("💬 Chat with Employer", "chat-btn", { click: () => startChatWithEmployer(baito.ownerId, baitoid, container) }, "buttonx btn-secondary"),
    Button("📎 Upload Resume", "upload-resume-btn", { click: () => uploadResumeFeature() }, "buttonx btn-secondary"),
    Button("⭐ Leave Review", "leave-review-btn", { click: () => displayReviews(container, isOwner, isLoggedIn, "baito", baitoid) }, "buttonx btn-secondary")
  ]);
}

export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
  contentContainer.innerHTML = "";

  try {
    const baito = await apiFetch(`/baitos/baito/${baitoid}`);
    const section = createElement("div", { class: "baito-detail" });

    section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

    if (baito.employer) {
      const avatar = baito.employer.avatar
        ? createElement("img", { src: baito.employer.avatar, alt: "Employer", class: "employer-avatar" })
        : null;
      const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);
      const verifiedBadge = baito.employer.verified
        ? createElement("span", { class: "verified-badge" }, ["✅ Verified"])
        : null;
      section.appendChild(createElement("div", { class: "baito-employer" }, [avatar, name, verifiedBadge].filter(Boolean)));
    }

    const metaLines = [
      baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
      baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
      baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
      baito.location ? `📍 Location: ${baito.location}` : null,
      baito.phone ? `📞 Contact: ${baito.phone}` : null,
      baito.deadline ? `⏳ Apply by: ${new Date(baito.deadline).toLocaleDateString()}` : null,
      baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
    ];
    section.appendChild(createElement("div", { class: "baito-meta" }, metaLines.filter(Boolean).map(t => createElement("p", {}, [t]))));

    if (Array.isArray(baito.tags) && baito.tags.length) {
      section.appendChild(createElement("div", { class: "baito-tags" },
        baito.tags.map(tag => createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`]))
      ));
    }

    const requirements = Array.isArray(baito.requirements) ? baito.requirements : (baito.requirements ? [baito.requirements] : []);
    if (requirements.length) {
      section.appendChild(createElement("div", { class: "baito-reqs" }, [
        createElement("h4", {}, ["📌 Requirements"]),
        createElement("ul", {}, requirements.map(r => createElement("li", {}, [r])))
      ]));
    }

    if (baito.description) {
      section.appendChild(renderExpandableDescription(baito.description));
    }

    section.appendChild(createElement("img", {
      src: baito.banner ? `${SRC_URL}/uploads/baitos/${baito.banner}` : "/fallback.jpg",
      alt: "Job Banner",
      class: "baito-banner",
      loading: "lazy"
    }));

    let reviewSec = createElement('div',{},[]);

    const isOwner = getState("user") === baito.ownerId;
    section.appendChild(isOwner ? renderOwnerControls(baito) : renderApplicantControls(baito, baitoid, isOwner, reviewSec, isLoggedIn));

    section.appendChild(reviewSec);

    const cleanImageNames = baito.images?.filter(Boolean) || [];
    if (cleanImageNames.length) {
      const fullURLs = cleanImageNames.map(name => `${SRC_URL}/uploads/baitos/${name}`);
      section.appendChild(ImageGallery(fullURLs));
    }

    if (baito.coords?.lat && baito.coords?.lng) {
      section.appendChild(createElement("iframe", {
        src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
        width: "100%",
        height: "300",
        class: "baito-map",
        loading: "lazy",
        allowfullscreen: true
      }));
    }

    if (baito.category) {
      try {
        const similarJobs = await apiFetch(`/baitos/related?category=${baito.category}&exclude=${baitoid}`);
        if (similarJobs.length) {
          const details = createElement("details", { class: "baito-related-details" }, [
            createElement("summary", {}, ["🔎 Similar Jobs"])
          ]);
          similarJobs.slice(0, 4).forEach(job => {
            details.appendChild(createElement("div", { class: "baito-related-card" }, [
              createElement("p", {}, [job.title || "Untitled"]),
              Button("View", "", { click: () => navigate(`/baito/${job._id}`) }, "btn btn-sm")
            ]));
          });
          section.appendChild(details);
        }
      } catch {
        console.warn("Failed to load similar jobs");
      }
    }

    contentContainer.appendChild(section);
  } catch (error) {
    contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
    console.error("Failed to fetch baito:", error);
  }
}

// import { createElement } from "../../components/createElement.js";
// import { SRC_URL, apiFetch } from "../../api/api.js";
// import Snackbar from "../../components/ui/Snackbar.mjs";
// import { getState } from "../../state/state.js";
// import { navigate } from "../../routes/index.js";
// import { editBaito } from "./editBaito.js";
// import Button from "../../components/base/Button.js";
// import { showApplicantsModal } from "./baitoEmployerDash.js";
// import { ImageGallery } from "../../components/ui/IMageGallery.mjs";

// /**
//  * Stub: Start chat with employer
//  */
// function startChatWithEmployer(baitoId) {
//   alert(`Chat feature for job ${baitoId} is coming soon.`);
// }

// /**
//  * Stub: Upload resume feature
//  */
// function uploadResumeFeature() {
//   alert("Resume upload feature is under development.");
// }

// /**
//  * Stub: Leave a review
//  */
// function leaveReview(baitoId) {
//   alert(`Leave review feature for job ${baitoId} is coming soon.`);
// }

// /**
//  * Stub: View application history (owner only)
//  */
// function storeApplicationHistory(baitoId) {
//   alert(`Application history for job ${baitoId} is coming soon.`);
// }

// export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
//   contentContainer.innerHTML = "";

//   try {
//     const baito = await apiFetch(`/baitos/baito/${baitoid}`);
//     const section = createElement("div", { class: "baito-detail" });

//     // Title
//     section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

//     // Employer Info + Verified Badge
//     if (baito.employer) {
//       const avatar = baito.employer.avatar
//         ? createElement("img", {
//           src: baito.employer.avatar,
//           alt: "Employer",
//           class: "employer-avatar"
//         })
//         : null;
//       const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);
//       const verifiedBadge = baito.employer.verified
//         ? createElement("span", { class: "verified-badge" }, ["✅ Verified"])
//         : null;
//       section.appendChild(createElement(
//         "div",
//         { class: "baito-employer" },
//         [avatar, name, verifiedBadge].filter(Boolean)
//       ));
//     }

//     // Meta Info
//     const metaLines = [
//       baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
//       baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
//       baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
//       baito.location ? `📍 Location: ${baito.location}` : null,
//       baito.phone ? `📞 Contact: ${baito.phone}` : null,
//       baito.deadline ? `⏳ Apply by: ${new Date(baito.deadline).toLocaleDateString()}` : null,
//       baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
//     ];
//     section.appendChild(createElement(
//       "div",
//       { class: "baito-meta" },
//       metaLines.filter(Boolean).map(text => createElement("p", {}, [text]))
//     ));

//     // Tags
//     if (Array.isArray(baito.tags) && baito.tags.length) {
//       section.appendChild(createElement(
//         "div",
//         { class: "baito-tags" },
//         baito.tags.map(tag => createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`]))
//       ));
//     }

//     // Requirements
//     if (Array.isArray(baito.requirements) && baito.requirements.length) {
//       section.appendChild(createElement(
//         "div",
//         { class: "baito-reqs" },
//         [
//           createElement("h4", {}, ["📌 Requirements"]),
//           createElement("ul", {}, baito.requirements.map(r => createElement("li", {}, [r])))
//         ]
//       ));
//     }

//     // Description (expandable)
//     if (baito.description) {
//       const shortText = baito.description.slice(0, 300);
//       const descP = createElement("p", { class: "baito-description" }, [shortText + (baito.description.length > 300 ? "…" : "")]);
//       section.appendChild(descP);
//       if (baito.description.length > 300) {
//         const toggleBtn = Button("Show More", "toggle-desc", {
//           click: () => {
//             descP.textContent = baito.description;
//             toggleBtn.remove();
//           }
//         }, "btn btn-secondary");
//         section.appendChild(toggleBtn);
//       }
//     }

//     // Banner
//     section.appendChild(createElement("img", {
//       src: baito.banner ? `${SRC_URL}/uploads/baitos/${baito.banner}` : "/fallback.jpg",
//       alt: "Job Banner",
//       class: "baito-banner",
//       loading: "lazy"
//     }));

//     const isOwner = getState("user") === baito.ownerId;

//     if (isOwner) {
//       // Owner: Edit, View Applicants, Delete, Application History
//       section.appendChild(Button("✏️ Edit Job", "baito-edit-btn", { click: () => editBaito(baito) }, "btn btn-secondary"));
//       //   section.appendChild(Button("📨 View Applicants", "view-applicants-btn", { click: () => navigate(`/baitos/${baitoid}/applicants`) }, "btn btn-secondary"));
//       section.appendChild(Button("📨 View Applicants", "view-applicants-btn", {
//         click: () => {
//           showApplicantsModal(baito);
//         }
//       }, "btn btn-secondary"));
//       section.appendChild(Button("🗑 Delete Job", "delete-baito-btn", {
//         click: async () => {
//           if (!confirm("Delete this job permanently?")) return;
//           try {
//             await apiFetch(`/baitos/baito/${baitoid}`, "DELETE");
//             Snackbar("✅ Deleted", 2000);
//             navigate("/baitos");
//           } catch {
//             Snackbar("❌ Failed to delete.", 2000);
//           }
//         }
//       }, "btn btn-danger"));
//       section.appendChild(Button("📜 Application History", "app-history-btn", {
//         click: () => storeApplicationHistory(baitoid)
//       }, "btn btn-secondary"));
//     } else {
//       // Applicant: Apply, Save, Report, Chat, Upload Resume, Leave Review
//       const applyBtn = Button("📩 Apply / Contact", "apply-btn", {
//         click: async () => {
//           if (!isLoggedIn) {
//             Snackbar("Please log in to apply for this job.", 3000);
//             return;
//           }
//           const pitch = prompt("Write a short message to the employer:");
//           if (!pitch?.trim()) {
//             Snackbar("Application cancelled.", 2000);
//             return;
//           }
//           applyBtn.disabled = true;
//           applyBtn.textContent = "Applying...";
//           try {
//             const payload = new FormData();
//             payload.append("pitch", pitch.trim());
//             const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);
//             if (res.success) {
//               Snackbar("✅ Application sent!", 3000);
//               applyBtn.textContent = "Applied";
//             } else {
//               throw new Error(res.message);
//             }
//           } catch {
//             Snackbar("❌ Failed to apply.", 3000);
//             applyBtn.disabled = false;
//             applyBtn.textContent = "📩 Apply / Contact";
//           }
//         }
//       }, "btn btn-primary");
//       section.appendChild(applyBtn);

//       section.appendChild(Button("⭐ Save Job", "save-job-btn", {
//         click: () => {
//           const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
//           if (!saved.includes(baito._id)) {
//             saved.push(baito._id);
//             localStorage.setItem("savedJobs", JSON.stringify(saved));
//             Snackbar("Saved!", 2000);
//           }
//         }
//       }, "btn btn-bookmark"));

//       section.appendChild(Button("🚩 Report Listing", "report-btn", {
//         click: async () => {
//           const reason = prompt("Why are you reporting this job?");
//           if (!reason?.trim()) return;
//           try {
//             await apiFetch(`/baitos/baito/${baitoid}/report`, "POST", { reason: reason.trim() });
//             Snackbar("✅ Report submitted", 2000);
//           } catch {
//             Snackbar("❌ Failed to report", 2000);
//           }
//         }
//       }, "btn btn-danger"));

//       section.appendChild(Button("💬 Chat with Employer", "chat-btn", {
//         click: () => startChatWithEmployer(baitoid)
//       }, "btn btn-secondary"));

//       section.appendChild(Button("📎 Upload Resume", "upload-resume-btn", {
//         click: () => uploadResumeFeature()
//       }, "btn btn-secondary"));

//       section.appendChild(Button("⭐ Leave Review", "leave-review-btn", {
//         click: () => leaveReview(baitoid)
//       }, "btn btn-secondary"));
//     }

//     // // Extra Images
//     // if (Array.isArray(baito.images) && baito.images.length) {
//     //   const imgContainer = createElement("div", { class: "baito-images" });
//     //   baito.images.forEach(url =>
//     //     imgContainer.appendChild(createElement("img", {
//     //       src: `${SRC_URL}/uploads/baitos/${url}`,
//     //       alt: "Baito Photo",
//     //       class: "baito-photo",
//     //       loading: "lazy"
//     //     }))
//     //   );
//     //   section.appendChild(imgContainer);
//     // }


//     if (Array.isArray(baito.images) && baito.images.length) {
//       const fullURLs = baito.images.map(name => `${SRC_URL}/uploads/baitos/${name}`);
//       const gallery = ImageGallery(fullURLs);
//       section.appendChild(gallery);
//     }
    


//     // Map Embed
//     if (baito.coords?.lat && baito.coords?.lng) {
//       section.appendChild(createElement("iframe", {
//         src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
//         width: "100%",
//         height: "300",
//         class: "baito-map",
//         loading: "lazy",
//         allowfullscreen: true
//       }));
//     }

//     // Related Jobs - Collapsible
//     if (baito.category) {
//       try {
//         const similarJobs = await apiFetch(`/baitos/related?category=${baito.category}&exclude=${baitoid}`);
//         if (similarJobs.length) {
//           const details = createElement("details", { class: "baito-related-details" }, [
//             createElement("summary", {}, ["🔎 Similar Jobs"])
//           ]);
//           similarJobs.forEach(job => {
//             details.appendChild(createElement("div", { class: "baito-related-card" }, [
//               createElement("p", {}, [job.title || "Untitled"]),
//               Button("View", "", { click: () => navigate(`/baito/${job._id}`) }, "btn btn-sm")
//             ]));
//           });
//           section.appendChild(details);
//         }
//       } catch {
//         console.warn("Failed to load similar jobs");
//       }
//     }

//     contentContainer.appendChild(section);
//   } catch (error) {
//     contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
//     console.error("Failed to fetch baito:", error);
//   }
// }

// // import { createElement } from "../../components/createElement.js";
// // import { SRC_URL, apiFetch } from "../../api/api.js";
// // import Snackbar from "../../components/ui/Snackbar.mjs";
// // import { getState } from "../../state/state.js";
// // import { navigate } from "../../routes/index.js";
// // import { editBaito } from "./editBaito.js";
// // import Button from "../../components/base/Button.js";

// // // ⛔ Stubbed for future feature planning
// // function startChatWithEmployer() {}
// // function uploadResumeFeature() {}
// // function leaveReview() {}
// // function storeApplicationHistory() {}

// // export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
// //   contentContainer.innerHTML = "";

// //   try {
// //     const baito = await apiFetch(`/baitos/baito/${baitoid}`);
// //     const section = createElement("div", { class: "baito-detail" });

// //     section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

// //     // Employer Info + Verified Badge
// //     if (baito.employer) {
// //       const avatar = baito.employer.avatar
// //         ? createElement("img", {
// //             src: baito.employer.avatar,
// //             alt: "Employer",
// //             class: "employer-avatar"
// //           })
// //         : null;

// //       const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);

// //       const verifiedBadge = baito.employer.verified
// //         ? createElement("span", { class: "verified-badge" }, ["✅ Verified"])
// //         : null;

// //       const employerBox = createElement("div", { class: "baito-employer" }, [avatar, name, verifiedBadge].filter(Boolean));
// //       section.appendChild(employerBox);
// //     }

// //     // Meta Info
// //     const metaLines = [
// //       baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
// //       baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
// //       baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
// //       baito.location ? `📍 Location: ${baito.location}` : null,
// //       baito.phone ? `📞 Contact: ${baito.phone}` : null,
// //       baito.deadline ? `⏳ Apply by: ${new Date(baito.deadline).toLocaleDateString()}` : null,
// //       baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
// //     ];

// //     const metaBox = createElement("div", { class: "baito-meta" }, metaLines.filter(Boolean).map(text => createElement("p", {}, [text])));
// //     section.appendChild(metaBox);

// //     // Tags
// //     if (Array.isArray(baito.tags) && baito.tags.length) {
// //       const tagBox = createElement("div", { class: "baito-tags" }, baito.tags.map(tag =>
// //         createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`])
// //       ));
// //       section.appendChild(tagBox);
// //     }

// //     // Requirements
// //     if (Array.isArray(baito.requirements) && baito.requirements.length > 0) {
// //       const reqBox = createElement("div", { class: "baito-reqs" }, [
// //         createElement("h4", {}, ["📌 Requirements"]),
// //         createElement("ul", {}, baito.requirements.map(r => createElement("li", {}, [r])))
// //       ]);
// //       section.appendChild(reqBox);
// //     }

// //     // Description (expandable)
// //     if (baito.description) {
// //       const descP = createElement("p", { class: "baito-description" }, [baito.description.slice(0, 300) + (baito.description.length > 300 ? "…" : "")]);
// //       const toggleBtn = baito.description.length > 300
// //         ? Button("Show More", "toggle-desc", {
// //             click: () => {
// //               descP.textContent = baito.description;
// //               toggleBtn.remove();
// //             }
// //           }, "btn btn-secondary")
// //         : null;

// //       section.appendChild(descP);
// //       if (toggleBtn) section.appendChild(toggleBtn);
// //     }

// //     // Banner
// //     section.appendChild(createElement("img", {
// //       src: baito.banner ? `${SRC_URL}/uploads/baitos/${baito.banner}` : "/fallback.jpg",
// //       alt: "Job Banner",
// //       class: "baito-banner",
// //       loading: "lazy"
// //     }));

// //     const isOwner = getState("user") === baito.ownerId;

// //     // EDIT
// //     if (isOwner) {
// //       section.appendChild(Button("✏️ Edit Job", "baito-edit-btn", { click: () => editBaito(baito) }, "baito-edit-btn"));

// //       section.appendChild(Button("📨 View Applicants", "view-applicants", {
// //         click: () => navigate(`/baitos/${baitoid}/applicants`)
// //       }, "btn btn-secondary"));

// //       section.appendChild(Button("🗑 Delete Job", "delete-baito-btn", {
// //         click: async () => {
// //           if (!confirm("Delete this job permanently?")) return;
// //           try {
// //             await apiFetch(`/baitos/baito/${baitoid}`, "DELETE");
// //             Snackbar("✅ Deleted", 2000);
// //             navigate("/baitos");
// //           } catch (err) {
// //             Snackbar("❌ Failed to delete.", 2000);
// //           }
// //         }
// //       }, "btn btn-danger"));
// //     } else {
// //       // Apply
// //       const applyBtn = Button("📩 Apply / Contact", "apply-btn", {
// //         click: async () => {
// //           if (!isLoggedIn) {
// //             Snackbar("Please log in to apply for this job.", 3000);
// //             return;
// //           }

// //           const pitch = prompt("Write a short message to the employer:");
// //           if (!pitch || !pitch.trim()) {
// //             Snackbar("Application cancelled.", 2000);
// //             return;
// //           }

// //           applyBtn.disabled = true;
// //           applyBtn.textContent = "Applying...";

// //           try {
// //             const payload = new FormData();
// //             payload.append("pitch", pitch.trim());
// //             const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);

// //             if (res.success) {
// //               Snackbar("✅ Application sent!", 3000);
// //               applyBtn.textContent = "Applied";
// //             } else {
// //               throw new Error(res.message || "Server error");
// //             }
// //           } catch (err) {
// //             Snackbar("❌ Failed to apply.", 3000);
// //             applyBtn.disabled = false;
// //             applyBtn.textContent = "📩 Apply / Contact";
// //           }
// //         }
// //       }, "btn btn-primary");

// //       section.appendChild(applyBtn);

// //       // Save Job
// //       section.appendChild(Button("⭐ Save Job", "save-job-btn", {
// //         click: () => {
// //           const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
// //           if (!saved.includes(baito._id)) {
// //             saved.push(baito._id);
// //             localStorage.setItem("savedJobs", JSON.stringify(saved));
// //             Snackbar("Saved!", 2000);
// //           }
// //         }
// //       }, "btn btn-bookmark"));

// //       // Report
// //       section.appendChild(Button("🚩 Report Listing", "report-btn", {
// //         click: async () => {
// //           const reason = prompt("Why are you reporting this job?");
// //           if (!reason || !reason.trim()) return;

// //           try {
// //             await apiFetch(`/baitos/baito/${baitoid}/report`, "POST", { reason: reason.trim() });
// //             Snackbar("✅ Report submitted", 2000);
// //           } catch (err) {
// //             Snackbar("❌ Failed to report", 2000);
// //           }
// //         }
// //       }, "btn btn-danger"));
// //     }

// //     // Extra Images
// //     if (Array.isArray(baito.images) && baito.images.length > 0) {
// //       const imgContainer = createElement("div", { class: "baito-images" });
// //       baito.images.forEach(url => {
// //         imgContainer.appendChild(createElement("img", {
// //           src: `${SRC_URL}/${url}`,
// //           alt: "Baito Photo",
// //           class: "baito-photo",
// //           loading: "lazy"
// //         }));
// //       });
// //       section.appendChild(imgContainer);
// //     }

// //     // Map Embed
// //     if (baito.coords?.lat && baito.coords?.lng) {
// //       section.appendChild(createElement("iframe", {
// //         src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
// //         width: "100%",
// //         height: "300",
// //         class: "baito-map",
// //         loading: "lazy",
// //         allowfullscreen: true
// //       }));
// //     }

// //     // Related jobs by category (optional, async)
// //     if (baito.category) {
// //       try {
// //         const similarJobs = await apiFetch(`/baitos/related?category=${baito.category}&exclude=${baitoid}`);
// //         if (Array.isArray(similarJobs) && similarJobs.length) {
// //           const similarSection = createElement("div", { class: "baito-related" }, [
// //             createElement("h4", {}, ["🔎 Similar Jobs"]),
// //             ...similarJobs.map(job =>
// //               createElement("div", { class: "baito-related-card" }, [
// //                 createElement("p", {}, [job.title || "Untitled"]),
// //                 Button("View", "", { click: () => navigate(`/baito/${job._id}`) }, "btn btn-sm")
// //               ])
// //             )
// //           ]);
// //           section.appendChild(similarSection);
// //         }
// //       } catch (err) {
// //         console.warn("Failed to load similar jobs", err);
// //       }
// //     }

// //     contentContainer.appendChild(section);

// //   } catch (error) {
// //     contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
// //     console.error("Failed to fetch baito:", error);
// //   }
// // }

// // // import { createElement } from "../../components/createElement.js";
// // // import { SRC_URL, apiFetch } from "../../api/api.js";
// // // import Snackbar from "../../components/ui/Snackbar.mjs";
// // // import { getState } from "../../state/state.js";
// // // import { navigate } from "../../routes/index.js";
// // // import { editBaito } from "./editBaito.js";
// // // import Button from "../../components/base/Button.js";

// // // export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
// // //     contentContainer.innerHTML = "";

// // //     try {
// // //         const baito = await apiFetch(`/baitos/baito/${baitoid}`);
// // //         const section = createElement("div", { class: "baito-detail" });

// // //         // Title
// // //         section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

// // //         // Employer Info
// // //         if (baito.employer) {
// // //             const avatar = baito.employer.avatar
// // //                 ? createElement("img", {
// // //                     src: baito.employer.avatar,
// // //                     alt: "Employer",
// // //                     class: "employer-avatar"
// // //                 })
// // //                 : null;

// // //             const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);

// // //             const employerBox = createElement("div", { class: "baito-employer" }, [avatar, name].filter(Boolean));
// // //             section.appendChild(employerBox);
// // //         }

// // //         // Meta Section
// // //         const metaLines = [
// // //             baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
// // //             baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
// // //             baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
// // //             baito.location ? `📍 Location: ${baito.location}` : null,
// // //             baito.phone ? `📞 Contact: ${baito.phone}` : null,
// // //             baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
// // //         ];

// // //         const metaBox = createElement("div", { class: "baito-meta" },
// // //             metaLines.filter(Boolean).map(line => createElement("p", {}, [line]))
// // //         );
// // //         section.appendChild(metaBox);

// // //         // Tags
// // //         if (Array.isArray(baito.tags) && baito.tags.length) {
// // //             const tagBox = createElement("div", { class: "baito-tags" },
// // //                 baito.tags.map(tag =>
// // //                     createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`])
// // //                 )
// // //             );
// // //             section.appendChild(tagBox);
// // //         }

// // //         // Description
// // //         if (baito.description) {
// // //             section.appendChild(createElement("p", { class: "baito-description" }, [baito.description]));
// // //         }

// // //         // Banner
// // //         const banner = createElement("img", {
// // //             src: baito.banner ? `${SRC_URL}/uploads/baitos/${baito.banner}` : "/fallback.jpg",
// // //             alt: "Job Banner",
// // //             class: "baito-banner",
// // //             loading: "lazy"
// // //         });
// // //         section.appendChild(banner);

// // //         // EDIT BUTTON (if owner)
// // //         const isOwner = getState("user") === baito.ownerId;
// // //         if (isOwner) {
// // //             const editBtn = Button("✏️ Edit Job","baito-edit-btn",{
// // //                 click: () => {
// // //                     editBaito(baito);
// // //                 }
// // //             }, "baito-edit-btn")
// // //             // const editBtn = createElement("button", {
// // //             //     class: "baito-edit-btn"
// // //             // }, ["✏️ Edit Job"]);

// // //             // editBtn.onclick = () => {
// // //             //     // navigate(`/baito/${baitoid}/edit`);
// // //             //     editBaito(baito);
// // //             // };

// // //             section.appendChild(editBtn);
// // //         }

// // //         // Extra Images
// // //         if (Array.isArray(baito.images) && baito.images.length > 0) {
// // //             const imgContainer = createElement("div", { class: "baito-images" });
// // //             baito.images.forEach(url => {
// // //                 imgContainer.appendChild(createElement("img", {
// // //                     src: `${SRC_URL}/${url}`,
// // //                     alt: "Baito Photo",
// // //                     class: "baito-photo",
// // //                     loading: "lazy"
// // //                 }));
// // //             });
// // //             section.appendChild(imgContainer);
// // //         }

// // //         // Map Embed
// // //         if (baito.coords?.lat && baito.coords?.lng) {
// // //             const mapFrame = createElement("iframe", {
// // //                 src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
// // //                 width: "100%",
// // //                 height: "300",
// // //                 class: "baito-map",
// // //                 loading: "lazy",
// // //                 allowfullscreen: true
// // //             });
// // //             section.appendChild(mapFrame);
// // //         }

// // //         // Apply Button (only if not creator)
// // //         const isCreator = isLoggedIn && baito.ownerId === getState("user");
// // //         if (!isCreator) {
// // //             const applyBtn = createElement("button", { class: "baito-apply-btn" }, ["📩 Apply / Contact"]);
// // //             applyBtn.onclick = async () => {
// // //                 if (!isLoggedIn) {
// // //                     Snackbar("Please log in to apply for this job.", 3000);
// // //                     return;
// // //                 }

// // //                 const pitch = prompt("Write a short message to the employer:");
// // //                 if (!pitch || !pitch.trim()) {
// // //                     Snackbar("Application cancelled.", 2000);
// // //                     return;
// // //                 }

// // //                 applyBtn.disabled = true;
// // //                 applyBtn.textContent = "Applying...";

// // //                 try {
// // //                     const payload = new FormData();
// // //                     payload.append("pitch", pitch.trim());

// // //                     const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);
// // //                     if (res.success) {
// // //                         Snackbar("✅ Application sent!", 3000);
// // //                         applyBtn.textContent = "Applied";
// // //                     } else {
// // //                         throw new Error(res.message || "Server error");
// // //                     }
// // //                 } catch (err) {
// // //                     Snackbar("❌ Failed to apply.", 3000);
// // //                     applyBtn.disabled = false;
// // //                     applyBtn.textContent = "📩 Apply / Contact";
// // //                     console.error(err);
// // //                 }
// // //             };

// // //             section.appendChild(applyBtn);
// // //         }

// // //         contentContainer.appendChild(section);

// // //     } catch (error) {
// // //         contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
// // //         console.error("Failed to fetch baito:", error);
// // //     }
// // // }
