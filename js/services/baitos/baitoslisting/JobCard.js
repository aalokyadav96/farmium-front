import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import { navigate } from "../../../routes/index.js";
import { formatRelativeTime } from "../../../utils/dateUtils.js";
import { saveJob } from "./utils.js";
import { SRC_URL } from "../../../api/api.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

export function buildCard(job) {
  const bannerFilename = job.banner || "placeholder.jpg";
  const imgSrc = resolveImagePath(EntityType.BAITO, PictureType.THUMB, bannerFilename);
  console.log("-----",imgSrc);

  const wageText = job.wage ? `💴 ¥${Number(job.wage).toLocaleString()}/hr` : "💴 Not specified";
  const tags = Array.isArray(job.tags) ? job.tags : [];
  const typeInfo = job.type ? `🕒 ${job.type}` : "";
  const shift = job.shift ? `• ${job.shift}` : "";

  const saveBtn = Button("⭐ Save", `save-${job.baitoid}`, {
    click: () => saveJob(job.baitoid)
  }, "buttonx btn-bookmark");

  const badgeTags = tags.length
    ? createElement("div", { class: "baito-tags" }, tags.map(tag =>
        createElement("span", { class: "baito-tag" }, [`#${tag}`])
      ))
    : null;

  const img = createElement("img", {
    src: imgSrc,
    alt: job.title || "baito banner",
    loading: "lazy",
    class: "baito-banner-thumb"
  });

  img.onerror = () => {
    img.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.jpg");
  };

  const imageWrapper = createElement("div", { class: "baito-card-img" }, [img]);

  const contentWrapper = createElement("div", { class: "baito-card-content" }, [
    createElement("h3", { class: "baito-title" }, [job.title || "Untitled"]),
    createElement("p", { class: "baito-company" }, [job.company ? `🏢 ${job.company}` : "🏢 Unknown"]),
    createElement("p", { class: "baito-meta" }, [
      `📁 ${job.category || "?"} › ${job.subcategory || "?"} | ${wageText}`
    ]),
    createElement("p", { class: "baito-type-shift" }, [typeInfo, " ", shift]),
    createElement("p", { class: "baito-loc-time" }, [
      `📍 ${job.location || "Unknown"} • ${formatRelativeTime(job.createdAt)}`
    ]),
    ...(badgeTags ? [badgeTags] : []),
    createElement("div", { class: "baito-actions" }, [
      Button("🔎 View Details", `view-${job.baitoid}`, {
        click: () => navigate(`/baito/${job.baitoid}`)
      }, "buttonx btn-secondary"),
      saveBtn
    ])
  ]);

  return createElement("div", { class: "baito-card" }, [
    imageWrapper,
    contentWrapper
  ]);
}


// export function buildCard(job) {
//   const imgSrc = job.banner ? `${SRC_URL}/uploads/baitos/${job.banner}` : "/fallback.jpg";
//   const wageText = job.wage ? `💴 ¥${Number(job.wage).toLocaleString()}/hr` : "💴 Not specified";
//   const tags = Array.isArray(job.tags) ? job.tags : [];
//   const typeInfo = job.type ? `🕒 ${job.type}` : "";
//   const shift = job.shift ? `• ${job.shift}` : "";

//   const saveBtn = Button("⭐ Save", `save-${job._id}`, {
//     click: () => saveJob(job._id)
//   }, "buttonx btn-bookmark");

//   const badgeTags = tags.length
//     ? createElement("div", { class: "baito-tags" }, tags.map(tag =>
//         createElement("span", { class: "baito-tag" }, [`#${tag}`])
//       ))
//     : null;

//   const imageWrapper = createElement("div", { class: "baito-card-img" }, [
//     createElement("img", {
//       src: imgSrc,
//       alt: job.title || "baito banner",
//       loading: "lazy",
//       class: "baito-banner-thumb"
//     })
//   ]);

//   const contentWrapper = createElement("div", { class: "baito-card-content" }, [
//     createElement("h3", { class: "baito-title" }, [job.title || "Untitled"]),
//     createElement("p", { class: "baito-company" }, [job.company ? `🏢 ${job.company}` : "🏢 Unknown"]),
//     createElement("p", { class: "baito-meta" }, [
//       `📁 ${job.category || "?"} › ${job.subcategory || "?"} | ${wageText}`
//     ]),
//     createElement("p", { class: "baito-type-shift" }, [typeInfo, " ", shift]),
//     // createElement("p", { class: "baito-snippet" }, [job.description ? job.description.slice(0, 100) + "…" : "No description."]),
//     createElement("p", { class: "baito-loc-time" }, [
//       `📍 ${job.location || "Unknown"} • ${formatRelativeTime(job.createdAt)}`
//     ]),
//     ...(badgeTags ? [badgeTags] : []),
//     createElement("div", { class: "baito-actions" }, [
//       Button("🔎 View Details", `view-${job._id}`, {
//         click: () => navigate(`/baito/${job._id}`)
//       }, "buttonx btn-secondary"),
//       saveBtn
//     ])
//   ]);

//   return createElement("div", { class: "baito-card" }, [
//     imageWrapper,
//     contentWrapper
//   ]);
// }

// // import { createElement } from "../../../components/createElement.js";
// // import Button from "../../../components/base/Button.js";
// // import { navigate } from "../../../routes/index.js";
// // import { formatRelativeTime } from "../../../utils/dateUtils.js";
// // import { saveJob } from "./utils.js";
// // import { SRC_URL } from "../../../api/api.js";

// // export function buildCard(job) {
// //   const imgSrc = job.banner ? `${SRC_URL}/uploads/baitos/${job.banner}` : "/fallback.jpg";
// //   const wageText = job.wage ? `💴 ¥${Number(job.wage).toLocaleString()}/hr` : "💴 Not specified";
// //   const tags = Array.isArray(job.tags) ? job.tags : [];
// //   const typeInfo = job.type ? `🕒 ${job.type}` : "";
// //   const shift = job.shift ? `• ${job.shift}` : "";
// //   const badgeTags = tags.length
// //     ? createElement("div", { class: "baito-tags" }, tags.map(tag =>
// //         createElement("span", { class: "baito-tag" }, [`#${tag}`])
// //       ))
// //     : null;

// //   const saveBtn = Button("⭐ Save", `save-${job._id}`, {
// //     click: () => saveJob(job._id)
// //   }, "buttonx btn-bookmark");

// //   return createElement("div", { class: "baito-card" }, [
// //     createElement("img", { src: imgSrc, alt: job.title || "baito banner", class: "baito-banner-thumb", loading: "lazy" }),
// //     createElement("h3", {}, [job.title || "Untitled"]),
// //     createElement("p", {}, [job.company ? `🏢 ${job.company}` : "🏢 Unknown"]),
// //     createElement("p", { class: "baito-meta" }, [`📁 ${job.category || "?"} › ${job.subcategory || "?"} | ${wageText}`]),
// //     createElement("p", {}, [typeInfo, " ", shift]),
// //     createElement("p", { class: "baito-snippet" }, [job.description ? job.description.slice(0, 100) + "…" : "No description."]),
// //     createElement("p", { class: "baito-loc-time" }, [`📍 ${job.location || "Unknown"} • ${formatRelativeTime(job.createdAt)}`]),
// //     ...(badgeTags ? [badgeTags] : []),
// //     createElement("div", { class: "baito-actions" }, [
// //       Button("🔎 View Details", `view-${job._id}`, { click: () => navigate(`/baito/${job._id}`) }, "buttonx btn-secondary"),
// //       saveBtn
// //     ])
// //   ]);
// // }
