import { createElement } from "../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import { getState } from "../../state/state.js";
import { navigate } from "../../routes/index.js";
import { editBaito } from "./editBaito.js";
import Button from "../../components/base/Button.js";

export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
    contentContainer.innerHTML = "";

    try {
        const baito = await apiFetch(`/baitos/baito/${baitoid}`);
        const section = createElement("div", { class: "baito-detail" });

        // Title
        section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

        // Employer Info
        if (baito.employer) {
            const avatar = baito.employer.avatar
                ? createElement("img", {
                    src: baito.employer.avatar,
                    alt: "Employer",
                    class: "employer-avatar"
                })
                : null;

            const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);

            const employerBox = createElement("div", { class: "baito-employer" }, [avatar, name].filter(Boolean));
            section.appendChild(employerBox);
        }

        // Meta Section
        const metaLines = [
            baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
            baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
            baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
            baito.location ? `📍 Location: ${baito.location}` : null,
            baito.phone ? `📞 Contact: ${baito.phone}` : null,
            baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
        ];

        const metaBox = createElement("div", { class: "baito-meta" },
            metaLines.filter(Boolean).map(line => createElement("p", {}, [line]))
        );
        section.appendChild(metaBox);

        // Tags
        if (Array.isArray(baito.tags) && baito.tags.length) {
            const tagBox = createElement("div", { class: "baito-tags" },
                baito.tags.map(tag =>
                    createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`])
                )
            );
            section.appendChild(tagBox);
        }

        // Description
        if (baito.description) {
            section.appendChild(createElement("p", { class: "baito-description" }, [baito.description]));
        }

        // Banner
        const banner = createElement("img", {
            src: baito.banner ? `${SRC_URL}/uploads/baitos/${baito.banner}` : "/fallback.jpg",
            alt: "Job Banner",
            class: "baito-banner",
            loading: "lazy"
        });
        section.appendChild(banner);

        // EDIT BUTTON (if owner)
        const isOwner = getState("user") === baito.ownerId;
        if (isOwner) {
            const editBtn = Button("✏️ Edit Job","baito-edit-btn",{
                click: () => {
                    editBaito(baito);
                }
            }, "baito-edit-btn")
            // const editBtn = createElement("button", {
            //     class: "baito-edit-btn"
            // }, ["✏️ Edit Job"]);

            // editBtn.onclick = () => {
            //     // navigate(`/baito/${baitoid}/edit`);
            //     editBaito(baito);
            // };

            section.appendChild(editBtn);
        }

        // Extra Images
        if (Array.isArray(baito.images) && baito.images.length > 0) {
            const imgContainer = createElement("div", { class: "baito-images" });
            baito.images.forEach(url => {
                imgContainer.appendChild(createElement("img", {
                    src: `${SRC_URL}/${url}`,
                    alt: "Baito Photo",
                    class: "baito-photo",
                    loading: "lazy"
                }));
            });
            section.appendChild(imgContainer);
        }

        // Map Embed
        if (baito.coords?.lat && baito.coords?.lng) {
            const mapFrame = createElement("iframe", {
                src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
                width: "100%",
                height: "300",
                class: "baito-map",
                loading: "lazy",
                allowfullscreen: true
            });
            section.appendChild(mapFrame);
        }

        // Apply Button (only if not creator)
        const isCreator = isLoggedIn && baito.ownerId === getState("user");
        if (!isCreator) {
            const applyBtn = createElement("button", { class: "baito-apply-btn" }, ["📩 Apply / Contact"]);
            applyBtn.onclick = async () => {
                if (!isLoggedIn) {
                    Snackbar("Please log in to apply for this job.", 3000);
                    return;
                }

                const pitch = prompt("Write a short message to the employer:");
                if (!pitch || !pitch.trim()) {
                    Snackbar("Application cancelled.", 2000);
                    return;
                }

                applyBtn.disabled = true;
                applyBtn.textContent = "Applying...";

                try {
                    const payload = new FormData();
                    payload.append("pitch", pitch.trim());

                    const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);
                    if (res.success) {
                        Snackbar("✅ Application sent!", 3000);
                        applyBtn.textContent = "Applied";
                    } else {
                        throw new Error(res.message || "Server error");
                    }
                } catch (err) {
                    Snackbar("❌ Failed to apply.", 3000);
                    applyBtn.disabled = false;
                    applyBtn.textContent = "📩 Apply / Contact";
                    console.error(err);
                }
            };

            section.appendChild(applyBtn);
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

// export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
//     contentContainer.innerHTML = "";

//     try {
//         const baito = await apiFetch(`/baitos/baito/${baitoid}`);
//         const section = createElement("div", { class: "baito-detail" });

//         // Title
//         section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

//         // Employer Info
//         if (baito.employer) {
//             const avatar = baito.employer.avatar
//                 ? createElement("img", {
//                     src: baito.employer.avatar,
//                     alt: "Employer",
//                     class: "employer-avatar"
//                 })
//                 : null;

//             const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);

//             const employerBox = createElement("div", { class: "baito-employer" }, [avatar, name].filter(Boolean));
//             section.appendChild(employerBox);
//         }

//         // Meta Section
//         const metaLines = [
//             baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
//             baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
//             baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
//             baito.location ? `📍 Location: ${baito.location}` : null,
//             baito.phone ? `📞 Contact: ${baito.phone}` : null,
//             baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
//         ];

//         const metaBox = createElement("div", { class: "baito-meta" },
//             metaLines.filter(Boolean).map(line => createElement("p", {}, [line]))
//         );
//         section.appendChild(metaBox);

//         // Tags
//         if (Array.isArray(baito.tags) && baito.tags.length) {
//             const tagBox = createElement("div", { class: "baito-tags" },
//                 baito.tags.map(tag =>
//                     createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`])
//                 )
//             );
//             section.appendChild(tagBox);
//         }

//         // Description
//         if (baito.description) {
//             section.appendChild(createElement("p", { class: "baito-description" }, [baito.description]));
//         }

//         // Banner
//         const banner = createElement("img", {
//             src: baito.banner ? `${SRC_URL}/uploads/baitos/${baito.banner}` : "/fallback.jpg",
//             alt: "Job Banner",
//             class: "baito-banner",
//             loading: "lazy"
//         });
//         section.appendChild(banner);

//         // Extra Images
//         if (Array.isArray(baito.images) && baito.images.length > 0) {
//             const imgContainer = createElement("div", { class: "baito-images" });
//             baito.images.forEach(url => {
//                 imgContainer.appendChild(createElement("img", {
//                     src: `${SRC_URL}/${url}`,
//                     alt: "Baito Photo",
//                     class: "baito-photo",
//                     loading: "lazy"
//                 }));
//             });
//             section.appendChild(imgContainer);
//         }

//         // Map Embed
//         if (baito.coords?.lat && baito.coords?.lng) {
//             const mapFrame = createElement("iframe", {
//                 src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
//                 width: "100%",
//                 height: "300",
//                 class: "baito-map",
//                 loading: "lazy",
//                 allowfullscreen: true
//             });
//             section.appendChild(mapFrame);
//         }

//         // Apply Button (only if not creator)
//         const isCreator = isLoggedIn && baito.ownerId == getState("user");
//         if (!isCreator) {
//             const applyBtn = createElement("button", { class: "baito-apply-btn" }, ["📩 Apply / Contact"]);
//             applyBtn.onclick = async () => {
//                 if (!isLoggedIn) {
//                     Snackbar("Please log in to apply for this job.", 3000);
//                     return;
//                 }

//                 const pitch = prompt("Write a short message to the employer:");
//                 if (!pitch || !pitch.trim()) {
//                     Snackbar("Application cancelled.", 2000);
//                     return;
//                 }

//                 applyBtn.disabled = true;
//                 applyBtn.textContent = "Applying...";

//                 try {
//                     const payload = new FormData();
//                     payload.append("pitch", pitch.trim());

//                     const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);
//                     if (res.success) {
//                         Snackbar("✅ Application sent!", 3000);
//                         applyBtn.textContent = "Applied";
//                     } else {
//                         throw new Error(res.message || "Server error");
//                     }
//                 } catch (err) {
//                     Snackbar("❌ Failed to apply.", 3000);
//                     applyBtn.disabled = false;
//                     applyBtn.textContent = "📩 Apply / Contact";
//                     console.error(err);
//                 }
//             };

//             section.appendChild(applyBtn);
//         }

//         contentContainer.appendChild(section);

//     } catch (error) {
//         contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
//         console.error("Failed to fetch baito:", error);
//     }
// }

// // import { createElement } from "../../components/createElement.js";
// // import { SRC_URL, apiFetch } from "../../api/api.js";
// // import Snackbar from "../../components/ui/Snackbar.mjs";

// // export async function displayBaito(isLoggedIn, baitoid, contentContainer) {
// //     contentContainer.innerHTML = "";

// //     try {
// //         const baito = await apiFetch(`/baitos/baito/${baitoid}`);
// //         const section = createElement("div", { class: "baito-detail" });

// //         // Title
// //         section.appendChild(createElement("h2", { class: "baito-title" }, [baito.title || "Untitled Job"]));

// //         // Employer Info
// //         if (baito.employer) {
// //             const avatar = baito.employer.avatar
// //                 ? createElement("img", {
// //                     src: baito.employer.avatar,
// //                     alt: "Employer",
// //                     class: "employer-avatar"
// //                 })
// //                 : null;

// //             const name = createElement("span", {}, [baito.employer.name || "Anonymous Employer"]);

// //             const employerBox = createElement("div", { class: "baito-employer" }, [avatar, name].filter(Boolean));
// //             section.appendChild(employerBox);
// //         }

// //         // Meta Section (removed jobType)
// //         const metaLines = [
// //             baito.category && baito.subcategory ? `📂 ${baito.category} › ${baito.subcategory}` : null,
// //             baito.wage ? `💴 Wage: ¥${Number(baito.wage).toLocaleString()}/hour` : null,
// //             baito.workHours ? `⏰ Hours: ${baito.workHours}` : null,
// //             baito.location ? `📍 Location: ${baito.location}` : null,
// //             baito.phone ? `📞 Contact: ${baito.phone}` : null,
// //             baito.createdAt ? `📅 Posted: ${new Date(baito.createdAt).toLocaleDateString()}` : null
// //         ];

// //         const metaBox = createElement("div", { class: "baito-meta" },
// //             metaLines.filter(Boolean).map(line => createElement("p", {}, [line]))
// //         );
// //         section.appendChild(metaBox);

// //         // Tags
// //         if (Array.isArray(baito.tags) && baito.tags.length) {
// //             const tagBox = createElement("div", { class: "baito-tags" },
// //                 baito.tags.map(tag =>
// //                     createElement("span", { class: "baito-tag" }, [`#${tag.trim()}`])
// //                 )
// //             );
// //             section.appendChild(tagBox);
// //         }

// //         // Description
// //         if (baito.description) {
// //             section.appendChild(createElement("p", { class: "baito-description" }, [baito.description]));
// //         }

// //         // Banner (with fallback)
// //         const banner = createElement("img", {
// //             src: baito.banner ? `${SRC_URL}/${baito.banner}` : "/fallback.jpg",
// //             alt: "Job Banner",
// //             class: "baito-banner",
// //             loading: "lazy"
// //         });
// //         section.appendChild(banner);

// //         // Extra Images
// //         if (Array.isArray(baito.images) && baito.images.length > 0) {
// //             const imgContainer = createElement("div", { class: "baito-images" });
// //             baito.images.forEach(url => {
// //                 imgContainer.appendChild(createElement("img", {
// //                     src: `${SRC_URL}/${url}`,
// //                     alt: "Baito Photo",
// //                     class: "baito-photo",
// //                     loading: "lazy"
// //                 }));
// //             });
// //             section.appendChild(imgContainer);
// //         }

// //         // Map Embed
// //         if (baito.coords?.lat && baito.coords?.lng) {
// //             const mapFrame = createElement("iframe", {
// //                 src: `https://maps.google.com/maps?q=${baito.coords.lat},${baito.coords.lng}&z=15&output=embed`,
// //                 width: "100%",
// //                 height: "300",
// //                 class: "baito-map",
// //                 loading: "lazy",
// //                 allowfullscreen: true
// //             });
// //             section.appendChild(mapFrame);
// //         }

// //         // Apply Button
// //         const applyBtn = createElement("button", { class: "baito-apply-btn" }, ["📩 Apply / Contact"]);
// //         applyBtn.onclick = async () => {
// //             if (!isLoggedIn) {
// //                 Snackbar("Please log in to apply for this job.", 3000);
// //                 return;
// //             }

// //             const pitch = prompt("Write a short message to the employer:");
// //             if (!pitch || !pitch.trim()) {
// //                 Snackbar("Application cancelled.", 2000);
// //                 return;
// //             }

// //             applyBtn.disabled = true;
// //             applyBtn.textContent = "Applying...";

// //             try {
// //                 const payload = new FormData();
// //                 payload.append("pitch", pitch.trim());

// //                 const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);
// //                 if (res.success) {
// //                     Snackbar("✅ Application sent!", 3000);
// //                     applyBtn.textContent = "Applied";
// //                 } else {
// //                     throw new Error(res.message || "Server error");
// //                 }
// //             } catch (err) {
// //                 Snackbar("❌ Failed to apply.", 3000);
// //                 applyBtn.disabled = false;
// //                 applyBtn.textContent = "📩 Apply / Contact";
// //                 console.error(err);
// //             }
// //         };

// //         section.appendChild(applyBtn);
// //         contentContainer.appendChild(section);

// //     } catch (error) {
// //         contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
// //         console.error("Failed to fetch baito:", error);
// //     }
// // }

// // // import { createElement } from "../../components/createElement.js";
// // // import { SRC_URL, apiFetch } from "../../api/api.js";
// // // import Snackbar from "../../components/ui/Snackbar.mjs";

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
// // //             baito.jobType ? `🧾 Job Type: ${baito.jobType}` : null,
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
// // //         if (baito.banner) {
// // //             const banner = createElement("img", {
// // //                 src: `${SRC_URL}/${baito.banner}`,
// // //                 alt: "Job Banner",
// // //                 class: "baito-banner",
// // //                 loading: "lazy"
// // //             });
// // //             section.appendChild(banner);
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

// // //         // Map Embed (Optional)
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

// // //         // Call to Action
// // //         const applyBtn = createElement("button", { class: "baito-apply-btn" }, ["📩 Apply / Contact"]);
// // //         applyBtn.onclick = async () => {
// // //             if (!isLoggedIn) {
// // //                 Snackbar("Please log in to apply for this job.", 3000);
// // //                 return;
// // //             }
        
// // //             const pitch = prompt("Write a short message to the employer:");
// // //             if (!pitch || !pitch.trim()) {
// // //                 Snackbar("Application cancelled.", 2000);
// // //                 return;
// // //             }
        
// // //             applyBtn.disabled = true;
// // //             applyBtn.textContent = "Applying...";
        
// // //             try {
// // //                 const payload = new FormData();
// // //                 payload.append("pitch", pitch.trim());
        
// // //                 const res = await apiFetch(`/baitos/baito/${baitoid}/apply`, "POST", payload);
// // //                 if (res.success) {
// // //                     Snackbar("✅ Application sent!", 3000);
// // //                     applyBtn.textContent = "Applied";
// // //                 } else {
// // //                     throw new Error(res.message || "Server error");
// // //                 }
// // //             } catch (err) {
// // //                 Snackbar("❌ Failed to apply.", 3000);
// // //                 applyBtn.disabled = false;
// // //                 applyBtn.textContent = "📩 Apply / Contact";
// // //                 console.error(err);
// // //             }
// // //         };
                
// // //         section.appendChild(applyBtn);

// // //         contentContainer.appendChild(section);
// // //     } catch (error) {
// // //         contentContainer.appendChild(createElement("p", {}, ["🚫 Unable to load job details. Please try again later."]));
// // //         console.error("Failed to fetch baito:", error);
// // //     }
// // // }