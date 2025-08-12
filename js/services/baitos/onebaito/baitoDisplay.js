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
import Notify from "../../../components/ui/Notify.mjs";

import { meChat } from "../../mechat/plugnplay.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { updateImageWithCrop } from "../../../utils/bannerEditor.js";

/**
 * Stub: Start chat with employer
 */
function startChatWithEmployer(userId, baitoId, container) {
  meChat(userId, container, "baito", baitoId);
}

/**
 * Stub: Upload resume feature
 */
function uploadResumeFeature() {
  Notify("Resume upload feature is under development.", { duration: 1000 });
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
  Notify(`Application history for job ${baitoId} is coming soon.`, { duration: 1000 });
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
          await apiFetch(`/baitos/baito/${baito.baitoid}`, "DELETE");
          Snackbar("✅ Deleted", 2000);
          navigate("/baitos");
        } catch {
          Snackbar("❌ Failed to delete.", 2000);
        }
      }
    }, "buttonx btn-danger"),
    Button("📜 Application History", "app-history-btn", {
      click: () => storeApplicationHistory(baito.baitoid)
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
        if (!saved.includes(baito.baitoid)) {
          saved.push(baito.baitoid);
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

async function fetchSimilarJobs(category, excludeId) {
  try {
    const jobs = await apiFetch(`/baitos/related?category=${category}&exclude=${excludeId}`);
    return jobs || [];
  } catch {
    console.warn("Failed to load similar jobs");
    return [];
  }
}

function createEmployerSection(employer) {
  if (!employer) return null;

  const avatar = employer.avatar
    ? createElement("img", {
        src: employer.avatar,
        alt: "Employer",
        class: "employer-avatar",
      })
    : null;

  const name = createElement("span", {}, [employer.name || "Anonymous Employer"]);

  const verifiedBadge = employer.verified
    ? createElement("span", { class: "verified-badge" }, ["✅ Verified"])
    : null;

  return createElement("div", { class: "baito-employer" }, [avatar, name, verifiedBadge].filter(Boolean));
}

function createMetaSection(baito) {
  const metaLines = [
    baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
    baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
    baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
    baito.location ? `📍 Location: ${baito.location}` : null,
    baito.phone ? `📞 Contact: ${baito.phone}` : null,
    baito.deadline ? `⏳ Apply by: ${new Date(baito.deadline).toLocaleDateString()}` : null,
    baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null,
  ].filter(Boolean);

  return createElement(
    "div",
    { class: "baito-meta" },
    metaLines.map(line => createElement("p", {}, [line]))
  );
}

function createTagsSection(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  return createElement(
    "div",
    { class: "baito-tags" },
    tags.map(tag => createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`]))
  );
}

function createRequirementsSection(requirements) {
  if (!requirements || (Array.isArray(requirements) && requirements.length === 0)) return null;

  const reqs = Array.isArray(requirements) ? requirements : [requirements];

  return createElement("div", { class: "baito-reqs" }, [
    createElement("h4", {}, ["📌 Requirements"]),
    createElement("ul", {}, reqs.map(r => createElement("li", {}, [r]))),
  ]);
}

function createBannerSection(baito) {
  const bannerImg = createElement("img", {
    src: resolveImagePath(EntityType.BAITO, PictureType.BANNER, baito.banner || "placeholder.jpg"),
    alt: "Job Banner",
    class: "baito-banner",
    loading: "lazy",
    id: "baito-banner-img",
  });

  bannerImg.onerror = () => {
    bannerImg.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.jpg");
  };

  const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
  bannerEditButton.addEventListener("click", () => {
    updateImageWithCrop({
      entityType: EntityType.BAITO,
      imageType: "banner",
      stateKey: "banner",
      stateEntityKey: "baito",
      previewElementId: "baito-banner-img",
      pictureType: PictureType.BANNER,
      entityId: baito.baitoid,
    });
  });

  return createElement("div", { class: "baito-banner-section" }, [bannerImg, bannerEditButton]);
}

async function appendSimilarJobs(section, category, excludeId) {
  const similarJobs = await fetchSimilarJobs(category, excludeId);
  if (similarJobs.length === 0) return;

  const details = createElement("details", { class: "baito-related-details" }, [
    createElement("summary", {}, ["🔎 Similar Jobs"]),
  ]);

  similarJobs.slice(0, 4).forEach(job => {
    details.appendChild(
      createElement("div", { class: "baito-related-card" }, [
        createElement("p", {}, [job.title || "Untitled"]),
        Button("View", "", { click: () => navigate(`/baito/${job.baitoid}`) }, "btn btn-sm"),
      ])
    );
  });

  section.appendChild(details);
}

export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
  contentContainer.innerHTML = "";

  try {
    const baito = await apiFetch(`/baitos/baito/${baitoid}`);
    const section = createElement("div", { class: "baito-detail" });

    section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

    const employerSection = createEmployerSection(baito.employer);
    if (employerSection) section.appendChild(employerSection);

    section.appendChild(createMetaSection(baito));

    const tagsSection = createTagsSection(baito.tags);
    if (tagsSection) section.appendChild(tagsSection);

    const reqSection = createRequirementsSection(baito.requirements);
    if (reqSection) section.appendChild(reqSection);

    if (baito.description) {
      section.appendChild(renderExpandableDescription(baito.description));
    }

    section.appendChild(createBannerSection(baito));

    const reviewSec = createElement("div", {}, []);
    const isOwner = getState("user") === baito.ownerId;
    const controls = isOwner
      ? renderOwnerControls(baito)
      : renderApplicantControls(baito, baitoid, isOwner, reviewSec, isLoggedIn);

    section.appendChild(controls);
    section.appendChild(reviewSec);

    // Gallery
    const cleanImageNames = baito.images?.filter(Boolean) || [];
    if (cleanImageNames.length) {
      const fullURLs = cleanImageNames.map(name =>
        resolveImagePath(EntityType.BAITO, PictureType.PHOTO, name)
      );
      section.appendChild(ImageGallery(fullURLs));
    }

    // Map
    if (baito.coords?.lat && baito.coords?.lng) {
      section.appendChild(
        createElement("iframe", {
          src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
          width: "100%",
          height: "300",
          class: "baito-map",
          loading: "lazy",
          allowfullscreen: true,
        })
      );
    }

    await appendSimilarJobs(section, baito.category, baitoid);

    contentContainer.appendChild(section);
  } catch (error) {
    contentContainer.appendChild(
      createElement("p", {}, ["🚫 Unable to load job details. Please try again later."])
    );
    console.error("Failed to fetch baito:", error);
  }
}


// export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
//   contentContainer.innerHTML = "";

//   try {
//     const baito = await apiFetch(`/baitos/baito/${baitoid}`);
//     const section = createElement("div", { class: "baito-detail" });

//     section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

//     // Employer Info
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

//       section.appendChild(
//         createElement("div", { class: "baito-employer" }, [avatar, name, verifiedBadge].filter(Boolean))
//       );
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

//     section.appendChild(
//       createElement("div", { class: "baito-meta" }, metaLines.filter(Boolean).map(t => createElement("p", {}, [t])))
//     );

//     // Tags
//     if (Array.isArray(baito.tags) && baito.tags.length) {
//       section.appendChild(
//         createElement("div", { class: "baito-tags" },
//           baito.tags.map(tag => createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`]))
//         )
//       );
//     }

//     // Requirements
//     const requirements = Array.isArray(baito.requirements)
//       ? baito.requirements
//       : baito.requirements
//         ? [baito.requirements]
//         : [];

//     if (requirements.length) {
//       section.appendChild(
//         createElement("div", { class: "baito-reqs" }, [
//           createElement("h4", {}, ["📌 Requirements"]),
//           createElement("ul", {}, requirements.map(r => createElement("li", {}, [r])))
//         ])
//       );
//     }

//     // Description
//     if (baito.description) {
//       section.appendChild(renderExpandableDescription(baito.description));
//     }
//     // Banner Image
//     const bannerImg = createElement("img", {
//       src: resolveImagePath(EntityType.BAITO, PictureType.BANNER, baito.banner || "placeholder.jpg"),
//       alt: "Job Banner",
//       class: "baito-banner",
//       loading: "lazy",
//       id: "baito-banner-img",
//     });

//     bannerImg.onerror = () => {
//       bannerImg.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.jpg");
//     };

//     // Edit button
//     const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
//     bannerEditButton.addEventListener("click", () => {
//       updateImageWithCrop({
//         entityType: EntityType.BAITO,
//         imageType: "banner",
//         stateKey: "banner",
//         stateEntityKey: "baito",
//         previewElementId: "baito-banner-img",
//         pictureType: PictureType.BANNER,
//         entityId: baito.baitoid,  // Confirm this is correct ID property
//       });
//     });

//     section.appendChild(bannerImg);
//     section.appendChild(bannerEditButton);


//     // Action Controls
//     const reviewSec = createElement("div", {}, []);
//     const isOwner = getState("user") === baito.ownerId;
//     const controls = isOwner
//       ? renderOwnerControls(baito)
//       : renderApplicantControls(baito, baitoid, isOwner, reviewSec, isLoggedIn);

//     section.appendChild(controls);
//     section.appendChild(reviewSec);

//     // Gallery
//     const cleanImageNames = baito.images?.filter(Boolean) || [];
//     if (cleanImageNames.length) {
//       const fullURLs = cleanImageNames.map(name =>
//         resolveImagePath(EntityType.BAITO, PictureType.PHOTO, name)
//       );
//       section.appendChild(ImageGallery(fullURLs));
//     }

//     // Map
//     if (baito.coords?.lat && baito.coords?.lng) {
//       section.appendChild(
//         createElement("iframe", {
//           src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
//           width: "100%",
//           height: "300",
//           class: "baito-map",
//           loading: "lazy",
//           allowfullscreen: true
//         })
//       );
//     }

//     // Related Jobs
//     if (baito.category) {
//       try {
//         const similarJobs = await apiFetch(`/baitos/related?category=${baito.category}&exclude=${baitoid}`);
//         if (similarJobs.length) {
//           const details = createElement("details", { class: "baito-related-details" }, [
//             createElement("summary", {}, ["🔎 Similar Jobs"])
//           ]);

//           similarJobs.slice(0, 4).forEach(job => {
//             details.appendChild(
//               createElement("div", { class: "baito-related-card" }, [
//                 createElement("p", {}, [job.title || "Untitled"]),
//                 Button("View", "", {
//                   click: () => navigate(`/baito/${job.baitoid}`)
//                 }, "btn btn-sm")
//               ])
//             );
//           });

//           section.appendChild(details);
//         }
//       } catch {
//         console.warn("Failed to load similar jobs");
//       }
//     }

//     contentContainer.appendChild(section);
//   } catch (error) {
//     contentContainer.appendChild(
//       createElement("p", {}, ["🚫 Unable to load job details. Please try again later."])
//     );
//     console.error("Failed to fetch baito:", error);
//   }
// }
